def test_list_movies_empty(client, db):
    res = client.get("/api/movies/")
    assert res.status_code == 200
    data = res.get_json()
    assert data["movies"] == []
    assert data["total"] == 0
def test_list_movies_with_data(client, db, test_movie):
    res = client.get("/api/movies/")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["movies"]) == 1
    assert data["movies"][0]["title"] == "Fight Club"
def test_get_single_movie(client, db, test_movie):
    res = client.get(f"/api/movies/{test_movie.id}")
    assert res.status_code == 200
    data = res.get_json()
    assert data["title"] == "Fight Club"
    assert "reviews" in data
def test_get_movie_not_found(client, db):
    res = client.get("/api/movies/9999")
    assert res.status_code == 404
def test_update_movie_authenticated(auth_client, db, test_movie):
    res = auth_client.put(f"/api/movies/{test_movie.id}", json={"genre": "Drama"})
    assert res.status_code == 200
    assert res.get_json()["movie"]["genre"] == "Drama"
def test_update_movie_invalid_rating(auth_client, db, test_movie):
    res = auth_client.put(f"/api/movies/{test_movie.id}", json={"rating": "INVALID"})
    assert res.status_code == 422
def test_update_movie_unauthenticated(client, db, test_movie):
    res = client.put(f"/api/movies/{test_movie.id}", json={"genre": "Drama"})
    assert res.status_code == 401
def test_delete_movie_authenticated(auth_client, db, test_movie):
    res = auth_client.delete(f"/api/movies/{test_movie.id}")
    assert res.status_code == 200
def test_delete_movie_unauthenticated(client, db, test_movie):
    res = client.delete(f"/api/movies/{test_movie.id}")
    assert res.status_code == 401
def test_filter_by_rating(client, db, test_movie):
    res = client.get("/api/movies/?rating=R")
    assert res.status_code == 200
    assert all(m["rating"] == "R" for m in res.get_json()["movies"])
def test_filter_by_genre(client, db, test_movie):
    res = client.get("/api/movies/?genre=Drama")
    assert res.status_code == 200
    assert len(res.get_json()["movies"]) == 1
def test_pagination(client, db, test_movie):
    res = client.get("/api/movies/?page=1&per_page=5")
    assert res.status_code == 200
    data = res.get_json()
    assert "pages" in data
    assert "current_page" in data
