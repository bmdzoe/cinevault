from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Movie, WatchlistItem
watchlist_bp = Blueprint("watchlist", __name__)
@watchlist_bp.route("/", methods=["GET"])
@login_required
def get_watchlist():
    watched_filter = request.args.get("watched")
    query = WatchlistItem.query.filter_by(user_id=current_user.id)
    if watched_filter == "true":
        query = query.filter_by(watched=True)
    elif watched_filter == "false":
        query = query.filter_by(watched=False)
    items = query.order_by(WatchlistItem.added_at.desc()).all()
    return jsonify({"watchlist": [item.to_dict() for item in items]}), 200
@watchlist_bp.route("/", methods=["POST"])
@login_required
def add_to_watchlist():
    body = request.get_json() or {}
    movie_id = body.get("movie_id")
    if not movie_id:
        return jsonify({"error": "movie_id is required."}), 400
    Movie.query.get_or_404(movie_id)
    existing = WatchlistItem.query.filter_by(user_id=current_user.id, movie_id=movie_id).first()
    if existing:
        return jsonify({"error": "Movie already in watchlist."}), 409
    item = WatchlistItem(user_id=current_user.id, movie_id=movie_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Added to watchlist.", "item": item.to_dict()}), 201
@watchlist_bp.route("/<int:item_id>/watched", methods=["PATCH"])
@login_required
def mark_watched(item_id):
    item = WatchlistItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
    item.watched = not item.watched
    item.watched_at = datetime.utcnow() if item.watched else None
    db.session.commit()
    return jsonify({"message": "Updated.", "item": item.to_dict()}), 200
@watchlist_bp.route("/<int:item_id>", methods=["DELETE"])
@login_required
def remove_from_watchlist(item_id):
    item = WatchlistItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from watchlist."}), 200
