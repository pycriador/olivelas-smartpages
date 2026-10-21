---
title: "ADR-0003: Injeção Dinâmica de Credenciais Públicas (P-13), Cache Diferenciado (P-1) e Headers de Segurança (P-2, P-9)"
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

# ADR-0003: Injeção Dinâmica de Credenciais Públicas (`P-13`), Cache Diferenciado (`P-1`) e Headers de Segurança (`P-2`, `P-9`)

## 1. Contexto
No modelo de site estático com acesso direto ao **AIOps OpsBase**, gravar a URL do OpsBase e a chave pública (`anon_key`) dentro do bundle JavaScript durante o build impede a promoção do mesmo artefato entre ambientes (`development`, `staging`, `preview`, `production`). Além disso, páginas estáticas exigem políticas distintas de cache para `index.html` vs. `/assets/*`, validação estrita de `Origin` no CORS e headers defensivos (`CSP`, `X-Frame-Options`, `HSTS`).

## 2. Decisão
1. **Injeção de Configuração Pública em Runtime e Vínculo com Descoberta OpsBase (`P-13`)**:
   - Criar a entidade `ProjectPublicConfig` (`opspages_public_configs`) por projeto e ambiente (`production`, `staging`, `development`, `preview`), vinculada a um projeto do OpsBase (`opsbase_project_slug`).
   - Buscar `opsbase_anon_key` e `opsbase_url` (padrão `http://localhost:8001/api/v1` em dev) diretamente no endpoint de descoberta do OpsBase (`/api/v1/projects/by-slug/{slug}/public-config`), rejeitando chaves digitadas manualmente ou placeholders (`HTTP 400`) e bloqueando qualquer chave privilegiada (`service_role_key`, senhas ou URIs de banco).
   - Validar estritamente o parâmetro `?env=`: ambientes inválidos retornam `400 Bad Request` e ambientes inativos/inexistentes retornam `404 Not Found`, sem cair silenciosamente em `production`.
   - Suportar atualização imediata sem redeploy do site quando a chave é rotacionada ou revogada no OpsBase, tanto via webhook (`POST /api/v1/webhooks/opsbase/key-event`) quanto via re-sincronização sob demanda (`POST /api/v1/projects/{id}/opsbase/sync`), além de alinhamento automático de origens exatas de CORS (`POST /api/v1/projects/{id}/opsbase/cors-sync`).
   - Expor `/pages/{slug}/env-config.js`, `/pages/{slug}/env-config.json` e `/api/v1/public/projects/{slug}/config` com `Cache-Control: no-store, no-cache, must-revalidate` e injetar automaticamente `window.__OPSPAGES_CONFIG__` / `window.__OPSBASE_CONFIG__` no `<head>` do HTML servido.
2. **Cache Diferenciado Configurável por Projeto (`P-1`)**:
   - HTML e `env-config.*`: `no-cache, max-age=0, must-revalidate`.
   - Assets com hash (`/assets/*`): `public, max-age=31536000, immutable`.
   - Demais arquivos estáticos: `public, max-age=3600`.
3. **CORS Estrito (`P-9`, `P-10`) e Security Headers (`P-2`)**:
   - Validar correspondência exata do header `Origin` contra as regras ativas do projeto + `custom_domain`, emitindo sempre `Vary: Origin` e bloqueando `*` com `Access-Control-Allow-Credentials: true`.
   - Aplicar `Content-Security-Policy` (incluindo `frame-ancestors`), `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` e `Permissions-Policy`.

## 3. Consequências
- **Positivas:** O mesmo `.zip` de build pode ser promovido de `staging`/`preview` para `production` recebendo as credenciais públicas corretas do OpsBase em tempo real, com segurança de cabeçalhos e cache otimizado.
