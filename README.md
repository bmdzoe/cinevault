# 🎬 CineVault

A full-stack movie tracking application built with Flask, SQLAlchemy, and the TMDB API. Search any movie, save it to a shared vault, build a personal watchlist, and leave reviews — all backed by a RESTful API with authentication.

---

## Features

- **Movie Search** — Live TMDB API lookup with MPAA ratings, genres, streaming providers, and poster images
- **Full CRUD** — Save, update, and delete movies from the vault
- **User Auth** — Register/login with bcrypt-hashed passwords and Flask-Login sessions
- **Personal Watchlist** — Add movies, mark as watched/unwatched, remove entries
- **Reviews** — Authenticated users can rate (1–10) and review any saved movie
- **Filter & Sort** — Browse the vault by genre, rating, release year, or date added with pagination
- **Input Validation** — All endpoints validated with Marshmallow schemas
- **Caching** — TMDB genre list cached server-side to minimize API calls
- **Test Suite** — 30+ pytest tests covering all CRUD routes, auth, and edge cases
- **Docker** — Single-command deployment with `docker-compose up`

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.12, Flask 3.0              |
| Database   | SQLite (dev) via SQLAlchemy ORM     |
| Migrations | Flask-Migrate / Alembic             |
| Auth       | Flask-Login + Flask-Bcrypt          |
| Validation | Marshmallow                         |
| Caching    | Flask-Caching (SimpleCache)         |
| External   | TMDB API v3                         |
| Frontend   | Jinja2 + Vanilla JS + Custom CSS    |
| Testing    | pytest + pytest-flask               |
| DevOps     | Docker + docker-compose             |

---

## Project Structure

```
movie_app/
├── app/
│   ├── __init__.py          # Application factory
│   ├── models.py            # User, Movie, WatchlistItem, Review
│   ├── schemas.py           # Marshmallow validation schemas
│   ├── routes/
│   │   ├── auth.py          # /auth/* — register, login, logout
│   │   ├── movies.py        # /api/movies/* — full CRUD + reviews
│   │   ├── watchlist.py     # /api/watchlist/* — personal lists
│   │   └── main.py          # Page routes (Jinja2 templates)
│   ├── services/
│   │   └── tmdb.py          # TMDB API service class
│   ├── templates/           # Jinja2 HTML templates
│   └── static/
│       ├── css/main.css
│       └── js/              # Modular vanilla JS
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_movies.py
│   ├── test_watchlist.py
│   └── test_reviews.py
├── config.py                # Dev / Prod / Testing configs
├── run.py                   # Entry point
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/cinevault.git
cd cinevault
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set:
#   TMDB_API_KEY=your_key_from_themoviedb.org
#   SECRET_KEY=any-random-secret-string
```

Get a free TMDB API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

### 3. Run

```bash
python run.py
# → http://localhost:5000
```

---

## Docker

```bash
cp .env.example .env   # fill in your keys
docker-compose up --build
# → http://localhost:5000
```

---

## Running Tests

```bash
pytest tests/ -v
```

---

## API Reference

### Auth

| Method | Endpoint          | Body                          | Auth     |
|--------|-------------------|-------------------------------|----------|
| POST   | `/auth/register`  | `{username, email, password}` | —        |
| POST   | `/auth/login`     | `{email, password}`           | —        |
| POST   | `/auth/logout`    | —                             | Required |
| GET    | `/auth/me`        | —                             | Required |

### Movies

| Method | Endpoint                              | Description                   | Auth     |
|--------|---------------------------------------|-------------------------------|----------|
| GET    | `/api/movies/`                        | List all (filter/sort/page)   | —        |
| POST   | `/api/movies/`                        | Save a movie by tmdb_id       | Required |
| GET    | `/api/movies/<id>`                    | Get movie + reviews           | —        |
| PUT    | `/api/movies/<id>`                    | Update movie fields           | Required |
| DELETE | `/api/movies/<id>`                    | Delete movie                  | Required |
| GET    | `/api/movies/search?title=<title>`    | Search TMDB                   | —        |

**Query params for GET `/api/movies/`:** `genre`, `rating`, `year`, `sort_by`, `order`, `page`, `per_page`

### Watchlist

| Method | Endpoint                          | Description                   | Auth     |
|--------|-----------------------------------|-------------------------------|----------|
| GET    | `/api/watchlist/`                 | Get user's watchlist          | Required |
| POST   | `/api/watchlist/`                 | Add movie (`{movie_id}`)      | Required |
| PATCH  | `/api/watchlist/<id>/watched`     | Toggle watched status         | Required |
| DELETE | `/api/watchlist/<id>`             | Remove from watchlist         | Required |

### Reviews

| Method | Endpoint                                      | Description     | Auth     |
|--------|-----------------------------------------------|-----------------|----------|
| POST   | `/api/movies/<id>/reviews`                    | Add review      | Required |
| PUT    | `/api/movies/<id>/reviews/<review_id>`        | Update review   | Required |
| DELETE | `/api/movies/<id>/reviews/<review_id>`        | Delete review   | Required |
