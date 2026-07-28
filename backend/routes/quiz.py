from flask import Blueprint, request, jsonify
from config import db
from models import Quiz, User, Attempt, Question, AttemptQuestion
from datetime import datetime

quiz_bp = Blueprint("quiz", __name__)

def get_current_time():
    return datetime.now()

def check_and_publish_quizzes():
    now = get_current_time()
    quizzes_to_publish = Quiz.query.filter(
        Quiz.is_published == False,
        Quiz.publish_at.isnot(None),
        Quiz.publish_at <= now
    ).all()
    
    for quiz in quizzes_to_publish:
        quiz.is_published = True
        print(f"Auto-published quiz: {quiz.title} (ID: {quiz.quiz_id})")
    
    if quizzes_to_publish:
        db.session.commit()
    
    return len(quizzes_to_publish)

@quiz_bp.before_app_request
def before_request():
    check_and_publish_quizzes()

@quiz_bp.route("/quiz/create", methods=["POST"])
def create_quiz():
    data = request.get_json()

    title = data.get("title")
    time_limit = data.get("time_limit")
    room_id = data.get("room_id") 
    created_by = data.get("user_id")
    topic = data.get("topic")
    difficulty = data.get("difficulty")
    attempts_allowed = data.get("attempts_allowed", 1)
    publish_at = data.get("publish_at")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    if not all([title, time_limit, created_by]):
        return jsonify({"error": "Missing required fields"}), 400

    user = User.query.get(created_by)
    if not user:
        return jsonify({"error": "Invalid user"}), 404

    publish_at_dt = None
    start_time_dt = None
    end_time_dt = None
    now = get_current_time()
    
    if publish_at:
        try:
            publish_at_dt = datetime.fromisoformat(publish_at)
        except:
            pass
    
    if start_time:
        try:
            start_time_dt = datetime.fromisoformat(start_time)
        except:
            pass
    
    if end_time:
        try:
            end_time_dt = datetime.fromisoformat(end_time)
        except:
            pass

    if room_id:
        if user.role != "instructor":
            return jsonify({"error": "Only instructors can create official quizzes"}), 403

        is_published = False
        if not publish_at_dt:
            is_published = True
        elif publish_at_dt and publish_at_dt <= now:
            is_published = True

        new_quiz = Quiz(
            title=title,
            time_limit=time_limit,
            room_id=room_id,
            created_by=created_by,
            is_self_assessment=False,
            topic=topic,
            difficulty=difficulty,
            attempts_allowed=attempts_allowed if attempts_allowed else 1,
            created_at=now,
            is_published=is_published,
            publish_at=publish_at_dt,
            start_time=start_time_dt,
            end_time=end_time_dt
        )
    else:
        new_quiz = Quiz(
            title=title,
            time_limit=time_limit,
            created_by=created_by,
            is_self_assessment=True,
            topic=topic,
            difficulty=difficulty,
            created_at=now,
            is_published=True
        ) 

    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({
        "quiz_id": new_quiz.quiz_id,
        "is_self_assessment": new_quiz.is_self_assessment,
        "is_published": new_quiz.is_published,
    }), 201

@quiz_bp.route("/quiz/by-room/<int:room_id>", methods=["GET"])
def get_quizzes_by_room(room_id):
    user_id = request.args.get("user_id")
    user = User.query.get(user_id) if user_id else None

    query = Quiz.query.filter_by(room_id=room_id, is_self_assessment=False)
    
    if user and user.role == "student":
        now = get_current_time()
        query = query.filter(
            Quiz.is_published == True,
            (Quiz.start_time == None) | (Quiz.start_time <= now),
            (Quiz.end_time == None) | (Quiz.end_time >= now)
        )
    else:
        query = query.filter(
            (Quiz.start_time == None) | (Quiz.start_time <= get_current_time()),
            (Quiz.end_time == None) | (Quiz.end_time >= get_current_time())
        )
    
    quizzes = query.all()

    result = []
    for q in quizzes:
        result.append({
            "quiz_id": q.quiz_id,
            "title": q.title,
            "time_limit": q.time_limit,
            "is_published": q.is_published,
            "publish_at": q.publish_at.isoformat() if q.publish_at else None,
            "start_time": q.start_time.isoformat() if q.start_time else None,
            "end_time": q.end_time.isoformat() if q.end_time else None
        })

    return jsonify(result), 200

