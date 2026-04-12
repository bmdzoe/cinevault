from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from marshmallow import ValidationError
from sqlalchemy import asc, desc
from app import db
from app.models import Movie, Review
from app.schemas import MovieUpdateSchema, ReviewSchema, MovieSearchSchema, MovieFilterSchema
from app.services.tmdb import tmdb, TMDBError
movies_bp = Blueprint("movies", __name__)
#Search & Add
@movies_bp.route("/search", methods=["GET"])
def search():
    schema = MovieSearchSchema()
    try:
        data = schema.load(request.args)
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    try:
        results = tmdb.search_movie(data["title"])
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
    if not results:
        return jsonify({"error": "No movies found."}), 404
    try:
        movie_data = tmdb.fetch_full_movie(results[0])
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
    return jsonify(movie_data), 200
@movies_bp.route("/", methods=["POST"])
@login_required
def add_movie():
    """Save a TMDB movie to the database by tmdb_id."""
    body = request.get_json() or {}
    tmdb_id = body.get("tmdb_id")
    if not tmdb_id:
        return jsonify({"error": "tmdb_id is required."}), 400
    existing = Movie.query.filter_by(tmdb_id=tmdb_id).first()
    if existing:
        return jsonify({"message": "Movie already saved.", "movie": existing.to_dict()}), 200
    try:
        results = tmdb.search_movie(body.get("title", ""))
        match = next((r for r in results if r["id"] == tmdb_id), None)
        if not match:
            # Fall back: fetch by ID directly
            return jsonify({"error": "Movie not found on TMDB."}), 404
        movie_data = tmdb.fetch_full_movie(match)
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
    valid_ratings = ("G", "PG", "PG-13", "R", "NC-17", "NR")
    raw_rating = movie_data["rating"]
    safe_rating = raw_rating if raw_rating in valid_ratings else "NR"
    movie = Movie(
        tmdb_id=movie_data["tmdb_id"],
        title=movie_data["title"],
        genre=movie_data["genre"],
        rating=safe_rating,
        release_year=movie_data["release_year"],
        overview=movie_data["overview"],
        poster_path=movie_data["poster_path"],
    )
    db.session.add(movie)
    db.session.commit()
    return jsonify({"message": "Movie saved.", "movie": movie.to_dict()}), 201
#List & Filter
@movies_bp.route("/", methods=["GET"])
def list_movies():
    schema = MovieFilterSchema()
    try:
        filters = schema.load(request.args)
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    query = Movie.query
    if filters.get("genre"):
        query = query.filter(Movie.genre.ilike(f"%{filters['genre']}%"))
    if filters.get("rating"):
        query = query.filter(Movie.rating == filters["rating"])
    if filters.get("year"):
        query = query.filter(Movie.release_year == filters["year"])
    sort_col_map = {
        "title": Movie.title,
        "release_year": Movie.release_year,
        "added_at": Movie.added_at,
        "rating": Movie.rating,
    }
    sort_col = sort_col_map.get(filters.get("sort_by", "added_at"), Movie.added_at)
    order_fn = asc if filters["order"] == "asc" else desc
    query = query.order_by(order_fn(sort_col))
    page = query.paginate(page=filters["page"], per_page=filters["per_page"], error_out=False)
    return jsonify({
        "movies": [m.to_dict() for m in page.items],
        "total": page.total,
        "pages": page.pages,
        "current_page": page.page,
    }), 200
#Single Movie CRUD
@movies_bp.route("/<int:movie_id>", methods=["GET"])
def get_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    data = movie.to_dict()
    data["reviews"] = [r.to_dict() for r in movie.reviews]
    return jsonify(data), 200
@movies_bp.route("/<int:movie_id>", methods=["PUT"])
@login_required
def update_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    schema = MovieUpdateSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    for field, value in data.items():
        setattr(movie, field, value)
    db.session.commit()
    return jsonify({"message": "Movie updated.", "movie": movie.to_dict()}), 200
@movies_bp.route("/<int:movie_id>", methods=["DELETE"])
@login_required
def delete_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    db.session.delete(movie)
    db.session.commit()
    return jsonify({"message": "Movie deleted."}), 200
#Reviews 
@movies_bp.route("/<int:movie_id>/reviews", methods=["POST"])
@login_required
def add_review(movie_id):
    Movie.query.get_or_404(movie_id)
    existing = Review.query.filter_by(user_id=current_user.id, movie_id=movie_id).first()
    if existing:
        return jsonify({"error": "You have already reviewed this movie."}), 409
    schema = ReviewSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    review = Review(user_id=current_user.id, movie_id=movie_id, **data)
    db.session.add(review)
    db.session.commit()
    return jsonify({"message": "Review added.", "review": review.to_dict()}), 201
@movies_bp.route("/<int:movie_id>/reviews/<int:review_id>", methods=["PUT"])
@login_required
def update_review(movie_id, review_id):
    review = Review.query.filter_by(id=review_id, movie_id=movie_id, user_id=current_user.id).first_or_404()
    schema = ReviewSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 422
    for field, value in data.items():
        setattr(review, field, value)
    db.session.commit()
    return jsonify({"message": "Review updated.", "review": review.to_dict()}), 200
@movies_bp.route("/<int:movie_id>/reviews/<int:review_id>", methods=["DELETE"])
@login_required
def delete_review(movie_id, review_id):
    review = Review.query.filter_by(id=review_id, movie_id=movie_id, user_id=current_user.id).first_or_404()
    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Review deleted."}), 200
@movies_bp.route("/<int:movie_id>/trailers", methods=["GET"])
def get_trailers(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    try:
        trailers = tmdb.get_trailers(movie.tmdb_id)
        response = jsonify({"trailers": trailers})
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
@movies_bp.route("/<int:movie_id>/recommendations", methods=["GET"])
def get_recommendations(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    try:
        recommendations = tmdb.get_recommendations(movie.tmdb_id)
        response = jsonify({"recommendations": recommendations})
        # Disable caching for recommendations so each movie gets unique results
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
@movies_bp.route("/popular", methods=["GET"])
def get_popular():
    try:
        movies = tmdb.get_popular()
        response = jsonify({"movies": movies})
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
@movies_bp.route("/top_rated", methods=["GET"])
def get_top_rated():
    try:
        movies = tmdb.get_top_rated()
        response = jsonify({"movies": movies})
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
@movies_bp.route("/now_playing", methods=["GET"])
def get_now_playing():
    try:
        movies = tmdb.get_now_playing()
        response = jsonify({"movies": movies})
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502
@movies_bp.route("/upcoming", methods=["GET"])
def get_upcoming():
    try:
        movies = tmdb.get_upcoming()
        response = jsonify({"movies": movies})
        response.headers["Cache-Control"] = "no-store"
        return response, 200
    except TMDBError as e:
        return jsonify({"error": str(e)}), 502