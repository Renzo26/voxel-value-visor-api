# Calculadora 3D — Backend (FastAPI)

API de precificação para impressão 3D. Segue o padrão arquitetural do projeto Mecaflow.

## Stack

- Python 3.12 + FastAPI + SQLAlchemy 2 (async) + Pydantic v2
- PostgreSQL via Supabase (Session Pooler, IPv4) · Alembic para migrações
- Auth JWT (python-jose) · `bcrypt==3.2.2` + `passlib==1.7.4` (pin obrigatório)

## Estrutura

```
backend/
├── main.py                 # FastAPI app + CORS + StaticFiles (/uploads)
├── alembic/                # migrações (0001_initial cria tabelas + seed admin)
└── app/
    ├── api/                # routers: auth, users, calculations, uploads, logistics
    ├── core/               # config, database
    ├── models/             # User, Calculation (ORM)
    ├── schemas/            # Pydantic In/Out
    └── services/           # auth, pricing (lógica iterativa), logistics, upload
```

## Rodar localmente

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # preencher DATABASE_URL e JWT_SECRET
alembic upgrade head
uvicorn main:app --reload --port 8000
```

API em `http://localhost:8000` · docs em `/docs`.

## Endpoints (prefixo `/api`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | /auth/login | — | Login, retorna JWT + user |
| POST | /auth/refresh | — | Renova access token |
| GET | /users | master | Lista usuários |
| POST | /users | master | Cria usuário |
| DELETE | /users/{id} | master | Exclui (admin protegido) |
| POST | /calculations/calculate | sim | Calcula preço (stateless) |
| GET | /calculations | sim | Histórico do usuário |
| POST | /calculations | sim | Salva cálculo |
| DELETE | /calculations/{id} | sim | Exclui do histórico |
| POST | /uploads | sim | Upload de foto (multipart) → `{ url }` |
| POST | /logistics/distance | sim | Distância entre 2 CEPs |
| GET | /health | — | Healthcheck |

## Usuário inicial (seed)

`admin` / `master123` (role master). **Troque a senha após o primeiro acesso.**

## Banco de dados (Supabase)

Use a connection string do **Session Pooler** (porta 5432, IPv4), formato:
`postgresql+asyncpg://USUARIO:SENHA@HOST:5432/postgres`. A conexão direta (IPv6)
falha em muitos ambientes de hospedagem.

## Deploy (EasyPanel)

- `docker-compose.yml` na rede externa `easypanel`. O Dockerfile roda
  `alembic upgrade head` no boot.
- Configure as variáveis (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`,
  `PUBLIC_BASE_URL`) no painel.
- No frontend (voxel-value-visor), defina `VITE_API_URL` apontando para a URL
  pública deste backend antes do build.
- `CORS_ORIGINS` deve incluir a URL do frontend.
