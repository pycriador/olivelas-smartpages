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
1. **Injeção de Configuração Pública em Runtime (`P-13`)**:
   - Criar a entidade `ProjectPublicConfig` (`opspages_public_configs`) por projeto e ambiente.
   - Expor `/pages/{slug}/env-config.js`, `/pages/{slug}/env-config.json` e `/api/v1/public/projects/{slug}/config`.
   - Injetar automaticamente `<script src="/pages/{slug}/env-config.js"></script>` e `window.__OPSPAGES_CONFIG__` / `window.__OPSBASE_CONFIG__` no `<head>` do HTML servido.
2. **Cache Diferenciado Configurável por Projeto (`P-1`)**:
   - HTML e `env-config.*`: `no-cache, max-age=0, must-revalidate`.
   - Assets com hash (`/assets/*`): `public, max-age=31536000, immutable`.
   - Demais arquivos estáticos: `public, max-age=3600`.
3. **CORS Estrito (`P-9`, `P-10`) e Security Headers (`P-2`)**:
   - Validar correspondência exata do header `Origin` contra as regras ativas do projeto + `custom_domain`, emitindo sempre `Vary: Origin` e bloqueando `*` com `Access-Control-Allow-Credentials: true`.
   - Aplicar `Content-Security-Policy` (incluindo `frame-ancestors`), `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` e `Permissions-Policy`.

## 3. Consequências
- **Positivas:** O mesmo `.zip` de build pode ser promovido de `staging`/`preview` para `production` recebendo as credenciais públicas corretas do OpsBase em tempo real, com segurança de cabeçalhos e cache otimizado.
