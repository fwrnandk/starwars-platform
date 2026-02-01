import os
import time
from typing import Any, Dict, Optional, Tuple

import requests
from flask import Flask, jsonify, request, Response


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


@app.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@app.get("/v1/films")
def list_films() -> tuple:
    """
    Lista filmes.
    Suporta querystring:
      - search: texto
      - sort: title | release_date
      - order: asc | desc
    """
    search = request.args.get("search")
    sort = request.args.get("sort", "release_date")
    order = request.args.get("order", "asc")

    data = swapi_get("/films/", params={"search": search} if search else None, ttl_seconds=120)
    results = data.get("results", [])

    sort_map = {
        "title": lambda x: (x.get("title") or "").lower(),
        "release_date": lambda x: x.get("release_date") or "",
    }
    key_fn = sort_map.get(sort, sort_map["release_date"])
    reverse = (order.lower() == "desc")
    results.sort(key=key_fn, reverse=reverse)

    return jsonify({"count": len(results), "results": results}), 200


@app.get("/v1/films/<film_id>/characters")
def film_characters(film_id: str) -> tuple:
    """
    Retorna personagens de um filme específico (correlação).
    """
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

def entrypoint(req):
    """
    Entry point para o Functions Framework / Cloud Functions.
    O Functions Framework exige um alvo do tipo função.
    """
    with app.request_context(req.environ):
        return app.full_dispatch_request()


