from flask import Blueprint, request, jsonify
from config import db
from models import Attempt, Question, User, Quiz, AttemptQuestion
from datetime import datetime, timezone
import random

attempt_bp = Blueprint("attempt", __name__)

@attempt_bp.route("/attempt/start/<int:quiz_id>", methods=["POST"])
def start_attempt(quiz_id):
    data = request.get_json()
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    existing_attempt = Attempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=user_id,
        status='in_progress'
    ).first()

    if existing_attempt:
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        
        attempt_questions = AttemptQuestion.query.filter_by(
            attempt_id=existing_attempt.attempt_id
        ).order_by(AttemptQuestion.display_order).all()
        
        seen_ids = set()
        unique_question_ids = []
        for aq in attempt_questions:
            if aq.question_id not in seen_ids:
                seen_ids.add(aq.question_id)
                unique_question_ids.append(aq.question_id)
        
        option_order = {}
        for aq in attempt_questions:
            if str(aq.question_id) not in option_order:
                option_order[str(aq.question_id)] = [
                    aq.option_a_original_index,
                    aq.option_b_original_index,
                    aq.option_c_original_index,
                    aq.option_d_original_index
                ]
        
        return jsonify({
            "attempt_id": existing_attempt.attempt_id,
            "question_order": unique_question_ids,
            "option_order": option_order,
            "total_questions": len(questions)
        }), 200

    if not quiz.is_self_assessment and quiz.attempts_allowed:
        attempt_count = Attempt.query.filter_by(
            quiz_id=quiz_id,
            user_id=user_id,
            status='completed'
        ).count()

        if attempt_count >= quiz.attempts_allowed:
            return jsonify({
                "error": f"You have reached the maximum number of attempts ({quiz.attempts_allowed}) for this quiz"
            }), 403

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    if not questions:
        return jsonify({"error": "No questions found"}), 404

    existing_incomplete = Attempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=user_id,
        status='in_progress'
    ).all()
    
    for incomplete in existing_incomplete:
        AttemptQuestion.query.filter_by(attempt_id=incomplete.attempt_id).delete()
        db.session.delete(incomplete)
    
    db.session.flush()

    new_attempt = Attempt(
        quiz_id=quiz_id,
        user_id=user_id,
        score=0,
        total_questions=len(questions),
        start_time=datetime.now(timezone.utc),
        status='in_progress'
    )

    db.session.add(new_attempt)
    db.session.flush()

    question_ids = [q.question_id for q in questions]
    random.shuffle(question_ids)

    option_order = {}

    for display_idx, qid in enumerate(question_ids):
        order = list(range(4))
        random.shuffle(order)
        option_order[str(qid)] = order

        attempt_q = AttemptQuestion(
            attempt_id=new_attempt.attempt_id,
            question_id=qid,
            display_order=display_idx,
            option_a_original_index=order[0],
            option_b_original_index=order[1],
            option_c_original_index=order[2],
            option_d_original_index=order[3]
        )
        db.session.add(attempt_q)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create attempt"}), 500

    return jsonify({
        "attempt_id": new_attempt.attempt_id,
        "question_order": question_ids,
        "option_order": option_order,
        "total_questions": len(questions)
    }), 201

@attempt_bp.route("/attempt/submit/<int:attempt_id>", methods=["POST"])
def submit_attempt(attempt_id):
    data = request.get_json()
    attempt = Attempt.query.get(attempt_id)

    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404

    if attempt.status == 'completed':
        return jsonify({"error": "This attempt has already been submitted"}), 400

    answers = data.get("answers", {})

    if isinstance(answers, list):
        answers_dict = {}
        for ans in answers:
            if isinstance(ans, dict) and "question_id" in ans and "selected_option" in ans:
                answers_dict[str(ans["question_id"])] = ans["selected_option"]
        answers = answers_dict

    if not answers:
        return jsonify({"error": "No answers submitted"}), 400

    score = 0
    total = 0

    for question_id, selected_option in answers.items():
        try:
            question = Question.query.get(int(question_id))
            if question:
                total += 1
                if question.correct_option == selected_option:
                    score += 1
        except (ValueError, TypeError):
            continue

    attempt.score = score
    attempt.total_questions = total
    attempt.end_time = datetime.now(timezone.utc)
    attempt.status = 'completed'

    db.session.commit()

    return jsonify({
        "score": score,
        "total": total
    }), 200
    
@attempt_bp.route("/attempt/user/<int:user_id>/history", methods=["GET"])
def get_user_attempt_history(user_id):
    try:
        attempts = Attempt.query.filter_by(
            user_id=user_id
        ).order_by(Attempt.start_time.desc()).all()
        
        result = []
        for attempt in attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            
            result.append({
                "attempt_id": attempt.attempt_id,
                "quiz_id": attempt.quiz_id,
                "quiz_title": quiz.title if quiz else "Unknown Quiz",
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "percentage": round((attempt.score / attempt.total_questions * 100), 2) if attempt.total_questions > 0 else 0,
                "status": attempt.status,
                "start_time": attempt.start_time.isoformat() if attempt.start_time else None,
                "end_time": attempt.end_time.isoformat() if attempt.end_time else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_user_attempt_history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@attempt_bp.route("/attempt/<int:attempt_id>/randomization", methods=["GET"])
def get_attempt_randomization(attempt_id):
    try:
        attempt = Attempt.query.get(attempt_id)
        if not attempt:
            return jsonify({"error": "Attempt not found"}), 404

        randomized = AttemptQuestion.query.filter_by(attempt_id=attempt_id)\
            .order_by(AttemptQuestion.display_order).all()
        
        if not randomized:
            return jsonify({"message": "No randomization data found"}), 404
        
        seen_questions = set()
        unique_randomized = []
        
        for rq in randomized:
            if rq.question_id not in seen_questions:
                seen_questions.add(rq.question_id)
                unique_randomized.append(rq)
        
        result = []
        for rq in unique_randomized:
            question = Question.query.get(rq.question_id)
            result.append({
                "display_order": rq.display_order,
                "question_id": rq.question_id,
                "question_text": question.question_text if question else "Unknown",
                "mapping": rq.get_option_mapping()
            })
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_attempt_randomization: {str(e)}")
        return jsonify({"error": str(e)}), 500