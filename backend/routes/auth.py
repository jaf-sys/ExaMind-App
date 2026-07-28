from flask import Blueprint, request, jsonify
from config import db, bcrypt 
from models import User, Attempt

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([name, email, password, role]):
        return jsonify({"message": "All fields are mandatory"}), 400
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"message": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    user = User(
        name=name, 
        email=email, 
        password=hashed_password, 
        role=role
    )
    
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user_id": user.user_id,
        "name": user.name,
        "role": user.role
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({
            "user_id": user.user_id,
            "name": user.name,
            "role": user.role
        }), 200

    return jsonify({"message": "Invalid email or password"}), 401

@auth_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_profile(user_id):
    """Get user profile"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at,
        "total_attempts": Attempt.query.filter_by(user_id=user_id).count()
    }), 200

@auth_bp.route("/user/<int:user_id>", methods=["PUT"])
def update_user_profile(user_id):
    """Update user profile"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    
    if data.get("name"):
        user.name = data["name"]
    if data.get("password"):
        user.password = bcrypt.generate_password_hash(data["password"]).decode('utf-8')
    
    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200