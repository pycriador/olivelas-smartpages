---
title: "Visão Geral do Projeto — Olivelas SmartPages (Olivelas OpsPages)"
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

# Level 1 — Visão Geral do Projeto (`project-overview.md`)

## 1. Propósito e Problema Resolvido (`Confirmed`)

O **Olivelas SmartPages (`Olivelas OpsPages`)** resolve a necessidade corporativa de publicar, versionar, auditar e governar aplicações frontend estáticas (SPAs em React, Vite, Vue, Angular, portais editoriais e documentações técnicas) dentro do ecossistema **Olivelas**, operando integrado ao **Supabase** em um schema PostgreSQL isolado (`smartpages`) e publicado no **GitHub Pages** ([`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/)).

Diferente de servidores estáticos convencionais que sobrescrevem arquivos sem rastreabilidade, o **Olivelas SmartPages** armazena cada release de forma imutável (tanto em `/repos/{slug}` no Backend quanto em `smartpages.opspages_release_files` no Supabase), com tags semânticas, controle de aprovação manual/automática, trava de versão em produção (`Version Lock`), injeção dinâmica de configuração pública por ambiente (`env-config.js`) e auditoria forense completa.

---

## 2. Escopo Funcional (`Confirmed`)

1. **Isolamento Multi-Projeto no Supabase (`smartpages`) e Regra do 1º Cadastro Global Admin**:
   - Todas as 15 tabelas, triggers e funções RPC vivem exclusivamente no schema `smartpages` do Supabase.
   - O banco inicia com **0 usuários** e **0 projetos**, populado apenas com as configurações da plataforma (`opspages_platform_settings`), grupos HBAC (`opspages_groups`) e 20 temas visuais (`opspages_themes`).
   - O **primeiro usuário cadastrado** na plataforma torna-se automaticamente **Global Admin** (`is_superuser = true`).
2. **Operação Híbrida (GitHub Pages Serverless + FastAPI Control Plane)**:
   - Publicado em [`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/), o Frontend conecta-se diretamente ao schema `smartpages` no Supabase via `supabaseBridge.ts` quando o Backend FastAPI não está presente, ou utiliza o Backend FastAPI (`:8005`) quando em execução local/containerizada.
3. **Hospedagem Estática de Produção e Preview por Versão**:
   - Produção ativa em `/pages/{slug}/` (apontando para a versão ativa ou travada).
   - Preview isolado por versão em `/pages/{slug}/v/{version}/` com reescrita automática de caminhos de assets (`P-5`) e proteção por token antes da aprovação (`P-4`).
4. **Controle de Versionamento Git Nativo (`/repos/{slug}`)**:
   - Repositório Git local em `/repos/{slug}/git_repo` sincronizável com repositórios remotos GitHub (`git push` / `git pull`).
   - Comparação visual de diferenças (`git diff`) entre quaisquer duas tags de versão.
5. **Governança de Releases**:
   - **Auto-Approval (`auto_approval`)**: Publica imediatamente novas builds ou retém como `pending_approval` até revisão de um `Editor` ou `Admin`.
   - **Version Lock (`is_locked`)**: Congela a versão ativa em produção enquanto permite que o CI/CD continue subindo novas releases em modo `ready`.
   - **Rollback sem Tela em Branco (`P-1` & `P-3`)**: `Cache-Control: no-cache` para HTML e resolução fallback de assets hasheados (`/assets/*`) entre versões recentes.
6. **Injeção de Credenciais Públicas por Ambiente (`P-13`)**:
   - Configuração dinâmica por ambiente (`production`, `staging`, `development`, `preview`) integrando páginas estáticas ao **Olivelas OpsBase** via `window.__OPSPAGES_CONFIG__`, `window.__OPSBASE_CONFIG__`, `/pages/{slug}/env-config.js` e `/pages/{slug}/env-config.json`.
7. **Segurança Corporativa (`P-2`, `P-8`, `P-9`, `P-10`, `P-11`, `P-22`, `P-24`)**:
   - Controle de acesso hierárquico **HBAC** (`Global Admin`, `Admin`, `Editor`, `Visualizador`).
   - API Keys com prefixo tipado (`opsp_deploy_`, `opsp_service_`, `opsp_read_`) e hash SHA-256.
   - Validação exata de `Origin` no CORS com `Vary: Origin` e headers de segurança configuráveis por projeto (`CSP`, `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`).

---

## 3. Stack Tecnológica Verificada (`Confirmed`)

| Camada | Tecnologia / Biblioteca | Versão / Padrão | Evidência no Repositório |
| :--- | :--- | :--- | :--- |
| **Banco de Dados & BaaS** | Supabase PostgreSQL (Schema isolado `smartpages` + PostgREST RPC) | PostgreSQL 15+ | [`supabase/migrations/`](../../supabase/migrations/) |
| **Backend Framework** | Python + FastAPI + Uvicorn | Python 3.13 / FastAPI | [`backend/app/main.py`](../../backend/app/main.py) |
| **ORM & Drivers** | SQLAlchemy 2.0 (`postgresql+psycopg`, `sqlite`, `mysql+pymysql`) | 2.0+ | [`backend/app/db/session.py`](../../backend/app/db/session.py) |
| **Autenticação & Hash** | PyJWT (`HS256`), Bcrypt / `pgcrypto` Blowfish (`$2a$`/`$2b$`), SHA-256 | Padrão Olivelas | [`backend/app/core/security.py`](../../backend/app/core/security.py) |
| **Motor Git** | Git CLI Subprocess + Snapshots Imutáveis | Git 2.x | [`backend/app/services/git_storage_service.py`](../../backend/app/services/git_storage_service.py) |
| **Frontend UI** | React 18 + TypeScript + Vite 6 + Bridge Supabase | React 18 / TS 5 | [`frontend/package.json`](../../frontend/package.json) |
| **Design System** | Ant Design v5 + Tailwind CSS + 20 Temas (`Olivelas Obsidian` / `Olivelas Classic`) | Olivelas Copan | [`frontend/src/theme/themes.ts`](../../frontend/src/theme/themes.ts) |
| **CI/CD & Hosting** | GitHub Actions + GitHub Pages | `actions/deploy-pages@v4` | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) |

---

## 4. Glossário de Domínio (`Confirmed`)

- **Schema `smartpages`**: Namespace PostgreSQL exclusivo deste projeto no Supabase, isolado do schema `public`.
- **Global Admin (`is_superuser`)**: Administrador global da plataforma; atribuído automaticamente ao primeiro usuário cadastrado em `smartpages.opspages_users`.
- **Project (`opspages_projects`)**: Unidade lógica e repositório isolado em `/repos/{slug}` que agrupa builds, regras de CORS, configurações públicas, permissões HBAC e quotas.
- **Deployment / Release (`opspages_deployments`)**: Snapshot imutável de uma build estática associada a uma versão semântica (`1.0.0`, `1.1.0`), um commit SHA e uma tag Git.
- **Version Lock (`is_locked`)**: Trava administrativa que impede que novos uploads alterem a versão servida na URL principal `/pages/{slug}/`.
