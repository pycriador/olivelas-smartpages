---
title: "Controles de Segurança e Conformidade (P-1 a P-24) — Olivelas SmartPages"
status: "ACCEPTED"
owner: "olivelas-platform-team"
created: "2026-10-20"
updated: "2026-11-07"
review_date: "2027-02-07"
version: "2.0"
---

> **Language:** pt-BR
> **Status:** ACCEPTED
> **Documentation Standard v1.0 (Olivelas)**

# Controles de Segurança e Conformidade (`P-1` a `P-24`) (Nível 5)

## 1. Matriz de Conformidade Técnica

A tabela abaixo consolida os controles técnicos e de segurança implementados e verificados por testes automatizados na plataforma **Olivelas SmartPages (`Olivelas OpsPages`)**:

| Código | Categoria | Descrição do Requisito | Controle Implementado | Status | Evidência Primária |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P-1** | Cache & Performance | Cache diferenciado para `index.html` vs. assets imutáveis com hash | `index.html` servido com `Cache-Control: no-cache, max-age=0, must-revalidate`; assets com hash no nome ou em `/assets/` recebem `public, max-age=31536000, immutable`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-2** | Segurança HTTP | Headers de segurança padrão e configuráveis por projeto | Aplicação automática de `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-3** | Resiliência de Deploy | Rollback sem tela em branco por falha 404 de assets antigos | Retenção multi-release em `/repos/{slug}/releases/{version}/` com fallback inteligente de `/assets/*` entre releases recentes. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-4** | Controle de Acesso | Preview protegido antes da aprovação da build | Builds com status `pending_approval`, `rejected` ou `failed` exigem token válido no header em `/pages/{slug}/v/{version}/`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-5** | Isolamento de Preview | Preview deve carregar seus próprios assets e não os da versão em produção | Reescrita automática de caminhos `/pages/{slug}/` e injeção de `<base href>` no preview + resolução via `Referer`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-6** | Contrato OpenAPI | Documentação explícita do corpo multipart no upload de build | Rota `POST /api/v1/projects/{id}/deployments/upload` documentada com `File(...)` e `Form(...)` no OpenAPI. | **IMPLEMENTADO** | [`backend/app/api/v1/deployments.py`](../../backend/app/api/v1/deployments.py) |
| **P-7** | Protocolo HTTP | Suporte a requisições condicionais (`304 Not Modified`), `HEAD` e `OPTIONS` | Cálculo de `ETag` (forte) e `Last-Modified`, avaliação de `If-None-Match` e `If-Modified-Since` retornando `304`, além de `HEAD` e `OPTIONS`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-8** | Autenticação | Proibição de token na query string (`?token=`) | Extrator de credenciais rejeita `?token=`, `?access_token=` e `?api_key=` na URL com `401 Unauthorized`. | **IMPLEMENTADO** | [`backend/app/services/auth_service.py`](../../backend/app/services/auth_service.py) |
| **P-9** | Segurança CORS (Páginas) | Validação exata de origem por projeto, `Vary: Origin` e bloqueio de `*` com credenciais | Validação da origem contra `cors_rules` ativas e `custom_domain` do projeto; nunca combina `*` com `Access-Control-Allow-Credentials: true`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-10** | Segurança CORS (API) | Lista explícita de origens permitidas na API | Uso exclusivo da lista explícita `settings.CORS_ORIGINS` com `Vary: Origin`. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-11** | Privacidade | Sanitização de `/api/v1/public/overview` e `/health` | Omissão de e-mails de usuários e caminhos físicos de disco para requisições não autenticadas. | **IMPLEMENTADO** | [`backend/app/main.py`](../../backend/app/main.py) |
| **P-12** | Build Engine | Suporte a arquivos binários no endpoint `quick-build` | Campo `binary_files` (Base64) permitindo envio de imagens, ícones e fontes via JSON. | **IMPLEMENTADO** | [`backend/app/services/deployment_service.py`](../../backend/app/services/deployment_service.py) |
| **P-13** | Integração OpsBase | Injeção de credenciais públicas por projeto e ambiente | Descoberta de `opsbase_anon_...`, bloqueio de chaves manuais/placeholders (`400`), validação estrita de `?env=` (`400`/`404`) e sincronização sem redeploy. | **IMPLEMENTADO** | [`backend/app/services/opsbase_service.py`](../../backend/app/services/opsbase_service.py) |
| **P-22** | Proteção de Autenticação | Backoff exponencial no login administrativo contra o OpsBase | Cache negativo thread-safe (`30s` a `300s`) que impede tempestades de login em caso de `401`/`429`. | **IMPLEMENTADO** | [`backend/tests/test_p22_opsbase_auth_backoff.py`](../../backend/tests/test_p22_opsbase_auth_backoff.py) |
| **P-24** | Integridade de Metadados | Passthrough fiel do atributo `rls_enforced` | Repassa o valor exato de `rls_enforced` retornado pela descoberta do OpsBase (`True`, `False` ou `None`), nunca um booleano fixo. | **IMPLEMENTADO** | [`backend/tests/test_r6_rls_enforced_passthrough.py`](../../backend/tests/test_r6_rls_enforced_passthrough.py) |

---

## 2. Execução da Suíte de Testes de Conformidade

```bash
python3 -m pytest \
  backend/tests/test_opspages.py \
  backend/tests/test_r6_rls_enforced_passthrough.py \
  backend/tests/test_p22_opsbase_auth_backoff.py
```
