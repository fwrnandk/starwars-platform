import pytest
import backend.main as main


@pytest.fixture()
def client():
    # seta direto no módulo (porque JWT_SECRET foi lido no import)
    main.JWT_SECRET = "teste-chave-com-mais-de-32-caracteres-123!123!123!123!"

    # limpa cache para não vazar entre testes
    main.cache._data.clear()

    main.app.config.update(TESTING=True)

    with main.app.test_client() as client:
        yield client


@pytest.fixture()
def token(client):
    resp = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert resp.status_code == 200
    return resp.get_json()["access_token"]
