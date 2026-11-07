---
title: "Contratos de API REST, RPCs Supabase e Rotas Estáticas — Olivelas SmartPages"
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

# Level 3 — Contratos de API (`contracts/api-contracts.md`)

Todos os endpoints REST são servidos pelo Backend FastAPI na porta `8005` (`http://localhost:8005/docs`) e possuem equivalência direta no schema `smartpages` do Supabase via [`frontend/src/services/supabaseBridge.ts`](../../frontend/src/services/supabaseBridge.ts).

> **Regra de Segurança (`P-8`)**: A autenticação é aceita **exclusivamente** via headers HTTP (`Authorization: Bearer <token>`, `apikey: <token>` ou `x-api-key: <token>`). Qualquer parâmetro `?token=`, `?access_token=` ou `?api_key=` na URL retorna `401 Unauthorized`.

---

## 1. Autenticação, Primeiro Cadastro (Global Admin) e Visão Geral Pública

| Método | Rota | Auth | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/health` | Público | Sonda de integridade da API, dialeto e schema (`smartpages`) (`P-11`) | `200` |
| `GET` | `/api/v1/public/overview` | Público | Resumo sanitizado da plataforma e projetos públicos (`P-11`) | `200` |
| `GET` | `/api/v1/auth/bootstrap-status` | Público | Retorna `has_users`, `user_count`, `next_user_will_be_global_admin`, configurações da plataforma e os 20 temas visuais | `200` |
| `POST` | `/api/v1/auth/register` | Público | Cadastra usuário na plataforma. **Se `user_count == 0`, promove automaticamente a Global Admin (`is_superuser = true`)** | `201`, `403`, `409` |
| `POST` | `/api/v1/auth/login` | Público | Autentica via `username` (ou e-mail) e `password`, retornando JWT `access_token` | `200`, `401` |
| `GET` | `/api/v1/auth/me` | JWT / Key | Retorna perfil do usuário autenticado e grupos HBAC | `200`, `401` |
| `POST` | `/api/v1/auth/change-password` | JWT | Altera a própria senha ou (se Global Admin) redefine senha de outro usuário | `200`, `401`, `403` |

---

## 2. Funções RPC no Supabase (`smartpages.*`)

Expostas via PostgREST (`POST https://<ref>.supabase.co/rest/v1/rpc/<fn>` com header `Content-Profile: smartpages`):

| Função RPC (`smartpages.*`) | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `smartpages.bootstrap_status()` | *(nenhum)* | Retorna contadores (`user_count`, `project_count`), flag `next_user_will_be_global_admin`, `settings` e `themes` |
| `smartpages.register_user` | `p_email`, `p_full_name`, `p_password`, `p_username`, `p_role` | Cadastra usuário com hash Blowfish (`pgcrypto`); promove o 1º usuário automaticamente a Global Admin |
| `smartpages.authenticate_user` | `p_identifier`, `p_password` | Valida credenciais contra hashes `$2a$`/`$2b$`, registra `USER_LOGIN` em `opspages_audit_logs` e retorna sessão |
| `smartpages.change_user_password` | `p_user_id`, `p_current_password`, `p_new_password`, `p_is_admin_override` | Atualiza senha do usuário com validação de senha atual ou override administrativo |
| `smartpages.admin_create_user` | `p_username`, `p_email`, `p_full_name`, `p_password`, `p_is_superuser`, `p_group_ids`, `p_role`, `p_actor_email` | Criação administrativa de usuário já vinculado aos grupos HBAC |

---

