---
title: "Contexto Primário para Agentes de IA — AIOps OpsPages"
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

# Level 0 — Contexto Primário para Agentes de IA (`ai-context.md`)

Este documento é o **ponto de entrada obrigatório (Level 0)** para qualquer agente de IA que opere sobre o repositório **AIOps OpsPages**.

---

## 1. Identidade do Sistema (`Confirmed`)

- **Nome do Produto:** AIOps OpsPages
- **Propósito:** Plataforma corporativa estilo GitHub Pages / Vercel para hospedagem, versionamento Git em `/repos/{slug}`, governança de publicação (`Version Lock`, `Auto-Approval`), injeção de configuração pública do OpsBase (`env-config.js`) e auditoria forense de builds estáticas.
- **Portas Canônicas de Execução:**
  - **Backend FastAPI (`app.main:app`):** `http://localhost:8005`
  - **Frontend Console React (`Vite`):** `http://localhost:5176`
- **Super Admin Padrão:** `willian.jesus@loft.com.br` (credenciais lidas exclusivamente do `.env` local; nunca hardcoded no código ou na UI).

---

## 2. Mapa Rápido do Código-Fonte (`Confirmed`)

| Caminho no Repositório | Papel Técnico |
| :--- | :--- |
| `backend/app/main.py` | Ponto de entrada FastAPI, middlewares de segurança (`P-8`, `P-10`), injeção de config pública (`P-13`), servidor estático `/pages/{slug}` (`P-1` a `P-7`, `P-9`) |
| `backend/app/services/opsbase_service.py` | Cliente de descoberta OpsBase (`http://localhost:8001/api/v1`), validação de chave pública (`anon_key`), sincronização de rotação/revogação sem redeploy e alinhamento de origens CORS |
| `backend/app/api/v1/governance_routes.py` | Rotas de governança, configuração pública por ambiente (`?env=` estrito), webhook `/webhooks/opsbase/key-event`, `/opsbase/sync` e `/opsbase/cors-sync` |
| `backend/app/api/v1/routes.py` | Todos os endpoints REST sob `/api/v1` (auth, overview, projects, deployments, git, tokens, iam, quotas, cors, public-config, audit, errors) |
| `backend/app/api/deps.py` | Dependências de autenticação JWT e API Keys via header (`Authorization`, `X-API-Key`, `apikey`) e rejeição de `?token=` na URL (`P-8`) |
| `backend/app/models/meta_models.py` | Modelos ORM SQLAlchemy 2.0 (`User`, `Group`, `Project`, `ProjectPermission`, `Deployment`, `ApiToken`, `CorsRule`, `ProjectPublicConfig`, `ErrorReport`, `AuditLog`) |
| `backend/app/services/git_storage.py` | Motor Git e sistema de arquivos em `/repos/{slug}` (`git_repo/`, `releases/{version}/`, `current/`, proteção Zip-Slip, suporte a binários Base64) |
| `backend/scripts/` | Scripts CLI administrativos (`setup_db.py`, `create_admin.py`, `manage_users.py`, `change_password.py`) |
| `frontend/src/App.tsx` | Roteador principal sincronizado com `window.location.pathname` |
| `frontend/src/utils/urlState.ts` | Hook `useUrlTableState` para sincronizar busca (`q`), filtros (`status`) e paginação (`page`, `page_size >= 10`) na URL |
| `frontend/src/features/` | Módulos de UI (`landing`, `auth`, `projects`, `deployments`, `explorer`, `git`, `tokens`, `iam`, `quotas`, `cors`, `config`, `audit`, `errors`, `settings`) |
| `sites/portal-loft/` | Código-fonte TypeScript real do projeto **Portal Loft** (`v1.0.0` e `v1.1.0` com seletor de idiomas `PT-BR`/`EN`/`ES`) |

---

## 3. Invariantes e Restrições Não-Negociáveis (`Constraints`)

1. **Proibição de Credenciais Hardcoded**: Nenhuma senha, `SECRET_KEY` ou token real pode ser inserido no código-fonte, na tela de login (`LoginPage.tsx`) ou na documentação.
2. **Tokens Exclusivamente via Header (`P-8`)**: Qualquer requisição contendo `?token=`, `?access_token=` ou `?api_key=` na query string deve ser rejeitada com `401 Unauthorized`.
3. **CORS Estrito (`P-9` & `P-10`)**:
   - Nunca retornar `Access-Control-Allow-Origin: *` junto com `Access-Control-Allow-Credentials: true`.
   - Sempre incluir `Vary: Origin` ao validar origens dinâmicas.
   - Nunca emitir `Access-Control-Allow-Credentials: true` para origens fora da allowlist do projeto.
4. **Proteção de Previews Não Aprovados (`P-4`)**: Releases com status `pending_approval`, `rejected` ou `failed` em `/pages/{slug}/v/{version}` exigem autenticação via header até serem aprovadas.
5. **Sanitização de Dados Públicos (`P-11`)**: O endpoint público `GET /api/v1/public/overview` e `GET /health` não podem expor e-mails pessoais nem caminhos físicos de disco (`repos_root`, `repo_disk_path`).
6. **Paginação e Rotas no Frontend**:
   - Toda tela do console possui sua própria rota de URL (`/dashboard`, `/deployments`, `/explorer`, `/git`, `/tokens`, `/iam`, `/quotas`, `/cors`, `/public-config`, `/audit`, `/errors`, `/settings`).
   - Toda listagem paginada deve sincronizar seus parâmetros na URL e exibir no mínimo **10 itens por página** (`pageSize >= 10`).
7. **Atualização Documental Atômica**: Qualquer alteração em rotas de API, tabelas de banco ou regras de segurança exige atualização simultânea em [`docs/contracts/`](contracts/) e [`docs/security/`](security/).
