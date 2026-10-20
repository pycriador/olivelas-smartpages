---
title: "Matriz de Controle de Acesso Hierárquico (HBAC) — AIOps OpsPages"
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

# Level 3 — Matriz HBAC (`contracts/hbac-matrix.md`)

O controle de acesso do **AIOps OpsPages** é implementado em [`backend/app/services/hbac_service.py`](../../backend/app/services/hbac_service.py) com hierarquia determinística de papéis (`RANK = {"viewer": 1, "editor": 2, "admin": 3}`).

---

## 1. Resolução de Papel Efetivo (`Confirmed`)

Para qualquer usuário e projeto, o papel efetivo é o **maior nível** entre:
1. Flag `user.is_superuser == True` ➔ concede automaticamente `admin` em toda a plataforma.
2. Papel do grupo global ao qual o usuário pertence (`opspages_groups.role_level`).
3. Permissão direta do usuário no projeto (`opspages_project_permissions.user_id`).
4. Permissão de grupo vinculada ao projeto (`opspages_project_permissions.group_id`).

---

## 2. Matriz de Permissões por Operação (`Confirmed`)

| Operação / Recurso | Público (Sem Login) | Visualizador (`viewer`) | Editor (`editor`) | Admin (`admin`) | Super Admin (`is_superuser`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
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
| Travar / Destravar versão em produção (`Version Lock`) | ❌ | ❌ (`403`) | ❌ (`403`) | ✅ | ✅ |
| Gerenciar regras de CORS, Security Headers (CSP) e Quotas | ❌ | ❌ (`403`) | ❌ (`403`) | ✅ | ✅ |
| Gerenciar permissões HBAC do projeto e excluir projeto | ❌ | ❌ (`403`) | ❌ (`403`) | ✅ | ✅ |
| Criar/excluir usuários e grupos globais da plataforma | ❌ | ❌ (`403`) | ❌ (`403`) | ✅* | ✅ |

---

## 3. Escopos de Tokens de API (`opspages_api_tokens`)

| Prefixo do Token | Escopo (`scope`) | Equivalência HBAC | Uso Recomendado |
| :--- | :---: | :---: | :--- |
| `opsp_read_*` | `read` | `viewer` | Leitura de metadados e acesso autenticado a previews (`P-4`) |
| `opsp_deploy_*` | `deploy` | `editor` (restrito a deploy) | Pipelines GitHub Actions / GitLab CI (`upload` e `quick-build`) |
| `opsp_admin_*` | `admin` | `admin` | Automação de infraestrutura e governança completa via API |
