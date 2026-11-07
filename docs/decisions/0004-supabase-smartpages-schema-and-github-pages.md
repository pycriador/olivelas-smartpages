---
title: "ADR-0004: Isolamento Multi-Projeto em Schema Supabase (smartpages), Política 1º Cadastro = Global Admin e Publicação Híbrida no GitHub Pages"
status: "ACCEPTED"
owner: "olivelas-platform-team"
created: "2026-11-07"
updated: "2026-11-07"
review_date: "2027-02-07"
version: "1.0"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Olivelas)

# ADR-0004: Isolamento Multi-Projeto em Schema Supabase (`smartpages`), Política 1º Cadastro = Global Admin e Publicação Híbrida no GitHub Pages

## 1. Contexto
Durante a migração estrutural e funcional do projeto para o repositório oficial [`https://github.com/pycriador/olivelas-smartpages`](https://github.com/pycriador/olivelas-smartpages), surgiram quatro requisitos arquiteturais centrais:
1. **Isolamento de Banco de Dados no Supabase**: A instância PostgreSQL do Supabase é compartilhada com outros sistemas. O projeto precisava operar em um schema PostgreSQL próprio e estritamente isolado (`smartpages`), sem poluir o schema `public`.
2. **Base Inicial Limpa com Configurações e Personalizações**: Nenhum usuário ou projeto legado deveria ser pré-cadastrado na base de produção (`0` usuários e `0` projetos). Apenas configurações da plataforma (`opspages_platform_settings`), grupos de acesso HBAC (`opspages_groups`) e os 20 temas visuais (`opspages_themes`) deveriam ser populados no seed.
3. **Primeiro Cadastro = Global Admin**: O primeiro usuário registrado na plataforma (seja pela interface Web, pela API FastAPI, por RPC do Supabase ou via CLI) deve se tornar automaticamente o **Global Admin** (`is_superuser = true` e membro do grupo `Platform Admins`).
4. **Publicação no GitHub Pages**: O Frontend precisava funcionar publicado no GitHub Pages (`https://pycriador.github.io/olivelas-smartpages/`) comunicando-se diretamente com o schema `smartpages` no Supabase quando o Backend FastAPI local não estiver ativo, além de continuar suportando o Backend FastAPI completo.

## 2. Decisão
1. **Schema Isolado `smartpages` no PostgreSQL (Supabase)**:
   - Configurar `search_path=smartpages,public,extensions` no SQLAlchemy ([`backend/app/db/session.py`](../../backend/app/db/session.py)) e expor o schema `smartpages` no PostgREST (`ALTER ROLE authenticator SET pgrst.db_schemas = '..., smartpages'`).
   - Versionar todas as migrations SQL em [`supabase/migrations/`](../../supabase/migrations/):
     - [`20261107000001_init_smartpages_schema.sql`](../../supabase/migrations/20261107000001_init_smartpages_schema.sql): Criação do schema `smartpages`, 15 tabelas e triggers de banco.
     - [`20261107000002_seed_platform_config_and_themes.sql`](../../supabase/migrations/20261107000002_seed_platform_config_and_themes.sql): Seed exclusivo de 5 configurações de plataforma, 3 grupos HBAC e 20 temas visuais.
     - [`20261107000003_smartpages_rpc_and_rls.sql`](../../supabase/migrations/20261107000003_smartpages_rpc_and_rls.sql): Funções RPC (`bootstrap_status`, `register_user`, `authenticate_user`, `change_user_password`, `admin_create_user`) com hash Blowfish (`pgcrypto` compatível com `bcrypt`) e políticas RLS.
2. **Dupla Garantia do Primeiro Cadastro como Global Admin**:
   - Na camada de banco de dados: triggers `trg_before_user_insert_global_admin` e `trg_after_user_insert_assign_group` promovem automaticamente o primeiro registro em `smartpages.opspages_users` para `is_superuser = TRUE` e o vinculam ao grupo `Platform Admins`, gravando o evento `BOOTSTRAP_GLOBAL_ADMIN` em `opspages_audit_logs`.
   - Na camada de aplicação: endpoints `GET /api/v1/auth/bootstrap-status` e `POST /api/v1/auth/register` ([`backend/app/api/v1/auth.py`](../../backend/app/api/v1/auth.py)) e aba dedicada na tela de login ([`frontend/src/features/auth/LoginPage.tsx`](../../frontend/src/features/auth/LoginPage.tsx)).
3. **Ponte Híbrida Frontend ↔ Supabase (`supabaseBridge.ts`) & Deploy no GitHub Pages**:
   - Implementar [`frontend/src/services/supabaseBridge.ts`](../../frontend/src/services/supabaseBridge.ts) integrado ao interceptor Axios ([`frontend/src/services/api.ts`](../../frontend/src/services/api.ts)) utilizando os headers `Accept-Profile: smartpages` e `Content-Profile: smartpages`.
   - Automatizar o deploy no GitHub Pages via [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) injetando os secrets do repositório (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_SUPABASE_SCHEMA`).
4. **Resolução Automática do Pooler IPv4 do Supabase no Backend**:
   - Como o host direto `db.<ref>.supabase.co` opera apenas em IPv6, [`backend/app/core/config.py`](../../backend/app/core/config.py) converte automaticamente conexões diretas para o Session Pooler IPv4 (`aws-1-us-west-2.pooler.supabase.com`, usuário `postgres.<ref>`) quando IPv6 não está disponível na máquina local ou runner CI.

## 3. Consequências
- **Positivas**: Isolamento total no Supabase dentro do schema `smartpages`; operação transparente tanto no GitHub Pages (serverless via PostgREST/RPC) quanto com o Backend FastAPI local/containerizado; gestão completa de usuários via CLI ([`backend/scripts/manage_users.py`](../../backend/scripts/manage_users.py)).
- **Trade-offs**: Manutenção sincronizada entre os modelos SQLAlchemy ([`meta_models.py`](../../backend/app/models/meta_models.py)) e as migrations SQL em [`supabase/migrations/`](../../supabase/migrations/), validada pelo script [`backend/scripts/setup_db.py`](../../backend/scripts/setup_db.py).
