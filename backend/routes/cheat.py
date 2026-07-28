from flask import Blueprint, request, jsonify
from config import db
from models import CheatingLog, Attempt, User
from sqlalchemy import func
from datetime import datetime

cheat_bp = Blueprint("cheat", __name__)

@cheat_bp.route("/cheat/log", methods=["POST"])
def log_cheat():
    """Log a cheating event"""
    data = request.json
    attempt_id = data.get("attempt_id")
    event_type = data.get("event_type")

    if not attempt_id or not event_type:
        return jsonify({"message": "Missing data"}), 400

    attempt = Attempt.query.get(attempt_id)
    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404

    log = CheatingLog(
        attempt_id=attempt_id,
        event_type=event_type,
        timestamp=datetime.now()
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({"message": "Event logged successfully"}), 200

@cheat_bp.route("/cheat/logs/<int:quiz_id>", methods=["GET"])
def get_cheat_logs(quiz_id):
    """Get all cheat logs for a specific quiz"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Invalid user"}), 404

    if user.role != "instructor":
        return jsonify({"error": "Access denied. Instructors only."}), 403

    results = db.session.query(
        CheatingLog, Attempt, User
    ).join(
        Attempt, CheatingLog.attempt_id == Attempt.attempt_id
    ).join(
        User, Attempt.user_id == User.user_id
    ).filter(
        Attempt.quiz_id == quiz_id
    ).order_by(
        CheatingLog.timestamp.desc()
    ).all()

    logs = []
    for log, attempt, student in results:
        logs.append({
            "log_id": log.log_id,
            "attempt_id": log.attempt_id,
            "user_id": student.user_id,
            "user_name": student.name,
            "user_email": student.email,
            "event_type": log.event_type,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })

    return jsonify(logs), 200

@cheat_bp.route("/cheat/summary/<int:quiz_id>", methods=["GET"])
def cheat_summary(quiz_id):
    """Get summary of cheat events grouped by student and event type"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Invalid user"}), 404

    if user.role != "instructor":
        return jsonify({"error": "Access denied. Instructors only."}), 403

    results = db.session.query(
        User.user_id,
        User.name,
        User.email,
        CheatingLog.event_type,
        func.count(CheatingLog.log_id).label('count'),
        func.min(CheatingLog.timestamp).label('first_seen'),
        func.max(CheatingLog.timestamp).label('last_seen')
    ).join(
        Attempt, CheatingLog.attempt_id == Attempt.attempt_id
    ).join(
        User, Attempt.user_id == User.user_id
    ).filter(
        Attempt.quiz_id == quiz_id
    ).group_by(
        User.user_id, User.name, User.email, CheatingLog.event_type
    ).order_by(
        User.name, CheatingLog.event_type
    ).all()

    summary = []
    for row in results:
        summary.append({
            "user_id": row[0],
            "user_name": row[1],
            "user_email": row[2],
            "event_type": row[3],
            "count": row[4],
            "first_seen": row[5].isoformat() if row[5] else None,
            "last_seen": row[6].isoformat() if row[6] else None
        })

    return jsonify(summary), 200

@cheat_bp.route("/cheat/attempt/<int:attempt_id>", methods=["GET"])
def get_attempt_cheat_logs(attempt_id):
    """Get cheat logs for a specific attempt"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Invalid user"}), 404

    attempt = Attempt.query.get(attempt_id)
    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404

    if user.role != "instructor" and attempt.user_id != user.user_id:
        return jsonify({"error": "Access denied"}), 403

    logs = CheatingLog.query.filter_by(attempt_id=attempt_id)\
        .order_by(CheatingLog.timestamp.desc()).all()

    result = []
    for log in logs:
        result.append({
            "log_id": log.log_id,
            "attempt_id": log.attempt_id,
            "event_type": log.event_type,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        })

    return jsonify(result), 200

@cheat_bp.route("/cheat/student/<int:student_id>", methods=["GET"])
def get_student_cheat_summary(student_id):
    """Get cheat summary for a specific student across all their attempts"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Invalid user"}), 404

    # Only instructors or the student themselves can view
    if user.role != "instructor" and user.user_id != student_id:
        return jsonify({"error": "Access denied"}), 403

    results = db.session.query(
        Attempt.quiz_id,
        CheatingLog.event_type,
        func.count(CheatingLog.log_id).label('count')
    ).join(
        CheatingLog, CheatingLog.attempt_id == Attempt.attempt_id
    ).filter(
        Attempt.user_id == student_id
    ).group_by(
        Attempt.quiz_id, CheatingLog.event_type
    ).all()

    summary = []
    for row in results:
        summary.append({
            "quiz_id": row[0],
            "event_type": row[1],
            "count": row[2]
        })

    return jsonify(summary), 200