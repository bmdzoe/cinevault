from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from marshmallow import ValidationError
from app import db, bcrypt
from app.models import User
from app.schemas import RegisterSchema, LoginSchema
auth_bp = Blueprint("auth", __name__)
@auth_bp.route("/register", methods=["POST"])
def register():
    schema = RegisterSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered."}), 409
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken."}), 409
    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(username=data["username"], email=data["email"], password_hash=hashed_pw)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    return jsonify({"message": "Account created.", "user": user.to_dict()}), 201
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid credentials."}), 401
    login_user(user)
    return jsonify({"message": "Logged in.", "user": user.to_dict()}), 200
@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out."}), 200
@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": current_user.to_dict()}), 200
