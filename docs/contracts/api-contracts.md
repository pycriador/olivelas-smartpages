---
title: "Contratos de API REST e Rotas Estáticas — AIOps OpsPages"
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

# Level 3 — Contratos de API (`contracts/api-contracts.md`)

Todos os endpoints são servidos pelo Backend FastAPI na porta `8005` e documentados interativamente em `http://localhost:8005/docs` (OpenAPI 3.1).

> **Regra de Segurança (`P-8`)**: A autenticação é aceita **exclusivamente** via headers HTTP (`Authorization: Bearer <token>`, `X-API-Key: <token>` ou `apikey: <token>`). Qualquer parâmetro `?token=`, `?access_token=` ou `?api_key=` na URL retorna `401 Unauthorized`.

---

## 1. Autenticação e Visão Geral Pública

| Método | Rota | Auth | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/health` | Público | Sonda de integridade da API e dialeto do banco (sem expor caminhos de disco) (`P-11`) | `200` |
| `GET` | `/api/v1/public/overview` | Público | Resumo sanitizado da plataforma e projetos públicos (sem e-mails ou paths internos) (`P-11`) | `200` |
| `POST` | `/api/v1/auth/login` | Público | Autentica via `username` (ou e-mail) e `password`, retornando JWT `access_token` | `200`, `401` |
| `GET` | `/api/v1/auth/me` | JWT / Key | Retorna perfil do usuário autenticado e grupos HBAC | `200`, `401` |

---

## 2. Projetos, Credenciais CI/CD e Downloads Públicos

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/projects` | `viewer` | Lista projetos visíveis ao usuário com papel efetivo HBAC | `200`, `401` |
| `POST` | `/api/v1/projects` | `editor` | Cria novo projeto e inicializa repositório Git em `/repos/{slug}` | `201`, `400`, `403` |
| `GET` | `/api/v1/projects/{project_id}` | `viewer` | Detalhes do projeto, quotas, cache e headers de segurança | `200`, `404` |
| `PUT` | `/api/v1/projects/{project_id}` | `admin` | Atualiza metadados, `auto_approval`, `custom_domain`, cache (`P-1`) e security headers (`P-2`) | `200`, `403` |
| `DELETE` | `/api/v1/projects/{project_id}` | `admin` | Remove projeto e estrutura em `/repos/{slug}` | `200`, `403` |
| `POST` | `/api/v1/projects/{project_id}/lock` | `admin` | Trava ou destrava a versão ativa em produção (`Version Lock`) | `200`, `403` |
| `GET` | `/api/v1/projects/{project_id}/credentials` | `viewer` | Retorna endpoints CI/CD e token de deploy mascarado | `200` |
| `POST` | `/api/v1/projects/{project_id}/credentials/reveal` | `editor` | Revela ou rotaciona o token de deploy CI/CD registrando auditoria forense | `200`, `403` |
| `GET` | `/api/v1/public/projects/{slug}/download-build` | Público* | Baixa `.zip` da build estática compilada (`HTML/CSS/JS/IMG`) | `200`, `404` |
| `GET` | `/api/v1/public/projects/{slug}/download-source` | Público* | Baixa `.zip` do código-fonte TypeScript da versão | `200`, `404` |

---

