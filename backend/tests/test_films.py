import responses
import backend.main as main


@responses.activate
def test_list_films_requires_auth(client):
    # sem token -> 401
    resp = client.get("/v1/films")
    assert resp.status_code == 401


@responses.activate
def test_list_films_sorted_by_release_date_asc(client, token):
    # Mock SWAPI /films
    responses.add(
        responses.GET,
        f"{main.SWAPI_BASE_URL}/films/",
        json={
            "results": [
                {"title": "Film B", "release_date": "2005-05-19"},
                {"title": "Film A", "release_date": "1977-05-25"},
            ]
        },
        status=200,
    )

    resp = client.get(
        "/v1/films?sort=release_date&order=asc",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    data = resp.get_json()
    titles = [f["title"] for f in data["results"]]
    assert titles == ["Film A", "Film B"]


@responses.activate
def test_list_films_search_filters_results(client, token):
    responses.add(
        responses.GET,
        f"{main.SWAPI_BASE_URL}/films/",
        json={
            "results": [
                {"title": "A New Hope", "release_date": "1977-05-25"},
                {"title": "The Empire Strikes Back", "release_date": "1980-05-21"},
            ]
        },
        status=200,
    )

    resp = client.get(
        "/v1/films?search=hope",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200

    data = resp.get_json()
    titles = [f["title"] for f in data["results"]]
    assert titles == ["A New Hope"]
