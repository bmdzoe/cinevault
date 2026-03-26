def test_get_watchlist_unauthenticated(client):
    res = client.get("/api/watchlist/")
    assert res.status_code == 401


def test_get_watchlist_empty(auth_client, db):
    res = auth_client.get("/api/watchlist/")
    assert res.status_code == 200
    assert res.get_json()["watchlist"] == []


def test_add_to_watchlist(auth_client, db, test_movie):
    res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    assert res.status_code == 201
    assert res.get_json()["item"]["movie"]["title"] == "Fight Club"


def test_add_duplicate_to_watchlist(auth_client, db, test_movie):
    auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    assert res.status_code == 409


def test_mark_watched(auth_client, db, test_movie):
    add_res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    item_id = add_res.get_json()["item"]["id"]
    res = auth_client.patch(f"/api/watchlist/{item_id}/watched")
    assert res.status_code == 200
    assert res.get_json()["item"]["watched"] is True


def test_toggle_watched_twice(auth_client, db, test_movie):
    add_res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    item_id = add_res.get_json()["item"]["id"]
    auth_client.patch(f"/api/watchlist/{item_id}/watched")
    res = auth_client.patch(f"/api/watchlist/{item_id}/watched")
    assert res.get_json()["item"]["watched"] is False


def test_remove_from_watchlist(auth_client, db, test_movie):
    add_res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    item_id = add_res.get_json()["item"]["id"]
    res = auth_client.delete(f"/api/watchlist/{item_id}")
    assert res.status_code == 200
    list_res = auth_client.get("/api/watchlist/")
    assert list_res.get_json()["watchlist"] == []


def test_filter_watched(auth_client, db, test_movie):
    add_res = auth_client.post("/api/watchlist/", json={"movie_id": test_movie.id})
    item_id = add_res.get_json()["item"]["id"]
    auth_client.patch(f"/api/watchlist/{item_id}/watched")
    res = auth_client.get("/api/watchlist/?watched=true")
    assert len(res.get_json()["watchlist"]) == 1
