---
title: "Detalhamento do Backend FastAPI — AIOps OpsPages"
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

# Level 2 — Backend Service (`application/backend-service.md`)

## 1. Visão Geral do Serviço (`Confirmed`)

O serviço de backend do **AIOps OpsPages** é uma aplicação Python 3.13 / FastAPI executada na porta padrão `8005` (`app.main:app`). Ele acumula duas responsabilidades complementares:
1. **Control Plane REST API (`/api/v1/*`)**: Autenticação, gestão de projetos, uploads de builds, versionamento Git, HBAC, tokens CI/CD, quotas, CORS, configuração pública por ambiente, auditoria forense e central de erros.
2. **Static & Preview Hosting Plane (`/pages/{slug}/*`)**: Servidor de arquivos estáticos de alta confiabilidade com suporte a SPA fallback, injeção de credenciais públicas (`env-config.js`), cache diferenciado (`P-1`), headers de segurança (`P-2`), fallback de assets pós-rollback (`P-3`), proteção de preview não aprovado (`P-4`), isolamento de assets por versão (`P-5`), requisições condicionais `ETag`/`304`/`HEAD`/`OPTIONS` (`P-7`) e CORS exato por projeto (`P-9`).

---

## 2. Organização Interna dos Módulos (`Confirmed`)

| Módulo / Arquivo | Responsabilidade |
| :--- | :--- |
| [`backend/app/main.py`](../../backend/app/main.py) | Inicialização do FastAPI, lifespan (migração automática e seed do projeto `portal-loft`), middleware `security_and_api_cors_middleware` (`P-8`, `P-10`) e rotas de hospedagem estática `/pages/*` |
| [`backend/app/core/config.py`](../../backend/app/core/config.py) | Configurações Pydantic v2 (`Settings`), resolução de `OPSPAGES_META_DB_URL`, allowlist `CORS_ORIGINS` (`P-10`) e credenciais de bootstrap lidas do `.env` |
| [`backend/app/core/security.py`](../../backend/app/core/security.py) | Hash de senhas (`pbkdf2_sha256` / `bcrypt`), geração/validação de JWT (`HS256`) e geração de API Keys (`opsp_<scope>_<random>`) com hash SHA-256 |
| [`backend/app/db/session.py`](../../backend/app/db/session.py) | Engine SQLAlchemy 2.0, migrações incrementais automáticas (`_run_schema_migrations`), seed de grupos HBAC, Super Admin padrão e relatórios de erro iniciais |
| [`backend/app/models/meta_models.py`](../../backend/app/models/meta_models.py) | Definição declarativa das 10 tabelas `opspages_*` |
| [`backend/app/schemas/schemas.py`](../../backend/app/schemas/schemas.py) | Contratos Pydantic v2 de entrada/saída, incluindo validação estrita de `CorsRuleCreate` (`P-9`), `QuickBuildRequest` com `binary_files` (`P-12`), `PublicConfigUpsert` (`P-13`) e `ErrorReportCreate` |
| [`backend/app/services/git_storage.py`](../../backend/app/services/git_storage.py) | Motor Git e armazenamento físico em `/repos/{slug}` (`init_project_repo`, `deploy_from_archive`, `deploy_from_files_dict`, `activate_version`, `get_git_status`, `get_version_diff`, `sync_remote`) |
| [`backend/app/services/hbac_service.py`](../../backend/app/services/hbac_service.py) | Resolução hierárquica de papel efetivo (`admin > editor > viewer`) combinando `is_superuser`, grupos globais e permissões por projeto |
| [`backend/app/services/audit_service.py`](../../backend/app/services/audit_service.py) | Gravação imutável de trilhas de auditoria em `opspages_audit_logs` |
| [`backend/app/api/v1/routes.py`](../../backend/app/api/v1/routes.py) | Implementação de todos os endpoints REST sob `/api/v1` |
