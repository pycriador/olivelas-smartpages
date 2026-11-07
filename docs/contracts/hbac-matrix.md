---
title: "Matriz de Controle de Acesso Hierárquico (HBAC) — Olivelas SmartPages"
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

# Level 3 — Matriz HBAC (`contracts/hbac-matrix.md`)

O controle de acesso do **Olivelas SmartPages (`Olivelas OpsPages`)** é implementado em [`backend/app/services/hbac_service.py`](../../backend/app/services/hbac_service.py) com hierarquia determinística de papéis (`RANK = {"viewer": 1, "editor": 2, "admin": 3}`).

---

## 1. Resolução de Papel Efetivo e Regra do 1º Cadastro (`Confirmed`)

1. **Primeiro Cadastro na Plataforma = Global Admin**:
   - Quando `smartpages.opspages_users` possui `0` registros, o primeiro usuário que se cadastrar recebe automaticamente `is_superuser = True` e associação ao grupo `Platform Admins` (`role_level = 'admin'`).
   - Cadastros subsequentes via auto-registro recebem por padrão o grupo `Project Viewers` (`role_level = 'viewer'`), podendo ser promovidos por um Global Admin via interface `/iam` ou CLI (`manage_users.py`).
2. **Cálculo de Papel Efetivo por Projeto**:
   - `user.is_superuser == True` ➔ concede automaticamente `admin` em toda a plataforma.
   - Papel do grupo global ao qual o usuário pertence (`opspages_groups.role_level`).
   - Permissão direta do usuário no projeto (`opspages_project_permissions.user_id`).
   - Permissão de grupo vinculada ao projeto (`opspages_project_permissions.group_id`).

---

## 2. Matriz de Permissões por Operação (`Confirmed`)

| Operação / Recurso | Público (Sem Login) | Visualizador (`viewer`) | Editor (`editor`) | Admin (`admin`) | Global Admin (`is_superuser`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Consultar status de bootstrap (`/api/v1/auth/bootstrap-status`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Realizar 1º cadastro na plataforma (`/api/v1/auth/register`) | ✅ (Vira Global Admin) | — | — | — | — |
| Acessar página publicada (`/pages/{slug}/` se `is_public=True`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consumir config pública (`/pages/{slug}/env-config.js`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Informar erro em `/errors` (`POST /api/v1/errors/report`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Acessar preview não aprovado (`/pages/{slug}/v/{ver}`) (`P-4`) | ❌ (`401`) | ✅ | ✅ | ✅ | ✅ |
| Inspecionar árvore de arquivos e código da build (`/explorer`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Visualizar commits, tags e `git diff` (`/git`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Subir nova build (`.zip` ou `quick-build`) (`/deployments`) | ❌ | ❌ (`403`) | ✅ | ✅ | ✅ |
| Aprovar ou rejeitar build pendente | ❌ | ❌ (`403`) | ✅ | ✅ | ✅ |
| Executar Rollback para versão anterior | ❌ | ❌ (`403`) | ✅ | ✅ | ✅ |
| Editar config pública por ambiente (`/public-config`) | ❌ | ❌ (`403`) | ✅ | ✅ | ✅ |
| Travar / Destravar versão em produção (`Version Lock`) | ❌ | ❌ (`403`) | ✅ | ✅ | ✅ |
| Gerenciar regras de CORS, Security Headers (CSP) e Quotas | ❌ | ❌ (`403`) | ✅ / ❌ | ✅ | ✅ |
| Gerenciar permissões HBAC do projeto e excluir projeto | ❌ | ❌ (`403`) | ❌ (`403`) | ✅ | ✅ |
| Criar/excluir usuários e grupos globais da plataforma (`/iam`) | ❌ | ❌ (`403`) | ❌ (`403`) | ✅* | ✅ |

---

## 3. Escopos de Tokens de API (`opspages_api_tokens`)

| Prefixo do Token | Tipo (`token_type`) | Equivalência HBAC | Uso Recomendado |
| :--- | :---: | :---: | :--- |
| `opsp_read_*` | `read` | `viewer` | Leitura de metadados e acesso autenticado a previews (`P-4`) |
| `opsp_deploy_*` | `deploy` | `editor` | Pipelines GitHub Actions / GitLab CI (`upload` e `quick-build`) |
| `opsp_service_*` | `service` | `admin` | Automação de infraestrutura e governança completa via API |
