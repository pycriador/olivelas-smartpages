# Olivelas SmartPages — Static Hosting, Git Versioning & Governance Control Plane

Plataforma corporativa da **Olivelas** para hospedagem de builds estáticas, controle de versões Git (`/repos`), políticas de segurança (CORS/CSP), gerenciamento de quotas e governança HBAC multi-tenant integrada ao **Supabase** em um schema PostgreSQL isolado (`smartpages`) e publicada no **GitHub Pages**.

- **Repositório Oficial**: [https://github.com/pycriador/olivelas-smartpages](https://github.com/pycriador/olivelas-smartpages)
- **GitHub Pages (Live)**: [https://pycriador.github.io/olivelas-smartpages/](https://pycriador.github.io/olivelas-smartpages/)
- **Schema Isolado no Supabase**: `smartpages`
- **Documentação Técnica Completa (`docs/`)**: [Índice Mestre da Documentação](docs/README.md)

---

## 1. Arquitetura & Isolamento no Supabase (`smartpages`)

Toda a persistência de dados deste projeto opera estritamente dentro do schema **`smartpages`** no PostgreSQL do Supabase, completamente isolado do schema `public` e de outros projetos que compartilham a mesma instância:

| Tabela (`smartpages.*`) | Finalidade | Estado Inicial (Seed) |
| :--- | :--- | :--- |
| `opspages_platform_settings` | Configurações globais da plataforma (`Olivelas Engineering`), identidade, políticas de autenticação e quotas padrão | **5 configurações padrão** |
| `opspages_themes` | Catálogo oficial de temas visuais (10 Light + 10 Dark, incluindo `Olivelas Obsidian` e `Olivelas Classic`) | **20 temas oficiais** |
| `opspages_groups` | Grupos de controle de acesso HBAC (`Platform Admins`, `Frontend Editors`, `Project Viewers`) | **3 grupos HBAC** |
| `opspages_users` | Contas de usuários da plataforma | **0 registros** (1º cadastro = Global Admin) |
| `opspages_user_groups` | Vínculo N:N entre usuários e grupos HBAC | **0 registros** |
| `opspages_projects` | Projetos de hospedagem estática | **0 registros** |
| `opspages_deployments` | Releases imutáveis publicadas ou aguardando aprovação | **0 registros** |
| `opspages_release_files` | Artefatos das releases para inspeção e preview | **0 registros** |
| `opspages_project_permissions` | Permissões granulares por projeto (Admin, Editor, Viewer) | **0 registros** |
| `opspages_api_tokens` | Chaves de API com escopo (`opsp_deploy_...`, `opsp_service_...`) | **0 registros** |
| `opspages_project_quotas` | Limites de tamanho de build, armazenamento e deploys diários | **0 registros** |
| `opspages_cors_rules` | Regras dinâmicas de CORS e headers de segurança por projeto | **0 registros** |
| `opspages_public_configs` | Variáveis públicas de runtime por ambiente (`production`, `staging`, `development`, `preview`) | **0 registros** |
| `opspages_error_reports` | Telemetria de erros client-side e diagnósticos | **0 registros** |
| `opspages_audit_logs` | Trilha de auditoria imutável de governança | **0 registros** |

---

## 2. Regra do Primeiro Cadastro = Global Admin

A plataforma inicia sem usuários pré-cadastrados (`0` registros em `smartpages.opspages_users`):
1. **O primeiro usuário cadastrado na plataforma** (seja pela interface Web na aba **★ 1º Cadastro (Global Admin)**, pela API `POST /api/v1/auth/register`, pela RPC `smartpages.register_user` ou via CLI `manage_users.py`) é **promovido automaticamente a Global Admin** (`is_superuser = true` e membro do grupo `Platform Admins`).
2. Essa regra é garantida tanto na camada de aplicação (FastAPI + RPC) quanto diretamente no banco de dados PostgreSQL por meio das triggers `trg_before_user_insert_global_admin` e `trg_after_user_insert_assign_group`.

---

## 3. Migrations do Supabase (`supabase/migrations/`)

Todas as migrations SQL do projeto estão versionadas em [`supabase/migrations/`](supabase/migrations/):

- [`20261107000001_init_smartpages_schema.sql`](supabase/migrations/20261107000001_init_smartpages_schema.sql): Cria o schema isolado `smartpages`, configura permissões do PostgREST, cria as 15 tabelas estruturais e instala as triggers de promoção automática do primeiro usuário para Global Admin.
- [`20261107000002_seed_platform_config_and_themes.sql`](supabase/migrations/20261107000002_seed_platform_config_and_themes.sql): Popula exclusivamente as configurações da plataforma (`opspages_platform_settings`), os 3 grupos HBAC (`opspages_groups`) e os 20 temas visuais (`opspages_themes`).
- [`20261107000003_smartpages_rpc_and_rls.sql`](supabase/migrations/20261107000003_smartpages_rpc_and_rls.sql): Cria as funções RPC (`bootstrap_status`, `register_user`, `authenticate_user`, `change_user_password`, `admin_create_user`) compatíveis com `pgcrypto`/`bcrypt` e políticas RLS para operação direta via GitHub Pages e Backend.

Para aplicar ou verificar as migrations no Supabase via CLI:

```bash
python3 backend/scripts/setup_db.py
python3 backend/scripts/setup_db.py --status
```

---

## 4. Gerenciamento de Usuários no Supabase via CLI

O script [`backend/scripts/manage_users.py`](backend/scripts/manage_users.py) (acompanhado do guia executável [`backend/scripts/examples_supabase_cli.sh`](backend/scripts/examples_supabase_cli.sh)) permite gerenciar usuários e permissões diretamente no schema `smartpages` do Supabase:

```bash
# 1. Verificar o status do schema smartpages e da política de 1º cadastro Global Admin
python3 backend/scripts/manage_users.py status

# 2. Listar usuários cadastrados
python3 backend/scripts/manage_users.py list

# 3. Cadastrar o primeiro usuário (promovido automaticamente a Global Admin)
python3 backend/scripts/manage_users.py create \
  --email "admin@olivelas.com" \
  --name "Global Admin" \
  --password "SuaSenhaForte123!"

# 4. Cadastrar um usuário Editor ou Viewer
python3 backend/scripts/manage_users.py create \
  --email "editor@olivelas.com" \
  --name "Dev Editor" \
  --password "SenhaEditor123!" \
  --role editor

# 5. Alterar a role HBAC de um usuário (admin | editor | viewer)
python3 backend/scripts/manage_users.py set-role --email "editor@olivelas.com" --role admin

# 6. Promover ou revogar Global Admin
python3 backend/scripts/manage_users.py promote-admin --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py revoke-admin  --email "editor@olivelas.com"

# 7. Redefinir a senha de um usuário
python3 backend/scripts/manage_users.py reset-password \
  --email "admin@olivelas.com" \
  --password "NovaSenhaSegura2026!"

# 8. Ativar, desativar ou excluir um usuário
python3 backend/scripts/manage_users.py deactivate --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py activate   --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py delete     --email "editor@olivelas.com"
```

---

## 5. Variáveis de Ambiente & GitHub Secrets

As credenciais do Supabase utilizadas pelo Frontend e pelo Backend são configuradas no `.env` (local) e nos **GitHub Actions Secrets** do repositório:

| Variável / Secret | Descrição |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL da API Supabase (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_KEY` | Chave pública/anon do Supabase (`sb_publishable_...`) |
| `VITE_SUPABASE_SCHEMA` | Schema isolado do projeto (`smartpages`) |
| `db_host` / `DB_HOST` | Host PostgreSQL do Supabase (`db.<project-ref>.supabase.co`) |
| `db_port` / `DB_PORT` | Porta PostgreSQL (`5432`) |
| `db` / `DB` | Nome do banco de dados (`postgres`) |
| `db_username` / `DB_USERNAME` | Usuário do banco (`postgres`) |
| `db_password` / `DB_PASSWORD` | Senha do banco PostgreSQL no Supabase |
| `DB_SCHEMA` | Schema isolado (`smartpages`) |

---

## 6. Mapa da Documentação Técnica (`docs/`)

- **Índice Mestre**: [`docs/README.md`](docs/README.md)
- **Level 0 — AI Entrypoint**: [`docs/ai-context.md`](docs/ai-context.md)
- **Level 1 — Visão Geral do Projeto**: [`docs/project-overview.md`](docs/project-overview.md)
- **Level 2 — Arquitetura e Aplicações**:
  - [`docs/architecture/overview.md`](docs/architecture/overview.md)
  - [`docs/architecture/system-context.md`](docs/architecture/system-context.md)
  - [`docs/application/backend-service.md`](docs/application/backend-service.md)
  - [`docs/application/frontend-console.md`](docs/application/frontend-console.md)
  - [`docs/application/portal-loft-site.md`](docs/application/portal-loft-site.md)
- **Level 3 — Contratos de API, Modelo de Dados e HBAC**:
  - [`docs/contracts/api-contracts.md`](docs/contracts/api-contracts.md)
  - [`docs/contracts/data-model.md`](docs/contracts/data-model.md)
  - [`docs/contracts/hbac-matrix.md`](docs/contracts/hbac-matrix.md)
- **Level 4 — Operações, Runbook e Monitoramento**:
  - [`docs/operations/service-profile.md`](docs/operations/service-profile.md)
  - [`docs/operations/runbook.md`](docs/operations/runbook.md)
  - [`docs/operations/monitoring-audit.md`](docs/operations/monitoring-audit.md)
- **Level 5 — Segurança, Limites de Confiança e Conformidade**:
  - [`docs/security/overview.md`](docs/security/overview.md)
  - [`docs/security/trust-boundaries.md`](docs/security/trust-boundaries.md)
  - [`docs/security/controls-and-compliance.md`](docs/security/controls-and-compliance.md)
- **Level 6 — Evidências & Lacunas e ADRs**:
  - [`docs/knowledge-gaps.md`](docs/knowledge-gaps.md)
  - [`docs/decisions/0001-git-backed-static-releases-in-repos.md`](docs/decisions/0001-git-backed-static-releases-in-repos.md)
  - [`docs/decisions/0002-multi-database-sqlalchemy-abstraction.md`](docs/decisions/0002-multi-database-sqlalchemy-abstraction.md)
  - [`docs/decisions/0003-runtime-public-config-and-security-headers.md`](docs/decisions/0003-runtime-public-config-and-security-headers.md)
  - [`docs/decisions/0004-supabase-smartpages-schema-and-github-pages.md`](docs/decisions/0004-supabase-smartpages-schema-and-github-pages.md)

---

## 7. Execução Local (Backend + Frontend)

```bash
# Iniciar Backend FastAPI (porta 8005) e Frontend Vite (porta 5176)
./start.sh

# Executar suíte de testes automatizados do Backend
python3 -m pytest backend/tests/test_opspages.py backend/tests/test_r6_rls_enforced_passthrough.py backend/tests/test_p22_opsbase_auth_backoff.py

# Build de produção do Frontend
npm --prefix frontend run build
```
