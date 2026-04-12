from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from marshmallow import ValidationError
from app import db, bcrypt
from app.models import User
from app.schemas import RegisterSchema, LoginSchema
from flask_dance.contrib.google import google
from flask import redirect, url_for
import logging
logger = logging.getLogger(__name__)
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
    logger.info(f"New user registered: {user.username} ({user.email})")
    login_user(user)
    logger.info(f"User logged in: {user.username}")
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
    logger.info(f"User logged out: {current_user.username}")	
    return jsonify({"message": "Logged out."}), 200
@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": current_user.to_dict()}), 200
@auth_bp.route("/google/callback")
def google_callback():
    if not google.authorized:
        return redirect(url_for("auth.login"))
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return jsonify({"error": "Failed to get user info from Google."}), 502
    info = resp.json()
    email = info["email"]
    name = info.get("name", email.split("@")[0])
    # Check if user already exists
    user = User.query.filter_by(email=email).first()
    if not user:
        # Create new account automatically
        # Generate a random password hash since they'll use Google to login
        import secrets
        random_pw = bcrypt.generate_password_hash(secrets.token_hex(16)).decode("utf-8")
        # Make username from their name, ensure it's unique
        base_username = name.replace(" ", "").lower()[:20]
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}{counter}"
            counter += 1
        user = User(
            username=username,
            email=email,
            password_hash=random_pw
        )
        db.session.add(user)
        db.session.commit()
        logger.info(f"New user via Google OAuth: {user.username} ({email})")
    login_user(user)
    logger.info(f"User logged in via Google: {user.username}")
    return redirect("/")