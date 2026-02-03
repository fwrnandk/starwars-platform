import os
import pytest

from backend.main import app as flask_app



@pytest.fixture()
def client(monkeypatch):
    # Garante uma chave JWT de teste consistente
    monkeypatch.setenv("JWT_SECRET", "teste-chave-super-segura-com-mais-de-32-chars")

    flask_app.config.update(
        TESTING=True,
    )

    with flask_app.test_client() as client:
        yield client
