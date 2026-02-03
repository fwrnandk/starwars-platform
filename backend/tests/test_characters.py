import responses
import backend.main as main


@responses.activate
def test_film_characters_requires_auth(client):
    resp = client.get("/v1/films/1/characters")
    assert resp.status_code == 401


@responses.activate
def test_film_characters_returns_character_details(client, token):
    film_id = "1"

    # 1) Mock: buscar filme na SWAPI
    responses.add(
        responses.GET,
        f"{main.SWAPI_BASE_URL}/films/{film_id}/",
        json={
            "title": "A New Hope",
            "characters": [
                f"{main.SWAPI_BASE_URL}/people/1/",
                f"{main.SWAPI_BASE_URL}/people/2/",
            ],
        },
        status=200,
    )

    # 2) Mock: buscar cada personagem
    responses.add(
        responses.GET,
        f"{main.SWAPI_BASE_URL}/people/1/",
        json={"name": "Luke Skywalker", "gender": "male"},
        status=200,
    )

    responses.add(
        responses.GET,
        f"{main.SWAPI_BASE_URL}/people/2/",
        json={"name": "C-3PO", "gender": "n/a"},
        status=200,
    )

    # chama sua API
    resp = client.get(
        f"/v1/films/{film_id}/characters",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    data = resp.get_json()

    # Aqui a gente aceita dois formatos possíveis:
    # 1) você retorna {"film_id": "...", "characters": [...]}
    # 2) você retorna {"results": [...]}
    results = data.get("characters") or data.get("results") or data

    names = [c["name"] for c in results]
    assert names == ["Luke Skywalker", "C-3PO"]
