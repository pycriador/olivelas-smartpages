---
title: "Perfil de Serviço, Portas e Variáveis de Ambiente — AIOps OpsPages"
status: "ACCEPTED"
owner: "aiops-platform-team"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.1"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Loft AIOps)

# Level 4 — Perfil de Serviço (`operations/service-profile.md`)

## 1. Portas e Processos de Runtime (`Confirmed`)

| Processo | Porta Padrão | Variável de Sobrescrita | Comando de Inicialização |
| :--- | :---: | :--- | :--- |
| **Backend FastAPI** | `8005` | `OPSPAGES_BACKEND_PORT` | `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8005` |
| **Frontend Vite Dev/Preview** | `5176` | `OPSPAGES_FRONTEND_PORT` | `npm --prefix frontend run dev -- --host 0.0.0.0 --port 5176` |

---

## 2. Variáveis de Ambiente (`.env`) (`Confirmed`)

Definidas em [`backend/app/core/config.py`](../../backend/app/core/config.py) e documentadas em [`.env.example`](../../.env.example):

| Variável | Padrão | Obrigatória em Prod | Descrição |
| :--- | :--- | :---: | :--- |
| `PROJECT_NAME` | `"AIOps OpsPages"` | Não | Nome exibido no OpenAPI e healthcheck |
| `ENVIRONMENT` | `"development"` | Sim (`production`) | Ambiente de execução |
| `SECRET_KEY` | *(placeholder dev)* | **Sim** | Chave HMAC-SHA256 para assinatura de tokens JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | Não | Tempo de expiração do JWT |
| `OPSPAGES_DB_ENGINE` | `"sqlite"` | Sim | Motor de banco: `sqlite`, `postgresql` ou `mariadb` |
| `OPSPAGES_META_DB_URL` | `"sqlite:///./opspages_meta.db"` | Sim | Connection string SQLAlchemy 2.0 |
| `REPOS_STORAGE_DIR` | `"../repos"` | Não | Caminho para armazenamento dos repositórios Git `/repos/{slug}` |
| `DEFAULT_SUPERADMIN_EMAIL` | `"willian.jesus@loft.com.br"` | Sim | E-mail do Super Admin padrão |
| `DEFAULT_SUPERADMIN_PASSWORD` | *(lido do `.env`)* | **Sim** | Senha do Super Admin (nunca exposta no código) |
| `DEFAULT_MAX_BUILD_SIZE_MB` | `250` | Não | Quota padrão por upload de build (MB) |
| `DEFAULT_MAX_STORAGE_MB` | `2048` | Não | Quota padrão de armazenamento por projeto (MB) |
| `DEFAULT_MAX_DEPLOYS_PER_DAY` | `100` | Não | Limite diário de deploys por projeto |
| `DEFAULT_MAX_RETAINED_VERSIONS` | `50` | Não | Número máximo de releases mantidas por projeto |
