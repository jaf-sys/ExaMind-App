from flask import Blueprint, request, jsonify
from config import db
from models import Question, QuestionFeedback

question_bp = Blueprint("question", __name__)

@question_bp.route("/question/add/<int:quiz_id>", methods=["POST"])
def add_question(quiz_id):
    data = request.json

    question_text = data.get("question_text")
    question_image = data.get("question_image")
    option_a = data.get("option_a")
    option_a_image = data.get("option_a_image")
    option_b = data.get("option_b")
    option_b_image = data.get("option_b_image")
    option_c = data.get("option_c")
    option_c_image = data.get("option_c_image")
    option_d = data.get("option_d")
    option_d_image = data.get("option_d_image")
    correct_option = data.get("correct_option")
    code_snippet = data.get("code_snippet")
    language = data.get("language")

    if not all([question_text, option_a, option_b, option_c, option_d, correct_option]):
        return jsonify({"message": "Missing data"}), 400

    question = Question(
        quiz_id=quiz_id,
        question_text=question_text,
        question_image=question_image,
        code_snippet=code_snippet,
        language=language,
        option_a=option_a,
        option_a_image=option_a_image,
        option_b=option_b,
        option_b_image=option_b_image,
        option_c=option_c,
        option_c_image=option_c_image,
        option_d=option_d,
        option_d_image=option_d_image,
        correct_option=correct_option
    )

    db.session.add(question)
    db.session.commit()

    return jsonify({"message": "Question added successfully"}), 201


@question_bp.route("/question/by-quiz/<int:quiz_id>", methods=["GET"])
def get_questions_by_quiz(quiz_id):
    questions = Question.query.filter_by(quiz_id=quiz_id).all()

    result = []
    for q in questions:
        result.append({
            "question_id": q.question_id,
            "question_text": q.question_text,
            "question_image": q.question_image,
            "code_snippet": q.code_snippet,
            "language": q.language,
            "option_a": q.option_a,
            "option_a_image": q.option_a_image,
            "option_b": q.option_b,
            "option_b_image": q.option_b_image,
            "option_c": q.option_c,
            "option_c_image": q.option_c_image,
            "option_d": q.option_d,
            "option_d_image": q.option_d_image,
            "correct_option": q.correct_option
        })

    return jsonify(result), 200

@question_bp.route("/question/<int:question_id>", methods=["PUT"])
def update_question(question_id):
    """Update a question"""
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    data = request.json
    
    if data.get("question_text"):
        question.question_text = data["question_text"]
    if data.get("code_snippet") is not None:
        question.code_snippet = data["code_snippet"]
    if data.get("language"):
        question.language = data["language"]
    if data.get("option_a"):
        question.option_a = data["option_a"]
    if data.get("option_b"):
        question.option_b = data["option_b"]
    if data.get("option_c"):
        question.option_c = data["option_c"]
    if data.get("option_d"):
        question.option_d = data["option_d"]
    if data.get("correct_option"):
        question.correct_option = data["correct_option"]
    
    db.session.commit()
    return jsonify({"message": "Question updated successfully"}), 200

@question_bp.route("/question/<int:question_id>", methods=["DELETE"])
def delete_question(question_id):
    """Delete a question"""
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    db.session.delete(question)
    db.session.commit()
    return jsonify({"message": "Question deleted successfully"}), 200

@question_bp.route("/question/quiz/<int:quiz_id>/bulk", methods=["POST"])
def add_bulk_questions(quiz_id):
    """Add multiple questions at once"""
    data = request.json
    questions = data.get("questions", [])
    
    if not questions:
        return jsonify({"error": "No questions provided"}), 400
    
    saved = 0
    for q in questions:
        question = Question(
            quiz_id=quiz_id,
            question_text=q.get("question_text"),
            option_a=q.get("option_a"),
            option_b=q.get("option_b"),
            option_c=q.get("option_c"),
            option_d=q.get("option_d"),
            correct_option=q.get("correct_option")
        )
        db.session.add(question)
        saved += 1
    
    db.session.commit()
    return jsonify({"message": f"{saved} questions added successfully"}), 201

@question_bp.route("/question/<int:question_id>/feedback", methods=["GET"])
def get_question_feedback(question_id):
    """Get feedback for a specific question"""
    try:
        feedback = QuestionFeedback.query.filter_by(question_id=question_id).first()
        if feedback:
            return jsonify({
                "feedback_id": feedback.feedback_id,
                "explanation": feedback.explanation,
                "learning_resource": feedback.learning_resource,
                "difficulty_rating": feedback.difficulty_rating
            }), 200
        return jsonify({"explanation": None}), 200
    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500