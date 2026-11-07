---
title: "Visão Geral de Segurança — Olivelas SmartPages (Olivelas OpsPages)"
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

# Visão Geral de Segurança (Nível 5)

## 1. Princípios de Segurança da Plataforma

O **Olivelas SmartPages (`Olivelas OpsPages`)** implementa uma arquitetura de defesa em profundidade (*Defense-in-Depth*) projetada para hospedagem de aplicações estáticas corporativas integradas ao **Supabase** (schema isolado `smartpages`) e ao **Olivelas OpsBase**:

1. **Isolamento de Schema no Supabase (`smartpages`)**: Todas as tabelas, triggers, políticas RLS e funções RPC (`SECURITY DEFINER` com `SET search_path = smartpages, public, extensions`) operam isoladas do schema `public` e de outros sistemas na mesma instância Supabase.
2. **Promoção Determinística do 1º Usuário para Global Admin**: O banco inicia com `0` usuários pré-cadastrados (sem senhas padrão estáticas). O primeiro usuário registrado assume automaticamente o papel de Global Admin (`is_superuser = true`).
3. **Zero Segredos no Código ou Bundle (`P-13`)**: Nenhuma credencial privada reside no código-fonte ou no bundle estático. Configurações públicas com escopo restrito são injetadas em runtime via `/pages/{slug}/env-config.js`.
4. **Autenticação Estrita por Header (`P-8`)**: Tokens JWT e API Tokens (`opsp_...`) são aceitos exclusivamente via headers HTTP (`Authorization: Bearer <token>`, `apikey` ou `x-api-key`). Tokens na query string (`?token=`) são rejeitados com `HTTP 401`.
5. **Autorização Baseada em Host/Projeto (HBAC)**: Usuários autenticados só operam em projetos para os quais possuam regra HBAC ativa ou papel compatível.
6. **Validação Exata de Origem CORS (`P-9`, `P-10`)**: Nenhuma rota de API ou de projeto estático combina `Access-Control-Allow-Origin: *` com `Access-Control-Allow-Credentials: true`.
7. **Isolamento de Previews Não Aprovados (`P-4`)**: Builds com status `pending_approval`, `rejected` ou `failed` exigem autenticação válida para visualização em `/pages/{slug}/v/{version}/`.

---

## 2. Mecanismos de Autenticação

| Mecanismo | Formato | Uso Principal | Validação |
| :--- | :--- | :--- | :--- |
| **JWT / Sessão Console** | `Authorization: Bearer <token>` | Operadores humanos no GitHub Pages ou Frontend local (`:5176`) | Assinado com `HS256` (`SECRET_KEY`) no Backend ou validado via RPC `smartpages.authenticate_user` (`pgcrypto` Blowfish `$2a$`/`$2b$`). |
| **API Token de Automação** | `apikey: opsp_<type>_<random>` | Pipelines CI/CD (GitHub Actions, scripts de deploy) | Persistido com hash `SHA-256` (`key_hash`) em `smartpages.opspages_api_tokens`, com validação de `scopes`, `project_id` e `expires_at`. |

---

## 3. Documentos Relacionados

- [Fronteiras de Confiança (Trust Boundaries)](./trust-boundaries.md)
- [Controles de Segurança e Conformidade (`P-1` a `P-24`)](./controls-and-compliance.md)
- [Matriz HBAC & Escopos de Token](../contracts/hbac-matrix.md)
