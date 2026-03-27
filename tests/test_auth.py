def test_register_success(client, db):
    res = client.post("/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepass"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["username"] == "newuser"
def test_register_duplicate_email(client, db, test_user):
    res = client.post("/auth/register", json={
        "username": "other",
        "email": "test@example.com",
        "password": "pass123"
    })
    assert res.status_code == 409
def test_register_validation_error(client, db):
    res = client.post("/auth/register", json={"username": "x", "email": "bad", "password": "12"})
    assert res.status_code == 422
    assert "errors" in res.get_json()
def test_login_success(client, db, test_user):
    res = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert res.get_json()["user"]["email"] == "test@example.com"
def test_login_wrong_password(client, db, test_user):
    res = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
def test_me_unauthenticated(client):
    res = client.get("/auth/me")
    assert res.status_code == 401
def test_me_authenticated(auth_client, test_user):
    res = auth_client.get("/auth/me")
    assert res.status_code == 200
    assert res.get_json()["user"]["username"] == "testuser"
def test_logout(auth_client):
    res = auth_client.post("/auth/logout")
    assert res.status_code == 200