## 3. Deployments (Builds Estáticas), Explorer e Controle Git

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/projects/{id}/deployments` | `viewer` | Lista todas as releases do projeto | `200` |
| `POST` | `/api/v1/projects/{id}/deployments/upload` | `editor` / `deploy` | Upload `multipart/form-data` (`.zip` / `.tar.gz`) com schema OpenAPI completo (`P-6`) | `201`, `400`, `422` |
| `POST` | `/api/v1/projects/{id}/deployments/quick-build` | `editor` / `deploy` | Cria build a partir de mapa JSON `files` (texto) e `binary_files` (Base64) (`P-12`) | `201`, `400`, `422` |
| `POST` | `/api/v1/projects/{id}/deployments/{dep_id}/approve` | `editor` | Aprova ou rejeita uma build `pending_approval` | `200`, `400` |
| `POST` | `/api/v1/projects/{id}/deployments/{dep_id}/rollback` | `editor` | Promove imediatamente qualquer versão anterior para produção (`LIVE`) | `200`, `400` |
| `GET` | `/api/v1/projects/{id}/deployments/{ver}/files` | `viewer` | Retorna a árvore de arquivos da release em `/repos/{slug}/releases/{ver}` | `200`, `404` |
| `GET` | `/api/v1/projects/{id}/deployments/{ver}/file-content` | `viewer` | Lê o conteúdo textual ou metadados binários de um arquivo da build | `200`, `404` |
| `GET` | `/api/v1/projects/{id}/git/status` | `viewer` | Status do repositório Git local (`branch`, `head_sha`, `tags`, `commits`) | `200` |
| `GET` | `/api/v1/projects/{id}/git/diff` | `viewer` | Executa `git diff` entre `base_version` e `target_version` | `200` |
| `POST` | `/api/v1/projects/{id}/git/sync` | `editor` | Sincroniza commits e tags com remoto GitHub (`push`, `pull`, `status`) | `200` |

---

## 4. Configuração Pública (`P-13`), CORS (`P-9`), IAM, Tokens, Quotas, Auditoria e Erros (`/errors`)

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/public/projects/{slug}/config` | Público* | Retorna a configuração pública e credenciais `opsbase_anon_key` por `?env=` (`400` se `env` inválido, `404` se inativo — sem fallback silencioso) (`P-13`) | `200`, `400`, `404` |
| `GET` | `/api/v1/projects/{id}/public-config` | `viewer` | Lista configurações públicas de todos os ambientes do projeto (`P-13`) | `200` |
| `PUT` | `/api/v1/projects/{id}/public-config/{env}` | `editor` | Sincroniza e atualiza configuração pública (`production`, `staging`, `development`, `preview`) via descoberta no OpsBase (rejeita `opsbase_anon_key` manual com `400`) | `200`, `400`, `422` |
| `DELETE` | `/api/v1/projects/{id}/public-config/{env}` | `admin` | Remove configuração pública de um ambiente | `200`, `404` |
| `POST` | `/api/v1/projects/{id}/opsbase/sync` | `editor` | Re-sincroniza sob demanda a chave pública e URL do projeto junto ao endpoint de descoberta do OpsBase (`http://localhost:8001/api/v1`) sem redeploy | `200`, `400`, `502` |
| `POST` | `/api/v1/projects/{id}/opsbase/cors-sync` | `editor` | Alinha automaticamente as origens exatas do projeto (incluindo `custom_domain`) na allowlist de CORS do OpsPages e do OpsBase | `200`, `400` |
| `POST` | `/api/v1/webhooks/opsbase/key-event` | Webhook Secret | Recebe eventos de rotação ou revogação de chave (`key.rotated`, `key.revoked`) do OpsBase e atualiza a config pública em runtime sem redeploy | `200`, `401`, `404` |
| `GET` | `/api/v1/projects/{id}/cors` | `viewer` | Lista regras de CORS do projeto | `200` |
| `POST` | `/api/v1/projects/{id}/cors` | `admin` | Cria regra CORS validando sintaxe de origem e proibindo `*` com credenciais (`P-9`) | `201`, `422` |
| `DELETE` | `/api/v1/projects/{id}/cors/{rule_id}` | `admin` | Remove regra de CORS | `200` |
| `GET` | `/api/v1/errors` | Público / Auth | Lista relatos de erro com filtros (`q`, `status`, `severity`, `scope`) e paginação (`page`, `page_size`) | `200` |
| `POST` | `/api/v1/errors/report` | Público / Auth | Registra um novo relato de erro de página ou plataforma | `201`, `422` |
| `PATCH` | `/api/v1/errors/{error_id}/status` | `editor` | Atualiza o status do erro (`open`, `investigating`, `resolved`, `ignored`) | `200`, `404` |
| `GET` | `/api/v1/audit` | `viewer` | Lista logs de auditoria forense imutáveis | `200` |

---

## 5. Rotas de Hospedagem Estática (`/pages/*`)

| Método(s) | Rota | Descrição |
| :---: | :--- | :--- |
| `GET`, `HEAD`, `OPTIONS` | `/pages/{slug}/env-config.js` | Script JS dinâmico que define `window.__OPSPAGES_CONFIG__` e `window.__OPSBASE_CONFIG__` (`P-13`) |
| `GET`, `HEAD`, `OPTIONS` | `/pages/{slug}/env-config.json` | JSON puro com a configuração pública do projeto (`P-13`) |
| `GET`, `HEAD`, `OPTIONS` | `/pages/{slug}/{file_path:path}` | Serve arquivos da versão em produção (`LIVE`) com `ETag`/`304`, `Cache-Control` diferenciado e CSP |
| `GET`, `HEAD`, `OPTIONS` | `/pages/{slug}/v/{version}/{file_path:path}` | Serve preview isolado da versão especificada (exige header de autenticação se não aprovada — `P-4`) |
