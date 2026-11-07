---
title: "Detalhamento do Backend FastAPI — Olivelas SmartPages (Olivelas OpsPages)"
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

# Level 2 — Backend Service (`application/backend-service.md`)

## 1. Visão Geral do Serviço (`Confirmed`)

O serviço de backend do **Olivelas SmartPages (`Olivelas OpsPages`)** é uma aplicação Python 3.13 / FastAPI executada na porta padrão `8005` (`app.main:app`), conectada ao schema isolado **`smartpages`** no Supabase PostgreSQL. Ele acumula duas responsabilidades complementares:
1. **Control Plane REST API (`/api/v1/*`)**: Autenticação e auto-registro com promoção automática do primeiro usuário para Global Admin, gestão de projetos, uploads de builds, versionamento Git, HBAC, tokens CI/CD, quotas, CORS, configuração pública por ambiente, auditoria forense e central de erros.
2. **Static & Preview Hosting Plane (`/pages/{slug}/*`)**: Servidor de arquivos estáticos com suporte a SPA fallback, injeção de credenciais públicas (`env-config.js`), cache diferenciado (`P-1`), headers de segurança (`P-2`), fallback de assets pós-rollback (`P-3`), proteção de preview não aprovado (`P-4`), isolamento de assets por versão (`P-5`), requisições condicionais `ETag`/`304`/`HEAD`/`OPTIONS` (`P-7`) e CORS exato por projeto (`P-9`).

---

## 2. Organização Interna dos Módulos (`Confirmed`)

| Módulo / Arquivo | Responsabilidade |
| :--- | :--- |
| [`backend/app/main.py`](../../backend/app/main.py) | Inicialização do FastAPI, lifespan (`init_meta_db`), middleware `StrictCorsAndSecurityMiddleware` (`P-2`, `P-8`, `P-9`, `P-10`) e rotas de hospedagem estática `/pages/*` |
| [`backend/app/core/config.py`](../../backend/app/core/config.py) | Configurações Pydantic v2 (`Settings`), leitura das variáveis do Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `db_host`, `db_port`, `db`, `db_username`, `db_password`, `DB_SCHEMA=smartpages`) e resolução automática do Session Pooler IPv4 |
| [`backend/app/core/security.py`](../../backend/app/core/security.py) | Hash de senhas (`bcrypt`), geração/validação de JWT (`HS256`) e geração de API Keys (`opsp_<type>_<random>`) com hash SHA-256 |
| [`backend/app/db/session.py`](../../backend/app/db/session.py) | Engine SQLAlchemy 2.0 com `search_path=smartpages,public,extensions`, criação do schema `smartpages` e seed exclusivo de configurações da plataforma, grupos HBAC e 20 temas |
| [`backend/app/models/meta_models.py`](../../backend/app/models/meta_models.py) | Definição declarativa das 15 tabelas `opspages_*` |
| [`backend/app/api/v1/auth.py`](../../backend/app/api/v1/auth.py) | Endpoints `/bootstrap-status`, `/register` (1º cadastro = Global Admin), `/login`, `/me` e `/change-password` |
| [`backend/app/services/git_storage_service.py`](../../backend/app/services/git_storage_service.py) | Motor Git e armazenamento físico em `/repos/{slug}` (`ensure_initialized`, `commit_release_snapshot`, `activate_release`, `get_repo_status`, `get_diff_between_versions`, `sync_github`) |
| [`backend/app/services/opsbase_service.py`](../../backend/app/services/opsbase_service.py) | Integração com Olivelas OpsBase, descoberta de `anon_key`, passthrough de `rls_enforced` (`P-24`), backoff exponencial de login (`P-22`) e alinhamento de CORS |
| [`backend/scripts/manage_users.py`](../../backend/scripts/manage_users.py) | CLI administrativa para gerenciar usuários e roles HBAC diretamente no schema `smartpages` do Supabase |
| [`backend/scripts/setup_db.py`](../../backend/scripts/setup_db.py) | CLI para aplicar as migrations de `supabase/migrations/*.sql` no Supabase e exibir o diagnóstico do schema `smartpages` |
