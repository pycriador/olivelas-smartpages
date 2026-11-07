---
title: "Contexto do Sistema e Integrações — Olivelas SmartPages (Olivelas OpsPages)"
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

# Level 2 — Contexto do Sistema (`architecture/system-context.md`)

## 1. Atores Humanos e Automatizados (`Confirmed`)

| Ator | Tipo | Canal de Interação | Papel HBAC / Escopo |
| :--- | :--- | :--- | :--- |
| **Global Admin (1º Cadastro na Plataforma)** | Humano | GitHub Pages, Console Web (`:5176`), API (`:8005`), CLI (`manage_users.py`) | `is_superuser=True` + grupo `Platform Admins` (`admin` irrestrito em todos os projetos e usuários) |
| **Project Admin** | Humano | Console Web / API | `admin` (gerencia configurações do projeto, lock de versão, CORS, config pública, tokens e permissões) |
| **Frontend Editor** | Humano | Console Web / API | `editor` (sobe novas builds, usa Quick Builder, aprova releases e executa rollback) |
| **Project Viewer** | Humano | Console Web / Preview autenticado | `viewer` (inspeciona builds, árvore de arquivos, histórico Git e previews) |
| **Pipeline CI/CD (GitHub Actions)** | Sistema | REST API (`POST /api/v1/projects/{id}/deployments/upload`) | API Token `opsp_deploy_*` enviado via header `apikey`, `x-api-key` ou `Authorization` |
| **Visitante / Usuário Final** | Humano | Browser (`GET /pages/{slug}/`) | Acesso público de leitura às páginas publicadas (`is_public=True`) e reporte em `/errors` |

---

## 2. Sistemas Externos Integrados (`Confirmed`)

### 2.1. Supabase PostgreSQL & PostgREST (`https://flxcgbftpwjvxetqbtzq.supabase.co`)
- **Relação:** Banco de dados oficial e camada BaaS/RPC do projeto, operando de forma estritamente isolada no schema **`smartpages`**.
- **Mecanismo de Integração:**
  - O Backend FastAPI conecta-se via `psycopg` v3 (com tradução automática para o Session Pooler IPv4 `aws-1-us-west-2.pooler.supabase.com` e `search_path=smartpages,public,extensions`).
  - O Frontend publicado no GitHub Pages conecta-se diretamente ao PostgREST e às funções RPC `smartpages.*` (`bootstrap_status`, `register_user`, `authenticate_user`, `change_user_password`, `admin_create_user`) enviando `Accept-Profile: smartpages` e `Content-Profile: smartpages`.

### 2.2. Olivelas OpsBase (`http://localhost:8001` / `http://localhost:8001/api/v1`)
- **Relação:** Backend BaaS corporativo da Olivelas que fornece banco de dados dinâmico, autenticação e RPC para as SPAs estáticas hospedadas no **Olivelas SmartPages**.
- **Mecanismo de Integração (`P-13`, `P-22`, `P-24`):** Cada projeto pode ser vinculado a um projeto do OpsBase via endpoint de descoberta (`/api/v1/projects/{id}/public-config` ou `/by-slug/{slug}/public-config`), sincronizando a chave pública `opsbase_anon_...`, o status real de `rls_enforced` (`P-24`), URLs por ambiente (`production`, `staging`, `development`, `preview`) e a allowlist de CORS de origem exata (`POST /api/v1/projects/{id}/cors/pages-sync`), com proteção de backoff exponencial (`P-22`).

### 2.3. GitHub Pages & GitHub Actions (`pycriador/olivelas-smartpages`)
- **Relação:** Hospedagem oficial do Console Frontend em [`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/) via workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml), utilizando os secrets configurados no repositório.
