from flask import Blueprint, request, jsonify
from config import db
from models import Room, RoomMember, User
import random
import string

room_bp = Blueprint("room", __name__)

@room_bp.route("/room/create", methods=["POST"])
def create_room():
    data = request.json

    room_name = data.get("room_name")
    user_id = data.get("user_id")

    if not room_name:
        return jsonify({"message": "Room name is required"}), 400
    
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400

    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Invalid user"}), 404

    # Generate unique join code
    import random
    import string
    join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Make sure code is unique
    while Room.query.filter_by(join_code=join_code).first():
        join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    room = Room(
        room_name=room_name,
        join_code=join_code,
        created_by=user_id
    )

    db.session.add(room)
    db.session.commit()

    # Add creator as member
    member = RoomMember(
        room_id=room.room_id,
        user_id=user_id,
        role="instructor"
    )

    db.session.add(member)
    db.session.commit()

    return jsonify({
        "room_id": room.room_id,
        "room_name": room.room_name,
        "join_code": join_code,
        "message": "Room created successfully"
    }), 201
    
@room_bp.route("/room/join", methods=["POST"])
def join_room():
    data = request.json

    join_code = data.get("join_code")
    user_id = data.get("user_id")

    room = Room.query.filter_by(join_code=join_code).first()

    if not room:
        return jsonify({"message": "Invalid join code"}), 404

    member = RoomMember(
        room_id=room.room_id,
        user_id=user_id,
        role="student"
    )

    db.session.add(member)
    db.session.commit()

    return jsonify({"message": "Joined successfully"}), 200

@room_bp.route("/room/my-rooms/<int:user_id>", methods=["GET"])
def get_my_rooms(user_id):

    memberships = RoomMember.query.filter_by(user_id=user_id).all()

    result = []

    for m in memberships:
        room = Room.query.get(m.room_id)

        result.append({
            "room_id": room.room_id,
            "room_name": room.room_name,
            "join_code": room.join_code
        })

    return jsonify(result), 200


@room_bp.route("/room/<int:room_id>/members", methods=["GET"])
def get_room_members(room_id):
    """Get all members of a room"""
    user_id = request.args.get("user_id")
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Invalid user"}), 404

    membership = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=user_id
    ).first()
    
    if not membership:
        return jsonify({"error": "Access denied - not a room member"}), 403
    
    members = RoomMember.query.filter_by(room_id=room_id).all()
    
    result = []
    for member in members:
        member_user = User.query.get(member.user_id)
        result.append({
            "user_id": member.user_id,
            "name": member_user.name if member_user else "Unknown",
            "email": member_user.email if member_user else "",
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    return jsonify(result), 200

@room_bp.route("/room/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    """Delete a room (instructor only)"""
    user_id = request.args.get("user_id")
    user = User.query.get(user_id)
    
    if not user or user.role != "instructor":
        return jsonify({"error": "Access denied"}), 403
    
    room = Room.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    if room.created_by != user.user_id:
        return jsonify({"error": "Only creator can delete room"}), 403
    
    db.session.delete(room)
    db.session.commit()
    return jsonify({"message": "Room deleted successfully"}), 200

@room_bp.route("/room/<int:room_id>/leave", methods=["POST"])
def leave_room(room_id):
    """Student leaves a room"""
    user_id = request.json.get("user_id")
    
    membership = RoomMember.query.filter_by(
        room_id=room_id,
        user_id=user_id
    ).first()
    
    if not membership:
        return jsonify({"error": "Not a member of this room"}), 404
    
    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "Left room successfully"}), 200