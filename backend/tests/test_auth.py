def test_login_success_returns_token(client):
    resp = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert resp.status_code == 200

    data = resp.get_json()
    assert "access_token" in data
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 50


def test_login_invalid_credentials(client):
    resp = client.post("/auth/login", json={"username": "admin", "password": "errado"})
    assert resp.status_code == 401

    data = resp.get_json()
    assert data == {"error": "invalid_credentials"}