@quiz_bp.route("/quiz/self/<int:user_id>", methods=["GET"])
def get_self_quizzes(user_id):
    quizzes = Quiz.query.filter_by(
        created_by=user_id,
        is_self_assessment=True
    ).all()

    result = []
    for q in quizzes:
        result.append({
            "quiz_id": q.quiz_id,
            "title": q.title,
            "time_limit": q.time_limit,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "created_at": q.created_at.isoformat() if q.created_at else None
        })

    return jsonify(result), 200

@quiz_bp.route("/quiz/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    return jsonify({
        "quiz_id": quiz.quiz_id,
        "title": quiz.title,
        "time_limit": quiz.time_limit,
        "room_id": quiz.room_id,
        "topic": quiz.topic,
        "difficulty": quiz.difficulty,
        "is_published": quiz.is_published,
        "is_self_assessment": quiz.is_self_assessment,
        "publish_at": quiz.publish_at.isoformat() if quiz.publish_at else None,
        "start_time": quiz.start_time.isoformat() if quiz.start_time else None,
        "end_time": quiz.end_time.isoformat() if quiz.end_time else None
    }), 200

@quiz_bp.route("/quiz/<int:quiz_id>", methods=["PUT"])
def update_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    data = request.get_json()
    
    if data.get("title"):
        quiz.title = data["title"]
    if data.get("time_limit"):
        quiz.time_limit = data["time_limit"]
    if data.get("topic") is not None:
        quiz.topic = data["topic"]
    if data.get("difficulty"):
        quiz.difficulty = data["difficulty"]
    if data.get("publish_at") is not None:
        try:
            quiz.publish_at = datetime.fromisoformat(data["publish_at"])
        except:
            quiz.publish_at = None
    if data.get("start_time") is not None:
        try:
            quiz.start_time = datetime.fromisoformat(data["start_time"])
        except:
            quiz.start_time = None
    if data.get("end_time") is not None:
        try:
            quiz.end_time = datetime.fromisoformat(data["end_time"])
        except:
            quiz.end_time = None
    
    now = get_current_time()
    if quiz.publish_at and quiz.publish_at <= now and not quiz.is_published:
        quiz.is_published = True
    
    db.session.commit()
    return jsonify({"message": "Quiz updated successfully"}), 200

@quiz_bp.route("/quiz/delete/<int:quiz_id>", methods=["DELETE"])
def delete_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    try:
        attempts = Attempt.query.filter_by(quiz_id=quiz_id).all()
        for attempt in attempts:
            AttemptQuestion.query.filter_by(attempt_id=attempt.attempt_id).delete()
            db.session.delete(attempt)
        
        Question.query.filter_by(quiz_id=quiz_id).delete()

        db.session.delete(quiz)
        db.session.commit()
        return jsonify({"message": "Quiz deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@quiz_bp.route("/quiz/publish/<int:quiz_id>", methods=["POST"])
def publish_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    if quiz.is_self_assessment:
        return jsonify({"error": "Self-assessment quizzes are always published"}), 400
    
    quiz.is_published = True
    db.session.commit()
    
    return jsonify({"message": "Quiz published successfully"}), 200

@quiz_bp.route("/quiz/unpublish/<int:quiz_id>", methods=["POST"])
def unpublish_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    if quiz.is_self_assessment:
        return jsonify({"error": "Self-assessment quizzes are always published"}), 400
    
    quiz.is_published = False
    db.session.commit()
    
    return jsonify({"message": "Quiz unpublished successfully"}), 200

@quiz_bp.route("/quiz/search", methods=["GET"])
def search_quizzes():
    query = request.args.get("q", "")
    user_id = request.args.get("user_id")
    
    if not query:
        return jsonify([]), 200
    
    quizzes = Quiz.query.filter(
        (Quiz.title.contains(query)) | (Quiz.topic.contains(query))
    ).filter(
        Quiz.is_self_assessment == False
    ).limit(10).all()
    
    result = []
    for q in quizzes:
        result.append({
            "quiz_id": q.quiz_id,
            "title": q.title,
            "topic": q.topic,
            "room_id": q.room_id
        })
    
    return jsonify(result), 200