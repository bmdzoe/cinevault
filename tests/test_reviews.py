def test_add_review(auth_client, db, test_movie):
    res = auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={
        "rating": 9,
        "body": "A masterpiece."
    })
    assert res.status_code == 201
    data = res.get_json()["review"]
    assert data["rating"] == 9
    assert data["body"] == "A masterpiece."


def test_add_duplicate_review(auth_client, db, test_movie):
    auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 9})
    res = auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 8})
    assert res.status_code == 409


def test_review_rating_out_of_range(auth_client, db, test_movie):
    res = auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 11})
    assert res.status_code == 422


def test_update_review(auth_client, db, test_movie):
    add_res = auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 7})
    review_id = add_res.get_json()["review"]["id"]
    res = auth_client.put(f"/api/movies/{test_movie.id}/reviews/{review_id}", json={"rating": 10, "body": "Changed my mind!"})
    assert res.status_code == 200
    assert res.get_json()["review"]["rating"] == 10


def test_delete_review(auth_client, db, test_movie):
    add_res = auth_client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 7})
    review_id = add_res.get_json()["review"]["id"]
    res = auth_client.delete(f"/api/movies/{test_movie.id}/reviews/{review_id}")
    assert res.status_code == 200


def test_review_unauthenticated(client, db, test_movie):
    res = client.post(f"/api/movies/{test_movie.id}/reviews", json={"rating": 8})
    assert res.status_code == 401
