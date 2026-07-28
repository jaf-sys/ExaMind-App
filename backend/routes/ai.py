from flask import Blueprint, jsonify, request, current_app
from config import db
from models import Quiz, Question, QuestionFeedback
from google import genai
import json
import re
import time
import random
import hashlib
from datetime import datetime, timedelta
from functools import wraps

ai_bp = Blueprint("ai", __name__)

generation_cache = {}

def get_gemini_client():
    api_key = current_app.config.get("GEMINI_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    return None

rate_limit_store = {}

def rate_limit(max_requests=10, time_window=3600):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = None
            if request.is_json:
                user_id = request.json.get('user_id')
            
            if user_id:
                key = f"rate_limit:{user_id}"
                now = datetime.now()
                
                if key in rate_limit_store:
                    rate_limit_store[key] = [
                        t for t in rate_limit_store[key] 
                        if now - t < timedelta(seconds=time_window)
                    ]
                
                if key in rate_limit_store and len(rate_limit_store[key]) >= max_requests:
                    return jsonify({"error": "Rate limit exceeded. Try again later."}), 429
                
                if key not in rate_limit_store:
                    rate_limit_store[key] = []
                rate_limit_store[key].append(now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def estimate_tokens(text):
    return len(text) // 4

def call_gemini_with_retry(prompt, max_retries=5):
    client = get_gemini_client()
    if not client:
        return None, "AI service not configured"
    
    estimated_tokens = estimate_tokens(prompt)
    if estimated_tokens > 200000:
        return None, "Text too long, please shorten"
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="models/gemini-flash-lite-latest",
                contents=prompt
            )
            return response, None
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "rate limit" in error_str.lower():
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Rate limit hit, waiting {wait_time:.2f} seconds before retry {attempt + 1}/{max_retries}")
                    time.sleep(wait_time)
                else:
                    return None, f"AI service rate limit exceeded after {max_retries} attempts. Please try again later."
            else:
                return None, str(e)
    
    return None, "Max retries exceeded"

@ai_bp.route("/ai/generate-and-save/<int:quiz_id>", methods=["POST"])
def generate_and_save(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    existing_questions = Question.query.filter_by(quiz_id=quiz_id).count()
    
    if existing_questions > 0:
        print(" Questions already exist")
        return jsonify({"message": "Questions already exist"}), 200

    specific_subject = quiz.title
    broad_category = quiz.topic
    difficulty = quiz.difficulty

    if not specific_subject or not difficulty:
        print(" Missing topic or difficulty")
        return jsonify({"error": "Quiz missing topic or difficulty"}), 400

    num_questions = request.json.get("num_questions", 4) if request.is_json else 4

    client = get_gemini_client()
    if not client:
        print(" No Gemini client")
        return jsonify({"error": "AI service not configured"}), 503

    prompt = f"""
    Generate {num_questions} multiple choice questions about {specific_subject}.
    Difficulty: {difficulty}.
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {{
        "question_text": "Question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer_index": 0,
        "explanation": "Detailed explanation of why this answer is correct, including key concepts and reasoning"
      }}
    ]
     The explanation should be educational and help the student understand the concept.
    """

    
    response, error = call_gemini_with_retry(prompt)
    
    if error:
        print(f" Gemini error: {error}")
        return jsonify({"error": error}), 503


    try:
        raw_text = response.text
        cleaned = re.sub(r'```json\s*|\s*```', '', raw_text).strip()
        json_match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group()
        questions_data = json.loads(cleaned)
        
        if not isinstance(questions_data, list):
            questions_data = [questions_data]
            
        print(f"Parsed {len(questions_data)} questions")
        
    except Exception as e:
        print(f" Parse error: {str(e)}")
        print(f"Raw text that failed: {raw_text[:500]}")
        return jsonify({"error": f"AI returned invalid format: {str(e)}"}), 500

    saved_count = 0
    for i, q in enumerate(questions_data):
        
        if isinstance(q, dict) and "question_text" in q:
            question_text = q.get("question_text", "").strip()
            options = q.get("options", [])
            
            if not question_text:
                print(f" Skipping - no question text")
                continue
            
            if len(options) < 4:
                print(f" Skipping - not enough options ({len(options)})")
                continue
            
            correct_value = q.get("correct_answer_index", 0)
            correct_letter = 'A'
            
            if isinstance(correct_value, str):
                upper_val = correct_value.strip().upper()
                if upper_val in ['A', 'B', 'C', 'D']:
                    correct_letter = upper_val
                else:
                    try:
                        num_val = int(upper_val)
                        if 0 <= num_val <= 3:
                            correct_letter = chr(65 + num_val)
                    except ValueError:
                        correct_letter = 'A'
            else:
                try:
                    num_val = int(correct_value) if correct_value is not None else 0
                    if 0 <= num_val <= 3:
                        correct_letter = chr(65 + num_val)
                except (ValueError, TypeError):
                    correct_letter = 'A'
            
            question = Question(
                quiz_id=quiz_id,
                question_text=question_text,
                option_a=options[0][:200],
                option_b=options[1][:200],
                option_c=options[2][:200],
                option_d=options[3][:200],
                correct_option=correct_letter,
                source="ai"
            )
            db.session.add(question)
            db.session.flush()
            
            explanation = q.get("explanation","")
            if explanation:
                feedback = QuestionFeedback(
                    question_id=question.question_id,
                    explanation=explanation,
                    difficulty_rating=difficulty
                )
                db.session.add(feedback)
                
            saved_count += 1
            print(f" Added question {i+1}")

    print(f"Total saved: {saved_count}")
    
    if saved_count > 0:
        db.session.commit()
        return jsonify({
            "message": f"{saved_count} questions generated successfully",
            "source": "ai"
        }), 201
    else:
        return jsonify({"error": "Failed to generate valid questions"}), 500
    
@ai_bp.route("/ai/generate-from-text/<int:quiz_id>", methods=["POST"])
@rate_limit(max_requests=5, time_window=3600)
def generate_from_text(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    data = request.get_json()
    text_content = data.get("text", "")
    num_questions = data.get("num_questions", 5)
    difficulty = data.get("difficulty", "Medium")

    if not text_content or len(text_content.strip()) < 50:
        return jsonify({"error": "Text content too short (minimum 50 characters)"}), 400

    cache_key = hashlib.md5(f"{text_content[:100]}_{num_questions}_{difficulty}".encode()).hexdigest()
    if cache_key in generation_cache:
        print("Using cached result")
        questions_data = generation_cache[cache_key]
        return save_generated_questions(quiz_id, questions_data)

    client = get_gemini_client()
    if not client:
        return jsonify({"error": "AI service not configured. Please set GEMINI_API_KEY in .env"}), 503

    time.sleep(0.5)

    prompt = f"""
    Based on the following text, generate {num_questions} multiple choice questions.
    Difficulty: {difficulty}.
    
    Text content:
    {text_content[:3000]}
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {{
        "question_text": "Question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer_index": 0,
        "explanation": "Detailed explanation of why this answer is correct, based on the provided text"
      }}
    ]
    
    The correct_answer_index should be 0, 1, 2, or 3.
    Make sure questions test understanding of the provided text.
    The explanation should reference the specific parts of the text that support the correct answer.
    """

    response, error = call_gemini_with_retry(prompt)
    
    if error:
        return jsonify({"error": error}), 503

    try:
        raw_text = response.text
        cleaned = re.sub(r'```json\s*|\s*```', '', raw_text).strip()

        json_match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group()
            
        questions_data = json.loads(cleaned)

        if not isinstance(questions_data, list):
            questions_data = [questions_data]
            
        generation_cache[cache_key] = questions_data
        
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        return jsonify({"error": f"AI service error: {str(e)}"}), 503

    return save_generated_questions(quiz_id, questions_data)

def save_generated_questions(quiz_id, questions_data):
    saved_count = 0
    for q in questions_data:
        if isinstance(q, dict) and "question_text" in q:
            question_text = q.get("question_text", "").strip()
            options = q.get("options", [])
            
            if not question_text:
                continue
                
            if len(options) < 4:
                continue
            
            correct_value = q.get("correct_answer_index", 0)
            correct_letter = 'A'
            
            if isinstance(correct_value, str):
                upper_val = correct_value.strip().upper()
                if upper_val in ['A', 'B', 'C', 'D']:
                    correct_letter = upper_val
                    print(f"Using direct letter: {correct_letter}")
                else:
                    try:
                        num_val = int(upper_val)
                        if 0 <= num_val <= 3:
                            correct_letter = chr(65 + num_val)
                            print(f"Converted number {num_val} to letter {correct_letter}")
                        else:
                            correct_letter = 'A'
                    except ValueError:
                        correct_letter = 'A'
                        print(f"Could not parse '{correct_value}', defaulting to A")
            else:
                try:
                    num_val = int(correct_value) if correct_value is not None else 0
                    if 0 <= num_val <= 3:
                        correct_letter = chr(65 + num_val)
                        print(f"Converted number {num_val} to letter {correct_letter}")
                    else:
                        correct_letter = 'A'
                except (ValueError, TypeError):
                    correct_letter = 'A'
                
            question = Question(
                quiz_id=quiz_id,
                question_text=question_text,
                option_a=options[0][:200],
                option_b=options[1][:200],
                option_c=options[2][:200],
                option_d=options[3][:200],
                correct_option=correct_letter,
                source="ai-text"
            )
            db.session.add(question)
            db.session.flush()
            
            explanation = q.get("explanation","")
            if explanation:
                feedback = QuestionFeedback(
                    question_id=question.question_id,
                    explanation=explanation
                )
                db.session.add(feedback)
            saved_count += 1

    if saved_count > 0:
        db.session.commit()
        return jsonify({
            "message": f"{saved_count} questions generated from text",
            "source": "ai-text"
        }), 201
    else:
        return jsonify({"error": "Failed to generate valid questions from text"}), 500