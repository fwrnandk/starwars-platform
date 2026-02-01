# StarWars Platform (SWAPI) — PowerOfData Case

Plataforma para explorar dados do universo Star Wars usando a SWAPI, com backend serverless em GCP.

## Objetivos
- Expor uma API própria para consulta de filmes, personagens, planetas e naves
- Permitir filtros (busca, ordenação) e correlações (ex.: personagens de um filme)
- Autenticação e testes unitários
- Deploy na GCP usando Cloud Functions + API Gateway

## Estrutura do repositório
- `backend/` — API (Python)
- `frontend/` — Landing page + UI
- `tests/` — testes unitários
- `docs/arquitetura/` — diagramas e decisões técnicas

## Stack 
- Python 
- GCP Cloud Functions + API Gateway
- Pytest
- Frontend estático (HTML/CSS/JS)

## Endpoint (API Gateway)
Base URL: https://swapi-gateway-67mqcogi.uc.gateway.dev

### Exemplos
- Health: `/health`
- Filmes: `/v1/films?sort=release_date&order=asc`
- Personagens por filme: `/v1/films/1/characters`