## 3. Projetos, Credenciais CI/CD e Downloads Públicos

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/projects` | `viewer` | Lista projetos visíveis ao usuário com papel efetivo HBAC | `200`, `401` |
| `POST` | `/api/v1/projects` | `editor` | Cria novo projeto e inicializa repositório Git em `/repos/{slug}` | `201`, `400`, `409` |
| `GET` | `/api/v1/projects/{project_id}` | `viewer` | Detalhes do projeto, quotas, cache e headers de segurança | `200`, `404` |
| `PUT` | `/api/v1/projects/{project_id}` | `admin` | Atualiza metadados, `auto_approval`, `custom_domain`, cache (`P-1`) e security headers (`P-2`) | `200`, `403` |
| `DELETE` | `/api/v1/projects/{project_id}` | `admin` | Remove projeto e estrutura em `/repos/{slug}` | `200`, `403` |
| `POST` | `/api/v1/projects/{project_id}/lock` | `editor` | Trava ou destrava a versão ativa em produção (`Version Lock`) | `200`, `403` |
| `GET` | `/api/v1/projects/{project_id}/cicd-credentials` | `viewer` | Retorna endpoints CI/CD e tokens mascarados (ou revelados com reautenticação) | `200` |
| `GET` | `/api/v1/public/projects/{slug}/download-build` | Público* | Baixa `.zip` da build estática compilada (`HTML/CSS/JS/IMG`) | `200`, `404` |
| `GET` | `/api/v1/public/projects/{slug}/download-source` | Público* | Baixa `.zip` do código-fonte TypeScript da versão | `200`, `404` |

---

## 4. Deployments (Builds Estáticas), Explorer e Controle Git

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/projects/{id}/deployments` | `viewer` | Lista todas as releases do projeto | `200` |
| `POST` | `/api/v1/projects/{id}/deployments/upload` | `editor` / `deploy` | Upload `multipart/form-data` (`.zip` / `.tar.gz`) com schema OpenAPI completo (`P-6`) | `201`, `400`, `422` |
| `POST` | `/api/v1/projects/{id}/deployments/quick-build` | `editor` / `deploy` | Cria build a partir de mapa JSON `files` (texto) e `binary_files` (Base64) (`P-12`) | `201`, `400`, `422` |
| `POST` | `/api/v1/projects/{id}/deployments/{ver}/approve` | `editor` | Aprova e publica uma build `pending_approval` | `200`, `400` |
| `POST` | `/api/v1/projects/{id}/deployments/{ver}/rollback` | `editor` | Promove imediatamente qualquer versão anterior para produção (`LIVE`) | `200`, `400` |
| `GET` | `/api/v1/projects/{id}/deployments/{ver}/files` | `viewer` | Retorna a árvore de arquivos da release | `200`, `404` |
| `GET` | `/api/v1/projects/{id}/deployments/{ver}/file-content` | `viewer` | Lê o conteúdo textual ou metadados binários de um arquivo da build | `200`, `404` |
| `GET` | `/api/v1/projects/{id}/git/status` | `viewer` | Status do repositório Git (`branch`, `head_sha`, `tags`, `commits`) | `200` |
| `GET` | `/api/v1/projects/{id}/git/diff` | `viewer` | Compara diferenças entre `base_version` e `target_version` | `200` |
| `POST` | `/api/v1/projects/{id}/git/sync` | `editor` | Sincroniza commits e tags com remoto GitHub (`push`, `pull`, `status`) | `200` |

---

## 5. Configuração Pública (`P-13`), CORS (`P-9`), IAM, Tokens, Quotas, Auditoria e Erros (`/errors`)

| Método | Rota | Papel Mínimo | Descrição | Códigos HTTP |
| :---: | :--- | :---: | :--- | :---: |
| `GET` | `/api/v1/public/projects/{slug}/config` | Público* | Retorna a configuração pública por `?env=` (`400` se `env` inválido, `404` se inativo) (`P-13`) | `200`, `400`, `404` |
| `GET` | `/api/v1/projects/{id}/public-configs` | `viewer` | Lista configurações públicas de todos os ambientes do projeto (`P-13`) | `200` |
| `PUT` | `/api/v1/projects/{id}/public-configs` | `editor` | Atualiza configuração pública (`production`, `staging`, `development`, `preview`) | `200`, `400`, `422` |
| `POST` | `/api/v1/projects/{id}/opsbase/sync` | `editor` | Re-sincroniza sob demanda a chave pública e URL do projeto junto ao Olivelas OpsBase | `200`, `400`, `503` |
| `POST` | `/api/v1/projects/{id}/opsbase/cors-sync` | `editor` | Alinha origens exatas do projeto na allowlist de CORS do OpsPages e do OpsBase | `200`, `422` |
| `POST` | `/api/v1/webhooks/opsbase/key-event` | Webhook Secret | Recebe eventos `key.rotated` / `key.revoked` do OpsBase sem necessidade de redeploy | `200`, `401`, `404` |
| `GET` | `/api/v1/projects/{id}/cors` | `viewer` | Lista regras de CORS do projeto | `200` |
| `POST` | `/api/v1/projects/{id}/cors` | `editor` | Cria regra CORS validando sintaxe de origem e proibindo `*` com credenciais (`P-9`) | `201`, `422` |
| `GET` | `/api/v1/errors` | Público / Auth | Lista relatos de erro com filtros e paginação | `200` |
| `POST` | `/api/v1/errors/report` | Público / Auth | Registra um novo relato de erro de página ou plataforma | `201`, `422` |
| `GET` | `/api/v1/audit/logs` | `viewer` | Lista logs de auditoria forense imutáveis | `200` |
