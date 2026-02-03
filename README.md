# StarWars Platform API

API desenvolvida em Python utilizando Google Cloud Functions Gen2 e API Gateway para explorar dados do universo Star Wars via SWAPI.

--------------------------------------------------

## Base URL (API Gateway)

https://swapi-gateway-67mqcogi.uc.gateway.dev

--------------------------------------------------

## Rotas Disponíveis

Públicas

- GET /health  
  Healthcheck da API.

- POST /auth/login  
  Realiza autenticação e retorna um JWT.

Protegidas (Bearer JWT)

- GET /v1/films  
  Lista filmes com filtros e ordenação.

  Query params:
  - search → texto para busca no título
  - sort → title | release_date
  - order → asc | desc

- GET /v1/films/{film_id}/characters  
  Retorna os personagens de um filme específico.

--------------------------------------------------

## Autenticação (JWT)

Login (PowerShell):

$resp = Invoke-RestMethod -Method Post -Uri "https://swapi-gateway-67mqcogi.uc.gateway.dev/auth/login" -ContentType "application/json" -Body '{"username":"admin","password":"admin"}'

$token = $resp.access_token

Acessar endpoint protegido:

Invoke-RestMethod -Headers @{ Authorization = "Bearer $token" } -Uri "https://swapi-gateway-67mqcogi.uc.gateway.dev/v1/films?sort=release_date&order=asc"

--------------------------------------------------

## Executar Localmente (Windows)

1) Instalar dependências

.\scripts\setup.ps1

2) Iniciar servidor local

.\scripts\run-local.ps1

A API ficará disponível em:

http://localhost:8080

3) Rodar testes

.\scripts\test.ps1

--------------------------------------------------

## Testes

O projeto possui testes automatizados com:

- pytest
- responses (mock HTTP)

Cobertura:
- Autenticação
- Proteção JWT
- Listagem de filmes
- Filtros e ordenação
- Correlação de personagens

--------------------------------------------------

## Arquitetura

Fluxo:

Cliente  
↓  
API Gateway (GCP)  
↓  
Cloud Function Gen2 (Python)  
↓  
SWAPI

Componentes:

API Gateway
- Exposição pública
- Roteamento

Cloud Functions Gen2
- Execução do backend
- Validação JWT
- Consumo da SWAPI

Backend Python
- Filtros
- Ordenação
- Correlação
- Cache (futuro)

Autenticação
- JWT HS256
- Proteção em /v1/*

--------------------------------------------------

## Estrutura do Projeto

starwars-platform

backend/
  main.py
  requirements.txt
  requirements-dev.txt
  tests/

docs/
  api/
    openapi.yaml

scripts/
  setup.ps1
  run-local.ps1
  test.ps1

README.md

--------------------------------------------------

## Tecnologias

- Python 3.11
- Flask
- Google Cloud Functions Gen2
- Google API Gateway
- JWT (PyJWT)
- pytest
- responses
- SWAPI

--------------------------------------------------

## Diferenciais

- Arquitetura em nuvem
- Autenticação JWT
- API Gateway
- Testes automatizados
- Correlação de dados
- Documentação clara
- Scripts de execução

--------------------------------------------------

