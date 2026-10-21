---
title: "Controles de Segurança e Conformidade (P-1 a P-13) — AIOps OpsPages"
status: "ACCEPTED"
owner: "AIOps Platform Team (Loft)"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.0.0"
---

> **Language:** pt-BR
> **Status:** ACCEPTED
> **Documentation Standard v1.0 (Loft AIOps)**

# Controles de Segurança e Conformidade (`P-1` a `P-13`) (Nível 5)

## 1. Matriz de Conformidade Técnica

A tabela abaixo consolida todos os 13 requisitos técnicos e de segurança auditados no reteste da plataforma **AIOps OpsPages**, vinculando cada item ao controle implementado e à sua evidência verificável no código-fonte:

| Código | Categoria | Descrição do Requisito | Controle Implementado | Status | Evidência Primária |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P-1** | Cache & Performance | Cache diferenciado para `index.html` vs. assets imutáveis com hash | `index.html` servido com `Cache-Control: no-cache, no-store, must-revalidate` (configurável por projeto); assets com hash no nome ou em `/assets/` recebem `public, max-age=31536000, immutable`. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-2** | Segurança HTTP | Headers de segurança padrão e configuráveis por projeto | Aplicação automática de `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy` e `Strict-Transport-Security`, customizáveis em `projects.security_headers`. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-3** | Resiliência de Deploy | Rollback sem tela em branco por falha 404 de assets antigos | Retenção multi-release em `/repos/{slug}/releases/v{version}/` com fallback inteligente de `/assets/*` entre a release ativa e releases recentes, aliado ao `no-cache` no `index.html`. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-4** | Controle de Acesso | Preview protegido antes da aprovação da build | Builds com status diferente de `published`/`approved` exigem token Bearer válido em `/preview/{slug}/{version}/` (retorna `401` sem credencial). | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-5** | Isolamento de Preview | Preview deve carregar seus próprios assets e não os da versão em produção | Reescrita automática de caminhos absolutos (`/assets/`, `/img/`, `/opspages-config.js`) no HTML do preview e resolução via `Referer` para garantir isolamento por versão. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-6** | Contrato OpenAPI | Documentação explícita do corpo multipart no upload de build | Rota `POST /api/v1/projects/{id}/builds/upload` anotada com `File(...)` e `Form(...)`, gerando schema `multipart/form-data` completo no `/openapi.json`. | **IMPLEMENTADO** | [`projects.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/projects.py) |
| **P-7** | Protocolo HTTP | Suporte a requisições condicionais (`304 Not Modified`), `HEAD` e `OPTIONS` | Cálculo de `ETag` (forte) e `Last-Modified`, avaliação de `If-None-Match` e `If-Modified-Since` retornando `304`, além de suporte nativo aos métodos `HEAD` e `OPTIONS`. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-8** | Autenticação | Proibição de token na query string (`?token=`) | Extrator de credenciais rejeita `request.query_params.get("token")` com `401 Unauthorized` e exige `Authorization: Bearer <token>`. | **IMPLEMENTADO** | [`deps.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/core/deps.py) |
| **P-9** | Segurança CORS (Páginas) | Validação exata de origem por projeto, `Vary: Origin` e bloqueio de `*` com credenciais | Validação da origem contra `cors_rules` ativas e `custom_domains` do projeto; nunca retorna `Access-Control-Allow-Credentials: true` junto com `*` ou para origem fora da lista. | **IMPLEMENTADO** | [`pages_server.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/pages_server.py) |
| **P-10** | Segurança CORS (API) | Lista explícita de origens permitidas na API (sem regex aberta para qualquer porta) | Remoção de `allow_origin_regex`; uso exclusivo da lista explícita `settings.ALLOWED_ORIGINS` com `Vary: Origin`. | **IMPLEMENTADO** | [`main.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/main.py) |
| **P-11** | Privacidade | Sanitização de `/api/v1/public/overview` | Remoção de e-mails de usuários, logs internos e caminhos absolutos de disco do endpoint público. | **IMPLEMENTADO** | [`audit.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/audit.py) |
| **P-12** | Build Engine | Suporte a arquivos binários no endpoint `quick-build` | Campo `encoding: "utf-8" | "base64"` em `QuickBuildFileItem` permitindo envio de imagens, ícones e fontes via JSON Base64. | **IMPLEMENTADO** | [`projects.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/routes/projects.py) |
| **P-13** | Integração OpsBase | Mecanismo documentado de injeção de credenciais públicas por projeto e ambiente com vínculo ao OpsBase | Vínculo obrigatório a projeto OpsBase (`opsbase_project_slug`) com descoberta automática de `opsbase_anon_key` e `opsbase_url` (`http://localhost:8001/api/v1` padrão em dev), bloqueio de chaves digitadas/placeholders (`400`), validação estrita de `?env=` (`400`/`404` sem fallback silencioso), sincronização por webhook/sob demanda sem redeploy, alinhamento de CORS e injeção em runtime com `no-cache`. | **IMPLEMENTADO** | [`opsbase_service.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/services/opsbase_service.py), [`projects.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/v1/projects.py), [`governance_routes.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/api/v1/governance_routes.py) |

---

## 2. Comandos de Verificação Automatizada (Smoke Test de Conformidade)

Execute os comandos abaixo contra o backend na porta `8005` para validar os controles de segurança:

```bash
# 1. Verificar rejeição de token na URL (P-8 -> Deve retornar 401)
curl -i "http://localhost:8005/api/v1/projects?token=qualquer_token"

# 2. Verificar sanitização do overview público (P-11 -> Não deve conter e-mails nem storage_path)
curl -s "http://localhost:8005/api/v1/public/overview" | jq .

# 3. Verificar CORS da API contra origem maliciosa (P-10 -> Não deve retornar Access-Control-Allow-Origin)
curl -i -H "Origin: https://evil.example.org" "http://localhost:8005/api/v1/public/overview"

# 4. Verificar Security Headers, ETag e Cache-Control no index.html (P-1, P-2, P-7)
curl -I "http://localhost:8005/pages/portal-loft/index.html"

# 5. Verificar script de configuração pública injetada (P-13)
curl -s "http://localhost:8005/pages/portal-loft/opspages-config.js?env=production"
```
