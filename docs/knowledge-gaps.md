---
title: "Registro de Evidências, Lacunas de Conhecimento e Dívidas Técnicas"
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

# Level 6 — Evidências, Lacunas e Dívidas Técnicas (`knowledge-gaps.md`)

Seguindo o padrão [`loft-br/aiops-documentation`](https://github.com/loft-br/aiops-documentation), este documento classifica rigorosamente o que está **Confirmado (`Confirmed`)**, **Inferido (`Inferred`)**, **Desconhecido (`Unknown`)** e **Proposto (`Proposed`)**.

---

## 1. Matriz de Evidências Confirmadas (`Confirmed`)

| ID | Requisito / Comportamento | Status | Evidência Direta no Código |
| :--- | :--- | :---: | :--- |
| **EV-01** | Cache diferenciado entre `index.html` (`no-cache`) e assets com hash (`max-age=31536000, immutable`) (`P-1`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_compute_cache_control`) |
| **EV-02** | Headers de segurança configuráveis por projeto (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`) (`P-2`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_apply_security_headers`) |
| **EV-03** | Rollback sem tela em branco com fallback de `/assets/*` entre releases (`P-3`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_resolve_static_file`) |
| **EV-04** | Preview `/pages/{slug}/v/{version}` exige autenticação quando `pending_approval`, `rejected` ou `failed` (`P-4`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_serve_project_file`) |
| **EV-05** | Preview `/pages/{slug}/v/{version}` isola e reescreve caminhos de assets da própria versão (`P-5`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_rewrite_preview_asset_paths`) |
| **EV-06** | Rota de upload documentada com schema `multipart/form-data` no OpenAPI (`P-6`) | `Confirmed` | [`backend/app/api/v1/routes.py`](../../backend/app/api/v1/routes.py) (`openapi_extra`) |
| **EV-07** | Suporte a `ETag`, `Last-Modified`, `304 Not Modified`, `HEAD` e `OPTIONS` em `/pages/*` (`P-7`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_is_not_modified`, métodos `GET`, `HEAD`, `OPTIONS`) |
| **EV-08** | Rejeição imediata (`401`) de `?token=`, `?access_token=` e `?api_key=` na URL (`P-8`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) e [`backend/app/api/deps.py`](../../backend/app/api/deps.py) |
| **EV-09** | Validação exata de `Origin` no CORS do projeto, `Vary: Origin`, sem `*` com credenciais (`P-9`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_apply_project_cors_headers`) e [`backend/app/schemas/schemas.py`](../../backend/app/schemas/schemas.py) |
| **EV-10** | Lista explícita de origens permitidas no CORS da API (`P-10`) | `Confirmed` | [`backend/app/core/config.py`](../../backend/app/core/config.py) (`CORS_ORIGINS`) |
| **EV-11** | `/api/v1/public/overview` e `/health` sem exposição de e-mails ou caminhos de disco (`P-11`) | `Confirmed` | [`backend/app/api/v1/routes.py`](../../backend/app/api/v1/routes.py) (`public_platform_overview`) |
| **EV-12** | Suporte a arquivos binários Base64 (`binary_files`) no `quick-build` (`P-12`) | `Confirmed` | [`backend/app/services/git_storage.py`](../../backend/app/services/git_storage.py) (`deploy_from_files_dict`) |
| **EV-13** | Injeção de credenciais públicas por projeto/ambiente (`env-config.js`, `env-config.json`) (`P-13`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) e [`backend/app/api/v1/routes.py`](../../backend/app/api/v1/routes.py) |
| **EV-14** | Rotas dedicadas na URL, `/errors` e paginação por URL (`>= 10` itens/página) | `Confirmed` | [`frontend/src/utils/urlState.ts`](../../frontend/src/utils/urlState.ts) e [`frontend/src/features/errors/ErrorsManager.tsx`](../../frontend/src/features/errors/ErrorsManager.tsx) |

---

## 2. Evoluções Futuras e Dívidas Técnicas (`Proposed`)

| ID | Descrição | Classificação | Impacto | Recomendação |
| :--- | :--- | :---: | :---: | :--- |
| **GAP-01** | Code-splitting dinâmico (`React.lazy`) no bundle do Console Frontend (`dist/assets/index-*.js` ~1.38 MB minificado) | `Proposed` | Baixo (afeta apenas o primeiro carregamento do console administrativo) | Configurar `manualChunks` no `frontend/vite.config.ts` separando `antd` e `@ant-design/icons`. |
| **GAP-02** | Distribuição de builds para CDN externa (Cloudflare / CloudFront) além do armazenamento Git local em `/repos` | `Proposed` | Médio (para escala global multi-região) | Adicionar webhook assíncrono pós-aprovação em `GitStorageService.activate_version`. |
| **GAP-03** | Certificados TLS automáticos (ACME / Let's Encrypt) para `custom_domain` diretamente no processo Python | `Proposed` | Baixo (em produção o TLS é terminado no Ingress/ALB corporativo) | Delegar terminação TLS ao Ingress Controller / Cloudflare Proxy mantendo validação de `Host` e `Origin` no OpsPages. |
