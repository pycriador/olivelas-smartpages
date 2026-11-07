---
title: "Perfil de Serviço, Portas e Variáveis de Ambiente — Olivelas SmartPages"
status: "ACCEPTED"
owner: "olivelas-platform-team"
created: "2026-10-20"
updated: "2026-11-07"
review_date: "2027-02-07"
version: "2.0"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Olivelas)

# Level 4 — Perfil de Serviço (`operations/service-profile.md`)

## 1. Portas, Ambientes e Processos de Runtime (`Confirmed`)

| Ambiente / Processo | Porta / URL Padrão | Variável de Sobrescrita | Comando de Inicialização / Workflow |
| :--- | :---: | :--- | :--- |
| **GitHub Pages (Produção)** | `https://pycriador.github.io/olivelas-smartpages/` | `VITE_BASE_PATH` | `.github/workflows/deploy.yml` |
| **Backend FastAPI (Local / Container)** | `8005` | `OPSPAGES_BACKEND_PORT` | `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8005` |
| **Frontend Vite Dev/Preview** | `5176` | `OPSPAGES_FRONTEND_PORT` | `npm --prefix frontend run dev -- --host 0.0.0.0 --port 5176` |

---

## 2. Variáveis de Ambiente (`.env`) e GitHub Secrets (`Confirmed`)

Definidas em [`backend/app/core/config.py`](../../backend/app/core/config.py), documentadas em [`.env.example`](../../.env.example) e configuradas nos **GitHub Actions Secrets** do repositório [`pycriador/olivelas-smartpages`](https://github.com/pycriador/olivelas-smartpages):

| Variável / Secret | Padrão | Obrigatória | Descrição |
| :--- | :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | `https://flxcgbftpwjvxetqbtzq.supabase.co` | **Sim** | URL da API Supabase utilizada pelo Frontend (`supabaseBridge.ts`) e Backend |
| `VITE_SUPABASE_KEY` | *(lido do `.env` / Secret)* | **Sim** | Chave pública/anon (`sb_publishable_...`) do projeto Supabase |
| `VITE_SUPABASE_SCHEMA` | `smartpages` | **Sim** | Schema PostgreSQL isolado usado no PostgREST (`Accept-Profile: smartpages`) |
| `db_host` / `DB_HOST` | `db.<project-ref>.supabase.co` | **Sim** | Host PostgreSQL do Supabase (traduzido automaticamente para o Session Pooler IPv4 quando necessário) |
| `db_port` / `DB_PORT` | `5432` | **Sim** | Porta PostgreSQL |
| `db` / `DB` | `postgres` | **Sim** | Nome do banco de dados no Supabase |
| `db_username` / `DB_USERNAME` | `postgres` | **Sim** | Usuário de conexão PostgreSQL |
| `db_password` / `DB_PASSWORD` | *(lido do `.env` / Secret)* | **Sim** | Senha do banco PostgreSQL no Supabase |
| `DB_SCHEMA` | `smartpages` | **Sim** | Schema isolado do projeto no PostgreSQL |
| `OPSPAGES_DB_ENGINE` | `postgresql` | Não | Motor de banco (`postgresql`, `sqlite` ou `mariadb`) |
| `PROJECT_NAME` | `"Olivelas SmartPages — Static Hosting & Governance"` | Não | Nome exibido no OpenAPI e healthcheck |
| `SECRET_KEY` | *(gerado/lido do `.env`)* | **Sim** | Chave HMAC-SHA256 para assinatura de tokens JWT e criptografia Fernet |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | Não | Tempo de expiração do JWT |
| `REPOS_STORAGE_DIR` | `"../repos"` | Não | Caminho para armazenamento dos repositórios Git `/repos/{slug}` |
| `DEFAULT_MAX_BUILD_SIZE_MB` | `250` | Não | Quota padrão por upload de build (MB) |
| `DEFAULT_MAX_STORAGE_MB` | `2048` | Não | Quota padrão de armazenamento por projeto (MB) |
| `DEFAULT_MAX_DEPLOYS_PER_DAY` | `100` | Não | Limite diário de deploys por projeto |
| `DEFAULT_MAX_RETAINED_VERSIONS` | `50` | Não | Número máximo de releases mantidas por projeto |
