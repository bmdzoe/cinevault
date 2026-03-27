import pytest
from app import create_app, db as _db
from app.models import User, Movie
from app import bcrypt
@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()
@pytest.fixture(scope="function")
def db(app):
    with app.app_context():
        yield _db
        _db.session.remove()
        # Clear tables between tests
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()
@pytest.fixture
def client(app):
    return app.test_client()
@pytest.fixture
def test_user(db):
    pw = bcrypt.generate_password_hash("password123").decode("utf-8")
    user = User(username="testuser", email="test@example.com", password_hash=pw)
    db.session.add(user)
    db.session.commit()
    return user
@pytest.fixture
def auth_client(client, test_user):
    client.post("/auth/login", json={"email": "test@example.com", "password": "password123"})
    return client
@pytest.fixture
def test_movie(db):
    movie = Movie(
        tmdb_id=550,
        title="Fight Club",
        genre="Drama, Thriller",
        rating="R",
        release_year=1999,
        overview="An insomniac office worker forms an underground fight club.",
        poster_path="/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    )
    db.session.add(movie)
    db.session.commit()
    return movie
