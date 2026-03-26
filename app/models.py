from datetime import datetime
from flask_login import UserMixin
from app import db, login_manager


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    watchlist_items = db.relationship("WatchlistItem", backref="user", lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship("Review", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


VALID_RATINGS = ("G", "PG", "PG-13", "R", "NC-17", "NR")


class Movie(db.Model):
    __tablename__ = "movies"

    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    genre = db.Column(db.String(200), nullable=False)
    rating = db.Column(db.Enum(*VALID_RATINGS, name="mpaa_rating"), default="NR")
    release_year = db.Column(db.Integer, nullable=True)
    overview = db.Column(db.Text, nullable=True)
    poster_path = db.Column(db.String(300), nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    watchlist_items = db.relationship("WatchlistItem", backref="movie", lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship("Review", backref="movie", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, image_base="https://image.tmdb.org/t/p/w500"):
        return {
            "id": self.id,
            "tmdb_id": self.tmdb_id,
            "title": self.title,
            "genre": self.genre,
            "rating": self.rating,
            "release_year": self.release_year,
            "overview": self.overview,
            "poster_url": f"{image_base}{self.poster_path}" if self.poster_path else None,
            "added_at": self.added_at.isoformat(),
        }


class WatchlistItem(db.Model):
    __tablename__ = "watchlist_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    watched = db.Column(db.Boolean, default=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    watched_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (db.UniqueConstraint("user_id", "movie_id", name="unique_user_movie"),)

    def to_dict(self):
        return {
            "id": self.id,
            "movie": self.movie.to_dict(),
            "watched": self.watched,
            "added_at": self.added_at.isoformat(),
            "watched_at": self.watched_at.isoformat() if self.watched_at else None,
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movies.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-10
    body = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "movie_id", name="unique_user_review"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "movie_id": self.movie_id,
            "rating": self.rating,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
