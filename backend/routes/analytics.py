from flask import Blueprint, jsonify, request
from config import db
from models import Attempt, Quiz, User
from datetime import datetime, timezone, timedelta

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics/quiz/<int:quiz_id>", methods=["GET"])
def quiz_analytics(quiz_id):
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    user = User.query.get(user_id)
    
    if not user or user.role != "instructor":
        return jsonify({"error": "Access denied"}), 403

    attempts = Attempt.query.filter_by(
        quiz_id=quiz_id,
        status='completed'
    ).order_by(Attempt.start_time.desc()).all()
    
    formatted_attempts = []
    for a in attempts:
        student = User.query.get(a.user_id)
        formatted_attempts.append({
            "attempt_id": a.attempt_id,
            "user_id": a.user_id,
            "user_name": student.name if student else "Unknown",
            "user_email": student.email if student else "",
            "score": a.score,
            "total": a.total_questions,
            "percentage": round((a.score / a.total_questions * 100), 2) if a.total_questions else 0,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None
        })
    
    return jsonify({
        "quiz_id": quiz_id,
        "total_attempts": len(attempts),
        "attempts": formatted_attempts
    }), 200

@analytics_bp.route("/analytics/student/<int:user_id>", methods=["GET"])
def student_analytics(user_id):
    date_range = request.args.get("range", "all")
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    attempts_query = Attempt.query.join(Quiz).filter(
        Attempt.user_id == user_id,
        Attempt.status == 'completed',
        Quiz.is_self_assessment == True
    )
    
    now = datetime.now(timezone.utc)
    
    if date_range == "7days":
        cutoff = now - timedelta(days=7)
        attempts_query = attempts_query.filter(Attempt.end_time >= cutoff)
    elif date_range == "30days":
        cutoff = now - timedelta(days=30)
        attempts_query = attempts_query.filter(Attempt.end_time >= cutoff)
    
    attempts = attempts_query.all()
    
    if not attempts:
        return jsonify({
            "topics": [],
            "score_trend": [],
            "stats": {
                "totalQuizzes": 0,
                "totalAttempts": 0,
                "avgScore": 0,
                "bestScore": 0
            }
        }), 200
    
    topics_set = set()
    trend_data = []
    total_score_sum = 0
    total_questions_sum = 0
    quiz_ids = set()
    
    for attempt in attempts:
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz:
            if quiz.topic:
                topics_set.add(quiz.topic)
            quiz_ids.add(quiz.quiz_id)
            
            total_score_sum += attempt.score
            total_questions_sum += attempt.total_questions
            
            if attempt.end_time:
                trend_data.append({
                    'date': attempt.end_time.strftime('%Y-%m-%d'),
                    'score': round((attempt.score / attempt.total_questions * 100), 1) if attempt.total_questions > 0 else 0,
                    'quiz_title': quiz.title
                })
    
    topics = sorted(list(topics_set))
    trend_data = sorted(trend_data, key=lambda x: x['date'])[-20:]
    
    avg_score = round((total_score_sum / total_questions_sum * 100), 1) if total_questions_sum > 0 else 0
    best_score = max([round((a.score / a.total_questions * 100), 1) for a in attempts], default=0)
    
    return jsonify({
        'topics': topics,
        'score_trend': trend_data,
        'stats': {
            'totalQuizzes': len(quiz_ids),
            'totalAttempts': len(attempts),
            'avgScore': avg_score,
            'bestScore': best_score
        }
    }), 200

@analytics_bp.route("/analytics/topic/<int:user_id>", methods=["GET"])
def topic_analytics(user_id):
    topic = request.args.get("topic", "")
    date_range = request.args.get("range", "all")
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    attempts_query = Attempt.query.join(Quiz).filter(
        Attempt.user_id == user_id,
        Attempt.status == 'completed',
        Quiz.is_self_assessment == True
    )
    
    now = datetime.now(timezone.utc)
    
    if date_range == "7days":
        cutoff = now - timedelta(days=7)
        attempts_query = attempts_query.filter(Attempt.end_time >= cutoff)
    elif date_range == "30days":
        cutoff = now - timedelta(days=30)
        attempts_query = attempts_query.filter(Attempt.end_time >= cutoff)
    
    attempts = attempts_query.all()
    
    quiz_performance = {}
    
    for attempt in attempts:
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz and quiz.topic == topic:
            quiz_key = quiz.quiz_id
            if quiz_key not in quiz_performance:
                quiz_performance[quiz_key] = {
                    'quiz_id': quiz.quiz_id,
                    'title': quiz.title,
                    'scores': [],
                    'attempt_count': 0
                }
            score_percentage = (attempt.score / attempt.total_questions * 100) if attempt.total_questions > 0 else 0
            quiz_performance[quiz_key]['scores'].append(score_percentage)
            quiz_performance[quiz_key]['attempt_count'] += 1
    
    quiz_data = []
    for quiz_id, data in quiz_performance.items():
        avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        best_score = max(data['scores']) if data['scores'] else 0
        quiz_data.append({
            'title': data['title'],
            'avg_score': round(avg_score, 1),
            'best_score': round(best_score, 1),
            'attempt_count': data['attempt_count']
        })
    
    quiz_data.sort(key=lambda x: x['avg_score'], reverse=True)
    
    return jsonify({
        'quizzes': quiz_data
    }), 200