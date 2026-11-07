---
title: "Registro de Evidências, Lacunas de Conhecimento e Dívidas Técnicas — Olivelas SmartPages"
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

# Level 6 — Evidências, Lacunas e Dívidas Técnicas (`knowledge-gaps.md`)

Este documento classifica rigorosamente o que está **Confirmado (`Confirmed`)**, **Inferido (`Inferred`)**, **Desconhecido (`Unknown`)** e **Proposto (`Proposed`)** no projeto **Olivelas SmartPages (`Olivelas OpsPages`)**.

---

## 1. Matriz de Evidências Confirmadas (`Confirmed`)

| ID | Requisito / Comportamento | Status | Evidência Direta no Código |
| :--- | :--- | :---: | :--- |
| **EV-01** | Cache diferenciado entre `index.html` (`no-cache`) e assets com hash (`max-age=31536000, immutable`) (`P-1`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_compute_cache_control`) |
| **EV-02** | Headers de segurança configuráveis por projeto (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`) (`P-2`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_apply_default_security_headers`) |
| **EV-03** | Rollback sem tela em branco com fallback de `/assets/*` entre releases (`P-3`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_find_fallback_asset_across_releases`) |
| **EV-04** | Preview `/pages/{slug}/v/{version}` exige autenticação quando `pending_approval`, `rejected` ou `failed` (`P-4`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`serve_project_version_preview`) |
| **EV-05** | Preview `/pages/{slug}/v/{version}` isola e reescreve caminhos de assets da própria versão (`P-5`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_rewrite_html_for_preview_and_runtime_config`) |
| **EV-06** | Rota de upload documentada com schema `multipart/form-data` no OpenAPI (`P-6`) | `Confirmed` | [`backend/app/api/v1/deployments.py`](../../backend/app/api/v1/deployments.py) |
| **EV-07** | Suporte a `ETag`, `Last-Modified`, `304 Not Modified`, `HEAD` e `OPTIONS` em `/pages/*` (`P-7`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_evaluate_conditional_or_method_response`) |
| **EV-08** | Rejeição imediata (`401`) de `?token=`, `?access_token=` e `?api_key=` na URL (`P-8`) | `Confirmed` | [`backend/app/services/auth_service.py`](../../backend/app/services/auth_service.py) (`_extract_raw_header_token`) |
| **EV-09** | Validação exata de `Origin` no CORS do projeto, `Vary: Origin`, sem `*` com credenciais (`P-9`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`_build_project_cors_and_security_headers`) |
| **EV-10** | Lista explícita de origens permitidas no CORS da API (`P-10`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`StrictCorsAndSecurityMiddleware`) |
| **EV-11** | `/api/v1/public/overview` e `/health` sem exposição de e-mails ou caminhos de disco para anônimos (`P-11`) | `Confirmed` | [`backend/app/main.py`](../../backend/app/main.py) (`get_public_overview`, `health_check`) |
| **EV-12** | Suporte a arquivos binários Base64 (`binary_files`) no `quick-build` (`P-12`) | `Confirmed` | [`backend/app/services/deployment_service.py`](../../backend/app/services/deployment_service.py) |
| **EV-13** | Injeção de credenciais públicas por projeto/ambiente (`env-config.js`, `env-config.json`), backoff de login (`P-22`) e `rls_enforced` passthrough (`P-24`) | `Confirmed` | [`backend/app/services/opsbase_service.py`](../../backend/app/services/opsbase_service.py) e [`backend/app/services/project_service.py`](../../backend/app/services/project_service.py) |
| **EV-14** | Schema isolado `smartpages` no Supabase com 5 configurações de plataforma, 20 temas, 3 grupos HBAC, 0 usuários e 0 projetos iniciais | `Confirmed` | [`supabase/migrations/`](../../supabase/migrations/) e [`backend/scripts/setup_db.py`](../../backend/scripts/setup_db.py) |
| **EV-15** | Promoção automática do 1º usuário cadastrado para Global Admin (Triggers PostgreSQL + FastAPI + RPC + UI) | `Confirmed` | [`supabase/migrations/20261107000001_init_smartpages_schema.sql`](../../supabase/migrations/20261107000001_init_smartpages_schema.sql) e [`backend/app/api/v1/auth.py`](../../backend/app/api/v1/auth.py) |
| **EV-16** | Gerenciamento completo de usuários via CLI no Supabase (`manage_users.py` e `examples_supabase_cli.sh`) | `Confirmed` | [`backend/scripts/manage_users.py`](../../backend/scripts/manage_users.py) |
| **EV-17** | Deploy automatizado no GitHub Pages com GitHub Actions Secrets e ponte direta PostgREST (`supabaseBridge.ts`) | `Confirmed` | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) e [`frontend/src/services/supabaseBridge.ts`](../../frontend/src/services/supabaseBridge.ts) |

---

## 2. Evoluções Futuras e Dívidas Técnicas (`Proposed`)

| ID | Descrição | Classificação | Impacto | Recomendação |
| :--- | :--- | :---: | :---: | :--- |
| **GAP-01** | Code-splitting dinâmico (`React.lazy`) no bundle do Console Frontend (`dist/assets/index-*.js` ~1.42 MB minificado) | `Proposed` | Baixo (afeta apenas o primeiro carregamento do console administrativo) | Configurar `manualChunks` no `frontend/vite.config.ts` separando `antd` e `@ant-design/icons`. |
| **GAP-02** | Distribuição de builds para CDN externa (Cloudflare / CloudFront) além do armazenamento Git local em `/repos` e Supabase | `Proposed` | Médio (para escala global multi-região) | Adicionar webhook assíncrono pós-aprovação em `GitStorageService.activate_release`. |
| **GAP-03** | Certificados TLS automáticos (ACME / Let's Encrypt) para `custom_domain` diretamente no processo Python | `Proposed` | Baixo (em produção o TLS é terminado no GitHub Pages / Ingress / Cloudflare) | Delegar terminação TLS ao Ingress Controller / Cloudflare Proxy mantendo validação de `Host` e `Origin` no Olivelas SmartPages. |
