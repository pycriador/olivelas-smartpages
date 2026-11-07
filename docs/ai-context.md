---
title: "Contexto Primário para Agentes de IA — Olivelas SmartPages (Olivelas OpsPages)"
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

# Level 0 — Contexto Primário para Agentes de IA (`ai-context.md`)

Este documento é o **ponto de entrada obrigatório (Level 0)** para qualquer agente de IA que opere sobre o repositório **Olivelas SmartPages (Olivelas OpsPages)**.

---

## 1. Identidade do Sistema (`Confirmed`)

- **Nome do Produto:** Olivelas SmartPages (`Olivelas OpsPages`)
- **Repositório Oficial:** [`https://github.com/pycriador/olivelas-smartpages`](https://github.com/pycriador/olivelas-smartpages)
- **Publicação GitHub Pages:** [`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/)
- **Propósito:** Plataforma corporativa estilo GitHub Pages / Vercel para hospedagem de builds estáticas, versionamento Git em `/repos/{slug}` e no banco (`opspages_release_files`), governança de publicação (`Version Lock`, `Auto-Approval`), injeção de configuração pública do Olivelas OpsBase (`env-config.js`) e auditoria forense.
- **Banco de Dados Principal:** Supabase PostgreSQL (`https://flxcgbftpwjvxetqbtzq.supabase.co`) operando exclusivamente no schema isolado **`smartpages`** (`DB_SCHEMA=smartpages`, `VITE_SUPABASE_SCHEMA=smartpages`).
- **Política de Primeiro Cadastro (Global Admin):** A tabela `smartpages.opspages_users` inicia com `0` registros. O **primeiro usuário cadastrado** na plataforma (via UI, API, RPC ou CLI) torna-se automaticamente **Global Admin** (`is_superuser = true` + grupo `Platform Admins`).
- **Portas Canônicas de Execução Local:**
  - **Backend FastAPI (`app.main:app`):** `http://localhost:8005`
  - **Frontend Console React (`Vite`):** `http://localhost:5176`

---

## 2. Mapa Rápido do Código-Fonte (`Confirmed`)

| Caminho no Repositório | Papel Técnico |
| :--- | :--- |
| `supabase/migrations/` | Migrations SQL oficiais do schema `smartpages` (`001` tabelas e triggers, `002` seed de configurações, grupos HBAC e 20 temas, `003` RPCs PostgREST e RLS) |
| `backend/app/main.py` | Ponto de entrada FastAPI, middlewares de segurança (`P-8`, `P-10`), injeção de config pública (`P-13`), servidor estático `/pages/{slug}` (`P-1` a `P-7`, `P-9`) |
| `backend/app/core/config.py` | Configuração Pydantic v2 lendo `.env`, tradução automática do host direto Supabase para o Session Pooler IPv4 (`aws-1-us-west-2.pooler.supabase.com`) e `DB_SCHEMA=smartpages` |
| `backend/app/db/session.py` | Inicialização SQLAlchemy 2.0 com `search_path=smartpages,public,extensions`, seed exclusivo de configurações da plataforma, grupos HBAC e 20 temas |
| `backend/app/api/v1/auth.py` | Endpoints `/api/v1/auth/bootstrap-status`, `/api/v1/auth/register` (1º usuário = Global Admin), `/api/v1/auth/login`, `/api/v1/auth/me` e `/api/v1/auth/change-password` |
| `backend/app/services/opsbase_service.py` | Cliente de descoberta Olivelas OpsBase (`http://localhost:8001/api/v1`), validação de `anon_key`, backoff exponencial de login (`P-22`), passthrough de `rls_enforced` (`P-24`) e alinhamento de CORS |
| `backend/app/models/meta_models.py` | Modelos ORM SQLAlchemy 2.0 das 15 tabelas `opspages_*` no schema `smartpages` |
| `backend/scripts/manage_users.py` | CLI completa para gerenciar usuários e roles HBAC diretamente no Supabase (`status`, `list`, `create`, `set-role`, `promote-admin`, `revoke-admin`, `reset-password`, `activate`, `deactivate`, `delete`) |
| `backend/scripts/setup_db.py` | CLI para aplicar as migrations SQL no Supabase (`smartpages`) e inspecionar contadores do schema |
| `backend/scripts/examples_supabase_cli.sh` | Receitas interativas e exemplos práticos de gerenciamento de usuários no Supabase via CLI |
| `frontend/src/services/supabaseBridge.ts` | Ponte REST/RPC direta do Frontend (GitHub Pages) para o schema `smartpages` do Supabase (`Accept-Profile: smartpages`), permitindo operação serverless completa |
| `.github/workflows/deploy.yml` | Pipeline CI/CD GitHub Actions para build e publicação automática no GitHub Pages com secrets do Supabase |

---

## 3. Invariantes e Restrições Não-Negociáveis (`Constraints`)

1. **Isolamento Estrito no Schema `smartpages`**: Nenhuma tabela, função ou trigger deste projeto deve ser criada no schema `public` do Supabase; tudo reside em `smartpages.*`.
2. **Proibição de Credenciais Hardcoded**: Nenhuma senha, `SECRET_KEY` ou chave privada pode ser inserida no código-fonte ou na documentação. As credenciais vivem no `.env` local (ignorado pelo Git) e nos **GitHub Actions Secrets**.
3. **Tokens Exclusivamente via Header (`P-8`)**: Qualquer requisição contendo `?token=`, `?access_token=` ou `?api_key=` na query string deve ser rejeitada com `401 Unauthorized`.
4. **CORS Estrito (`P-9` & `P-10`)**:
   - Nunca retornar `Access-Control-Allow-Origin: *` junto com `Access-Control-Allow-Credentials: true`.
   - Sempre incluir `Vary: Origin` ao validar origens dinâmicas.
5. **Proteção de Previews Não Aprovados (`P-4`)**: Releases com status `pending_approval`, `rejected` ou `failed` em `/pages/{slug}/v/{version}` exigem autenticação via header até serem aprovadas.
6. **Sanitização de Dados Públicos (`P-11`)**: O endpoint público `GET /api/v1/public/overview` e `GET /health` nunca expõem e-mails pessoais nem caminhos físicos de disco para visitantes anônimos.
7. **Atualização Documental Atômica**: Qualquer alteração em rotas de API, tabelas de banco ou regras de segurança exige atualização simultânea em [`docs/contracts/`](contracts/) e [`docs/security/`](security/).
