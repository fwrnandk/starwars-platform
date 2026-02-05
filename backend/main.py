import os
import time
from typing import Any, Dict, Optional, Tuple

import requests
from flask import Flask, jsonify, request
from werkzeug.wrappers import Response as WzResponse

import jwt
from functools import wraps


JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ISSUER = "starwars-platform"
JWT_EXP_SECONDS = 60 * 60  # 1 hora

SWAPI_BASE_URL = "https://swapi.dev/api"


def _get_bearer_token() -> str | None:
    """Extrai o token Bearer de múltiplos headers possíveis."""
    candidates = [
        request.headers.get("Authorization", ""),
        request.headers.get("X-User-Authorization", ""),
        request.headers.get("X-Authorization", ""),
        request.headers.get("X-Forwarded-Authorization", ""),
    ]

    # Fallback por query parameter (último recurso)
    if request.args.get("access_token"):
        candidates.append(f"Bearer {request.args.get('access_token')}")

    for auth in candidates:
        if not auth:
            continue
        if auth.lower().startswith("bearer "):
            return auth.split(" ", 1)[1].strip()

    return None


def jwt_required(fn):
    """Decorator para proteger rotas com JWT."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _get_bearer_token()
        if not token:
            return jsonify({"error": "invalid_token"}), 401

        try:
            jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                issuer=JWT_ISSUER,
                options={"require": ["exp", "iat", "iss", "sub"]},
            )
        except Exception:
            return jsonify({"error": "invalid_token"}), 401

        return fn(*args, **kwargs)
    return wrapper


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


@app.after_request
def add_cors_headers(response):
    """Adiciona headers CORS em todas as respostas."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-User-Authorization, X-Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response


@app.route("/<path:_path>", methods=["OPTIONS"])
def options_handler(_path):
    """Handler para requisições OPTIONS (CORS preflight)."""
    return ("", 204)


@app.route("/", methods=["OPTIONS"])
def options_root():
    """Handler para OPTIONS na raiz."""
    return ("", 204)


def swapi_get(path: str, params: Optional[dict] = None, ttl_seconds: int = 60) -> Dict[str, Any]:
    """Faz requisição GET para SWAPI com cache."""
    url = f"{SWAPI_BASE_URL}{path}"
    cache_key = f"{url}|{params}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    resp = requests.get(url, params=params, timeout=15)

    if resp.status_code >= 400:
        raise RuntimeError(f"SWAPI error {resp.status_code}: {resp.text}")

    data = resp.json()
    cache.set(cache_key, data, ttl_seconds=ttl_seconds)
    return data


def generate_token(username: str) -> str:
    """Gera um JWT token."""
    now = int(time.time())
    payload = {
        "sub": username,
        "iss": JWT_ISSUER,
        "iat": now,
        "exp": now + JWT_EXP_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def extract_id_from_url(url: str) -> str:
    """Extrai o ID de uma URL da SWAPI."""
    # https://swapi.dev/api/films/1/ -> 1
    parts = url.rstrip('/').split('/')
    return parts[-1] if parts else ""


@app.get("/health")
def health() -> tuple:
    """Endpoint de health check."""
    return jsonify({"status": "ok"}), 200


@app.post("/auth/login")
def login() -> tuple:
    """Endpoint de login."""
    body = request.get_json(force=True, silent=True) or {}

    username = str(body.get("username", "")).strip()
    password = str(body.get("password", "")).strip()

    if username == "admin" and password == "admin":
        token = generate_token(username)
        return jsonify({
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": JWT_EXP_SECONDS
        }), 200

    return jsonify({"error": "invalid_credentials"}), 401


@app.get("/v1/films")
@jwt_required
def list_films():
    """Lista todos os filmes com suporte a busca, ordenação e paginação."""
    try:
        search = (request.args.get("search") or "").strip().lower()
        sort = request.args.get("sort")
        order = request.args.get("order", "asc")

        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 10))

        cache_key = "swapi_films"
        data = cache.get(cache_key)

        if not data:
            resp = requests.get(f"{SWAPI_BASE_URL}/films/", timeout=15)
            resp.raise_for_status()
            data = resp.json()
            cache.set(cache_key, data, ttl_seconds=60)

        films = data.get("results", [])

        # Adicionar ID a cada filme (extraído da URL)
        for film in films:
            if "url" in film and "id" not in film:
                film["id"] = extract_id_from_url(film["url"])

        # Filtrar por busca
        if search:
            films = [f for f in films if search in (f.get("title") or "").lower()]

        # Ordenar
        if sort in {"title", "release_date", "episode_id"}:
            reverse = (order == "desc")
            films = sorted(films, key=lambda f: f.get(sort) or "", reverse=reverse)

        # Paginar
        total = len(films)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = films[start:end]

        return jsonify({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": paginated,
        }), 200

    except requests.RequestException:
        return jsonify({"error": "swapi_unavailable"}), 503
    except Exception as e:
        return jsonify({"error": "internal_error", "detail": str(e)}), 500


@app.get("/v1/films/<film_id>")
@jwt_required
def get_film(film_id: str) -> tuple:
    """Retorna detalhes de um filme específico."""
    try:
        film = swapi_get(f"/films/{film_id}/", ttl_seconds=300)
        
        # Adicionar ID ao filme
        film["id"] = film_id
        
        return jsonify(film), 200
        
    except RuntimeError as e:
        if "404" in str(e):
            return jsonify({"error": "film_not_found"}), 404
        return jsonify({"error": "swapi_unavailable"}), 503
    except Exception as e:
        return jsonify({"error": "internal_error", "detail": str(e)}), 500


@app.get("/v1/films/<film_id>/characters")
@jwt_required
def film_characters(film_id: str) -> tuple:
    """Retorna todos os personagens de um filme."""
    try:
        # Buscar dados do filme
        film = swapi_get(f"/films/{film_id}/", ttl_seconds=300)
        character_urls = film.get("characters", [])

        characters = []
        for url in character_urls:
            cached = cache.get(url)
            if cached is not None:
                characters.append(cached)
                continue

            resp = requests.get(url, timeout=15)
            if resp.status_code >= 400:
                continue
            
            payload = resp.json()
            
            # Adicionar ID ao personagem
            payload["id"] = extract_id_from_url(url)
            
            cache.set(url, payload, ttl_seconds=300)
            characters.append(payload)

        return jsonify({
            "film": {
                "id": film_id,
                "title": film.get("title"),
                "episode_id": film.get("episode_id")
            },
            "count": len(characters),
            "page": 1,
            "page_size": len(characters),
            "results": characters
        }), 200

    except RuntimeError as e:
        if "404" in str(e):
            return jsonify({"error": "film_not_found"}), 404
        return jsonify({"error": "swapi_unavailable"}), 503
    except Exception as e:
        return jsonify({"error": "internal_error", "detail": str(e)}), 500


def entrypoint(request):
    """
    Entry point HTTP para Functions Framework / Cloud Functions (Gen2).
    Encaminha o request para o Flask via WSGI de forma segura.
    """
    return WzResponse.from_app(app, request.environ)


# Para executar localmente com Flask
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)