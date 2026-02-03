import os
import time
from typing import Any, Dict, Optional, Tuple

import requests
from flask import Flask, jsonify, request, Response, abort
from werkzeug.wrappers import Response as WzResponse


import jwt
from functools import wraps

def jwt_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "missing_token"}), 401

        token = auth_header.replace("Bearer ", "").strip()

        try:
            jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                issuer="starwars-platform",
            )

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "token_expired"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"error": "invalid_token"}), 401

        return func(*args, **kwargs)

    return wrapper


JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ISSUER = "starwars-platform"
JWT_EXP_SECONDS = 60 * 60  # 1 hora



SWAPI_BASE_URL = "https://swapi.dev/api"


class SimpleCache:
    """Cache simples em memória para reduzir chamadas repetidas na SWAPI."""
    def __init__(self) -> None:
        self._data: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        item = self._data.get(key)
        if not item:
            return None
        expires_at, value = item
        if time.time() > expires_at:
            self._data.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        self._data[key] = (time.time() + ttl_seconds, value)


cache = SimpleCache()
app = Flask(__name__)


def swapi_get(path: str, params: Optional[dict] = None, ttl_seconds: int = 60) -> Dict[str, Any]:
    url = f"{SWAPI_BASE_URL}{path}"
    cache_key = f"{url}|{params}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    resp = requests.get(url, params=params, timeout=15)

    # SWAPI pode falhar ou rate-limitar; aqui padronizamos o erro
    if resp.status_code >= 400:
        raise RuntimeError(f"SWAPI error {resp.status_code}: {resp.text}")

    data = resp.json()
    cache.set(cache_key, data, ttl_seconds=ttl_seconds)
    return data

def generate_token(username: str) -> str:
    now = int(time.time())
    payload = {
        "sub": username,
        "iss": JWT_ISSUER,
        "iat": now,
        "exp": now + JWT_EXP_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def require_auth() -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        abort(401)

    token = auth_header.replace("Bearer ", "", 1).strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], issuer=JWT_ISSUER)
        return str(payload.get("sub", ""))
    except Exception:
        abort(401)


@app.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200

@app.post("/auth/login")
def login() -> tuple:

    body = request.get_json(force=True, silent=True) or {}

    username = str(body.get("username", "")).strip()
    password = str(body.get("password", "")).strip()

    if username == "admin" and password == "admin":
        token = generate_token(username)
        return jsonify(
            {"access_token": token, "token_type": "Bearer", "expires_in": JWT_EXP_SECONDS}
        ), 200

    return jsonify({"error": "invalid_credentials"}), 401



@app.get("/v1/films")
@jwt_required
def list_films():
    try:
        # Parâmetros
        search = (request.args.get("search") or "").strip().lower()
        sort = request.args.get("sort")
        order = request.args.get("order", "asc")

        # Busca na SWAPI
        resp = requests.get(f"{SWAPI_BASE_URL}/films/")
        resp.raise_for_status()

        data = resp.json()
        films = data.get("results", [])

        # =========================
        # FILTRO SEARCH
        # =========================
        if search:
            films = [
                f for f in films
                if search in (f.get("title") or "").lower()
            ]

        # =========================
        # ORDENAÇÃO
        # =========================
        if sort in {"title", "release_date"}:
            reverse = order == "desc"

            films = sorted(
                films,
                key=lambda f: f.get(sort) or "",
                reverse=reverse
            )

        # =========================
        # RESPOSTA
        # =========================
        return jsonify({
            "count": len(films),
            "results": films
        }), 200

    except requests.RequestException:
        return jsonify({"error": "swapi_unavailable"}), 503

    except Exception as e:
        return jsonify({"error": "internal_error"}), 500



@app.get("/v1/films/<film_id>/characters")
def film_characters(film_id: str) -> tuple:
    """
    Retorna personagens de um filme específico (correlação).
    """
    require_auth()

    film = swapi_get(f"/films/{film_id}/", ttl_seconds=300)
    character_urls = film.get("characters", [])

    characters = []
    for url in character_urls:
        # url já vem completa, então buscamos direto sem concatenar base
        cached = cache.get(url)
        if cached is not None:
            characters.append(cached)
            continue

        resp = requests.get(url, timeout=15)
        if resp.status_code >= 400:
            continue
        payload = resp.json()
        cache.set(url, payload, ttl_seconds=300)
        characters.append(payload)

    return jsonify({
        "film": {"title": film.get("title"), "episode_id": film.get("episode_id")},
        "count": len(characters),
        "results": characters
    }), 200

def entrypoint(request):
    """
    Entry point HTTP para Functions Framework / Cloud Functions (Gen2).
    Encaminha o request para o Flask via WSGI de forma segura.
    """
    return WzResponse.from_app(app, request.environ)




