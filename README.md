# 🌌 StarWars Platform API

Plataforma desenvolvida em Python (Flask) + React para consumir e organizar dados da SWAPI (Star Wars API), com autenticação via JWT e deploy no Google Cloud Run.

> ⚠️ Este projeto utiliza Cloud Run diretamente, sem API Gateway, para garantir estabilidade na autenticação.

---

## 🚀 Tecnologias

### Backend
- Python 3
- Flask
- JWT (PyJWT)
- Requests
- Google Cloud Run

### Frontend
- React (Vite)
- TypeScript
- Axios

### Infraestrutura
- Google Cloud Platform
- Cloud Run

---

## 📐 Arquitetura
```
Frontend (React)
      |
      v
Cloud Run (Flask API)
      |
      v
    SWAPI
```

- O frontend consome diretamente a API publicada no Cloud Run  
- O backend consulta a SWAPI e aplica filtros  
- Autenticação via JWT  
- Cache em memória para reduzir chamadas externas  

---

## 🌍 URL da API (Produção)
```
https://swapi-api-486796978386.southamerica-east1.run.app
```

---

## 🔐 Autenticação

A API utiliza JWT via Bearer Token.

### Credenciais padrão
```
Usuário: admin
Senha: admin
```

---

## 📡 Endpoints

### Healthcheck
```
GET /health
```

---

### Login
```
POST /auth/login
```

**Body:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

---

### Listar Filmes (Protegido)
```
GET /v1/films
```

**Parâmetros (query):**
- `search`
- `sort` (title | release_date)
- `order` (asc | desc)
- `page`
- `page_size`

**Header:**
```
Authorization: Bearer <token>
```

---

### Personagens por Filme (Protegido)
```
GET /v1/films/{film_id}/characters
```

**Header:**
```
Authorization: Bearer <token>
```

---

## 🧪 Testes via Terminal (PowerShell / Windows)

### 1️⃣ Healthcheck
```powershell
curl https://swapi-api-486796978386.southamerica-east1.run.app/health
```

### 2️⃣ Login
```powershell
$resp = Invoke-RestMethod `
  -Method Post `
  -Uri "https://swapi-api-486796978386.southamerica-east1.run.app/auth/login" `
  -ContentType "application/json" `
  -Body (@{ username="admin"; password="admin" } | ConvertTo-Json)

$token = $resp.access_token
```

### 3️⃣ Listar Filmes
```powershell
Invoke-RestMethod `
  -Headers @{ Authorization = "Bearer $token" } `
  -Uri "https://swapi-api-486796978386.southamerica-east1.run.app/v1/films?sort=release_date&order=asc"
```

### 4️⃣ Buscar Personagens
```powershell
Invoke-RestMethod `
  -Headers @{ Authorization = "Bearer $token" } `
  -Uri "https://swapi-api-486796978386.southamerica-east1.run.app/v1/films/1/characters"
```

---

## 🖥️ Executar Localmente

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**API local:**
```
http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Frontend local:**
```
http://localhost:5173
```

---

## 📁 Estrutura do Projeto
```
starwars-platform/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── scripts/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── docs/
│
└── README.md
```

---

## ⚙️ Decisões Técnicas

- JWT validado no backend
- Cache em memória para otimização
- CORS configurado no Flask
- Axios com interceptor para token
- Deploy direto no Cloud Run
- API Gateway removido para evitar problemas de autenticação

---

## ⚠️ Observação sobre API Gateway

Durante o desenvolvimento, foi testada a utilização do Google API Gateway.
Porém, ocorreram problemas recorrentes com propagação de headers de autenticação (JWT), causando falhas de autorização.

Por este motivo, foi adotado o acesso direto ao Cloud Run, garantindo:

- ✅ Estabilidade
- ✅ Menor latência
- ✅ Autenticação confiável
- ✅ Debug facilitado

---

## 📈 Funcionalidades Implementadas

- ✅ Login com JWT
- ✅ Listagem de filmes
- ✅ Filtro por nome
- ✅ Ordenação por data ou título
- ✅ Paginação
- ✅ Correlação filme → personagens
- ✅ Cache de requisições externas
- ✅ Healthcheck
- ✅ Integração frontend/backend