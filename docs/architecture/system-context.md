---
title: "Contexto do Sistema e Integrações — AIOps OpsPages"
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

# Level 2 — Contexto do Sistema (`architecture/system-context.md`)

## 1. Atores Humanos e Automatizados (`Confirmed`)

| Ator | Tipo | Canal de Interação | Papel HBAC / Escopo |
| :--- | :--- | :--- | :--- |
| **Super Admin (`willian.jesus@loft.com.br`)** | Humano | Console Web (`:5176`), API (`:8005`), Scripts CLI | `is_superuser=True` (`admin` irrestrito em todos os projetos e usuários) |
| **Project Admin** | Humano | Console Web (`:5176`) / API (`:8005`) | `admin` (gerencia configurações do projeto, lock de versão, CORS, config pública, tokens e permissões) |
| **Frontend Editor** | Humano | Console Web (`:5176`) / API (`:8005`) | `editor` (sobe novas builds, usa Quick Builder, aprova releases e executa rollback) |
| **Project Viewer** | Humano | Console Web (`:5176`) / Preview autenticado | `viewer` (inspeciona builds, árvore de arquivos, histórico Git e previews) |
| **Pipeline CI/CD (GitHub Actions)** | Sistema | REST API (`POST /api/v1/projects/{id}/deployments/upload`) | API Token `opsp_deploy_*` enviado via header `X-API-Key` ou `Authorization` |
| **Visitante / Usuário Final** | Humano | Browser (`GET /pages/{slug}/`) | Acesso público de leitura às páginas publicadas (`is_public=True`) e reporte em `/errors` |

---

## 2. Sistemas Externos Integrados (`Confirmed`)

### 2.1. AIOps OpsBase (`http://localhost:8001` / `http://localhost:8001/api/v1`)
- **Relação:** Backend BaaS corporativo da Loft que fornece banco de dados dinâmico, autenticação e RPC para as SPAs estáticas hospedadas no **AIOps OpsPages**.
- **Mecanismo de Integração (`P-13` & Parte 2):** Cada projeto do OpsPages é vinculado a um projeto do OpsBase via endpoint de descoberta (`/api/v1/projects/{id}/public-config` ou `/by-slug/{slug}/public-config`), sincronizando a chave pública `opsbase_anon_...`, URLs por ambiente (`production`, `staging`, `development`, `preview`) e a allowlist de CORS de origem exata (`POST /api/v1/projects/{id}/cors/pages-sync`). O OpsPages injeta em runtime (`Cache-Control: no-cache, no-store, must-revalidate`) o script `/pages/{slug}/env-config.js`, expondo `window.__OPSPAGES_CONFIG__` e `window.__OPSBASE_CONFIG__` sem nunca gravar chaves no bundle estático.

### 2.2. GitHub Remote Repositories
- **Relação:** Sincronização bidirecional opcional (`git push --tags` / `git pull`) do repositório local `/repos/{slug}/git_repo` com um repositório GitHub remoto configurado em `project.github_repo_url`.
- **Evidência:** Endpoint `POST /api/v1/projects/{project_id}/git/sync` em [`routes.py`](../../backend/app/api/v1/routes.py) e [`GitStorageService.sync_remote`](../../backend/app/services/git_storage.py).

### 2.3. Motores de Banco de Dados Relacionais
- **Relação:** Armazenamento de metadados da plataforma (`opspages_*`).
- **Suporte Multi-Engine:** SQLite local por padrão (`backend/opspages_meta.db`), com suporte nativo a **PostgreSQL** (`psycopg` v3) e **MariaDB / MySQL** (`PyMySQL`) via SQLAlchemy 2.0.
