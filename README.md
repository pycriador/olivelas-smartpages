# AIOps OpsPages — Enterprise Static Build Hosting & Git `/repos` Platform

> **Padrão de Documentação:** [`loft-br/aiops-documentation`](https://github.com/loft-br/aiops-documentation) (AI-Ready Documentation Standard v1.0)
> **Ponto de Entrada para Agentes de IA:** [`docs/ai-context.md`](docs/ai-context.md) | **Índice Mestre da Documentação:** [`docs/README.md`](docs/README.md)

**AIOps OpsPages** é a plataforma corporativa de hospedagem de builds estáticas (estilo GitHub Pages / Vercel / Cloudflare Pages) da Loft, construída no mesmo padrão arquitetural, visual (Design System Copan com 20 temas) e de governança do **AIOps OpsBase**.

Todas as builds estáticas são versionadas em repositórios Git isolados dentro de **`/repos/{project-slug}`**, contando com **Trava de Versão (`Version Lock`)**, **Aprovação Automática ou Manual**, **Rollback Instantâneo com Preservação de Assets**, **Injeção de Credenciais Públicas por Ambiente (`env-config.js`)**, **HBAC (Hierarchical Role-Based Access Control)**, **Tokens de Deploy CI/CD (`opsp_deploy_...`)**, **Central de Reporte de Erros (`/errors`)** e **Auditoria Forense Imutável**.

---

## 🌐 Portas, Serviços e URLs de Acesso

| Serviço / Componente | Tecnologia | Porta Padrão | URL Local | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend Console & Landing** | React 18 + TypeScript + Vite + Ant Design 5 | `5176` | `http://localhost:5176` | Console administrativo, Landing Page, Gestão de Projetos e Central de Erros |
| **Backend API (Control Plane)** | Python 3.13 + FastAPI + SQLAlchemy 2.0 | `8005` | `http://localhost:8005/api/v1` | API RESTful de projetos, builds, Git, HBAC, tokens, CORS, config pública e erros |
| **Static Pages Hosting (Live)** | FastAPI Static & SPA Router | `8005` | `http://localhost:8005/pages/{slug}/` | Servidor de builds estáticas em produção com cache diferenciado e CSP |
| **Static Pages Preview (Tag)** | FastAPI Versioned Preview Router | `8005` | `http://localhost:8005/pages/{slug}/v/{version}/` | Preview isolado por versão (protegido por token antes da aprovação) |
| **Runtime Public Config** | Dynamic JS/JSON Injector | `8005` | `http://localhost:8005/pages/{slug}/env-config.js` | Credenciais públicas por ambiente (`window.__OPSPAGES_CONFIG__` / `window.__OPSBASE_CONFIG__`) |
| **Swagger / OpenAPI 3.1** | FastAPI Swagger UI & ReDoc | `8005` | `http://localhost:8005/docs` | Documentação interativa completa da API (incluindo upload multipart e quick-build) |
| **Healthcheck** | FastAPI Probe | `8005` | `http://localhost:8005/health` | Sonda de disponibilidade e status do banco de metadados |

### Rotas Dedicadas do Frontend (`http://localhost:5176`)

Todas as páginas possuem rota própria na URL e sincronizam filtros e paginação (`?page=1&page_size=10&q=...&status=...`, exibindo no mínimo **10 elementos por página**):

| Rota URL | Módulo | Descrição |
| :--- | :--- | :--- |
| `/` | `LandingPage.tsx` | Landing Page institucional com telemetria real (`GET /api/v1/public/overview`) |
| `/login` | `LoginPage.tsx` | Autenticação corporativa JWT (sem credenciais hardcoded no código) |
| `/dashboard` | `ProjectDashboard.tsx` | Visão geral do projeto ativo, preview ao vivo, lock de versão e snippets CI/CD |
| `/deployments` | `DeploymentsManager.tsx` | Upload `.zip`/`.tar.gz`, Quick Web Builder (com suporte a binários Base64), aprovação e rollback |
| `/explorer` | `BuildFileExplorer.tsx` | Árvore de arquivos da release, visualizador de código, tabela paginada e downloads `.zip` |
| `/git` | `GitVersionControl.tsx` | Histórico de commits/tags Git em `/repos/{slug}/git_repo`, comparador `git diff` e `git push/pull` |
| `/tokens` | `TokensManager.tsx` | Gestão de API Keys (`opsp_deploy_`, `opsp_admin_`, `opsp_read_`) com hash SHA-256 |
| `/iam` | `IamManager.tsx` | Gestão de usuários, grupos e permissões HBAC (`Admin`, `Editor`, `Visualizador`) |
| `/quotas` | `QuotasManager.tsx` | Limites de tamanho de build, armazenamento total, deploys/dia e retenção de versões |
| `/cors` | `CorsManager.tsx` | Regras de CORS por projeto com validação exata de origem e `Vary: Origin` |
| `/public-config` | `PublicConfigManager.tsx` | Credenciais públicas por ambiente (integração Opsbase), `Cache-Control` e Security Headers (CSP) |
| `/audit` | `AuditViewer.tsx` | Trilha de auditoria forense imutável com inspeção de payload JSON |
| `/errors` | `ErrorsManager.tsx` | **Rota para informar e gerenciar erros** (acessível pública e autenticada) |
| `/settings` | `SettingsPage.tsx` | Configurações do projeto, seletor de 20 temas Copan, idioma (`PT-BR`/`EN`/`ES`) e diagnóstico de DB |

---

## 🚀 Como Executar o Projeto

### 1. Inicialização Rápida (`./start.sh`)

```bash
# 1. Configure o arquivo .env a partir do exemplo
cp .env.example .env

# 2. Inicie o Backend (:8005) e o Frontend (:5176)
./start.sh start
```

Comandos disponíveis no script [`./start.sh`](start.sh):

```bash
./start.sh start     # Inicializa o banco, garante o Super Admin padrão e inicia Backend (:8005) + Frontend (:5176)
./start.sh status    # Exibe status dos processos (ONLINE/OFFLINE) e URLs de acesso
./start.sh stop      # Encerra os processos de Backend e Frontend com segurança
./start.sh restart   # Reinicia ambos os serviços
./start.sh logs      # Acompanha os logs em tempo real (logs/backend.log e logs/frontend.log)
```

---

## 💻 Scripts CLI de Backend (`backend/scripts/`)

Todos os scripts administrativos ficam em [`backend/scripts/`](backend/scripts/) e operam diretamente sobre o banco configurado no `.env` (**SQLite**, **PostgreSQL** ou **MariaDB**).

### 1. Provisionar e Diagnosticar Banco de Dados (`setup_db.py`)

```bash
cd backend

# Inicializar e validar o banco padrão configurado no .env (SQLite)
python3 scripts/setup_db.py

# Testar e inicializar em PostgreSQL
python3 scripts/setup_db.py \
  --engine postgresql \
  --url "postgresql+psycopg://postgres:<SENHA>@localhost:5432/aiops_opspages"

# Testar e inicializar em MariaDB / MySQL
python3 scripts/setup_db.py \
  --engine mariadb \
  --url "mysql+pymysql://root:<SENHA>@localhost:3306/aiops_opspages?charset=utf8mb4"
```

### 2. Criar ou Atualizar Super Admin (`create_admin.py`)

O usuário padrão **`willian.jesus@loft.com.br`** é cadastrado automaticamente como Super Admin a partir das variáveis do `.env`. Para garantir ou recriar via CLI:

```bash
cd backend

# Garantir o Super Admin padrão (willian.jesus@loft.com.br) usando a senha do .env
python3 scripts/create_admin.py --default

# Criar ou promover um Super Admin informando parâmetros
python3 scripts/create_admin.py \
  --username willian.jesus \
  --email willian.jesus@loft.com.br \
  --full-name "Willian Jesus" \
  --password "<SENHA_FORTE>"
```

### 3. Criar Usuários e Alterar Permissões HBAC (`manage_users.py`)

Gerencia os 3 níveis de permissão (`admin`, `editor`, `viewer`/`visualizador`) globalmente ou por projeto:

```bash
cd backend

# 1. Listar todos os usuários, grupos e permissões por projeto
python3 scripts/manage_users.py list

# 2. Criar usuário com papel Editor (ou Admin / Visualizador)
python3 scripts/manage_users.py create \
  --email dev.frontend@loft.com.br \
  --username dev.frontend \
  --name "Dev Frontend Loft" \
  --password "<SENHA_INICIAL>" \
  --role editor \
  --project portal-loft

# 3. Alterar permissão global de um usuário (admin | editor | viewer)
python3 scripts/manage_users.py set-role \
  --email dev.frontend@loft.com.br \
  --role admin

# 4. Alterar permissão de um usuário apenas em um projeto específico
python3 scripts/manage_users.py set-role \
  --email dev.frontend@loft.com.br \
  --role visualizador \
  --project portal-loft

# 5. Promover ou revogar privilégio de Super Admin
python3 scripts/manage_users.py set-superadmin --email willian.jesus@loft.com.br --enable
```

### 4. Alterar Senha de Usuário (`change_password.py`)

```bash
cd backend

# Modo direto via parâmetros
python3 scripts/change_password.py \
  --user willian.jesus@loft.com.br \
  --password "<NOVA_SENHA_FORTE>"

# Modo interativo (solicita senha oculta via prompt)
python3 scripts/change_password.py
```

---

## 📦 Exemplos Práticos de Uso da API

### Exemplo 1: Publicar Build Estática via Upload `.zip` (CI/CD ou cURL)

```bash
# Empacote sua build estática (HTML, CSS, JS, imagens)
cd sites/portal-loft && npm run build
cd dist && zip -r ../portal-loft-build.zip . && cd ..

# Envie para o OpsPages usando o header X-API-Key (ou Authorization: Bearer)
curl -X POST "http://localhost:8005/api/v1/projects/1/deployments/upload" \
  -H "X-API-Key: opsp_deploy_<SEU_TOKEN_DO_PROJETO>" \
  -F "version=1.2.0" \
  -F "release_notes=Release com novo seletor de idiomas PT/EN/ES" \
  -F "file=@portal-loft-build.zip"
```

### Exemplo 2: Quick Build via JSON com Arquivos de Texto e Binários (Base64)

```bash
curl -X POST "http://localhost:8005/api/v1/projects/1/deployments/quick-build" \
  -H "Authorization: Bearer <SEU_JWT_OU_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.1",
    "release_notes": "Hotfix com ícone binário em Base64",
    "files": {
      "index.html": "<!doctype html><html><head><title>Portal</title></head><body><img src=\"logo.png\"/></body></html>"
    },
    "binary_files": {
      "logo.png": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    }
  }'
```

### Exemplo 3: Vincular, Sincronizar e Consumir Credenciais Públicas do OpsBase (`P-13` & Parte 2)

```bash
# 1. Vincular/Sincronizar o projeto com o endpoint de descoberta do OpsBase (sem chave digitada manualmente)
curl -X POST "http://localhost:8005/api/v1/projects/1/opsbase/sync" \
  -H "Authorization: Bearer <SEU_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "opsbase_project_slug": "portal_loft",
    "sync_cors": true
  }'

# 2. Customizar variáveis públicas ou URL por ambiente (ex.: production)
curl -X PUT "http://localhost:8005/api/v1/projects/1/public-config/production" \
  -H "Authorization: Bearer <SEU_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "opsbase_url": "http://localhost:8001/api/v1",
    "public_vars": {
      "FEATURE_REALTIME_NEWS": true,
      "DEFAULT_LOCALE": "pt-BR"
    },
    "inject_in_html": true,
    "is_active": true
  }'

# 3. A página estática publicada recebe em runtime (Cache-Control: no-cache, no-store, must-revalidate):
# <script src="/pages/portal-loft/env-config.js?env=production"></script>
# window.__OPSPAGES_CONFIG__.opsbase_url      -> "http://localhost:8001/api/v1"
# window.__OPSPAGES_CONFIG__.opsbase_anon_key -> "opsbase_anon_..." (descoberta do OpsBase)
```

### Exemplo 4: Informar um Erro pela API (`POST /api/v1/errors/report`)

```bash
curl -X POST "http://localhost:8005/api/v1/errors/report" \
  -H "Content-Type: application/json" \
  -d '{
    "project_slug": "portal-loft",
    "page_url": "http://localhost:8005/pages/portal-loft/",
    "route_path": "/pages/portal-loft/",
    "error_code": "ASSET_404",
    "severity": "warning",
    "scope": "static-page",
    "title": "Imagem de capa demorou para carregar em rede 3G",
    "description": "Observado durante teste de performance mobile.",
    "reporter_email": "qa@loft.com.br"
  }'
```

---

## 📰 Projeto Estático Real Incluso: Portal Loft (`sites/portal-loft`)

O repositório inclui o código-fonte completo em **TypeScript** da primeira página estática real publicada no OpsPages: **Portal Loft** ([`sites/portal-loft/`](sites/portal-loft/)), um portal editorial de notícias de IA, Cloud, Semicondutores e Engenharia de Software com:

- Seletor de idiomas em tempo real (**Português `pt-BR`**, **English `en`** e **Español `es`**) com persistência em URL (`?lang=`) e `localStorage`.
- Versões `1.0.0` e `1.1.0` publicadas e versionadas no Git em `/repos/portal-loft`.
- Download direto na interface e via API:
  - **Baixar HTML Estático (`.zip`)**: `GET /api/v1/public/projects/portal-loft/download-build?version=1.1.0`
  - **Baixar Código-Fonte TypeScript (`.zip`)**: `GET /api/v1/public/projects/portal-loft/download-source?version=1.1.0`

---

## 📚 Documentação Técnica AI-Ready (`docs/`)

Toda a documentação segue o framework corporativo [`loft-br/aiops-documentation`](https://github.com/loft-br/aiops-documentation) com navegação progressiva de contexto (Níveis 0 a 6):

| Nível | Documento | Escopo |
| :---: | :--- | :--- |
| **Índice** | [`docs/README.md`](docs/README.md) | Mapa mestre de navegação e cadeia `Context -> Knowledge -> Relationships -> Evidence -> Constraints -> Actions` |
| **Level 0** | [`docs/ai-context.md`](docs/ai-context.md) | Ponto de entrada obrigatório para agentes de IA e limites operacionais |
| **Level 1** | [`docs/project-overview.md`](docs/project-overview.md) | Propósito, escopo, não-objetivos, glossário e stack real verificada |
| **Level 2** | [`docs/architecture/overview.md`](docs/architecture/overview.md) | Diagramas C4/Mermaid, fluxo de deploy Git `/repos` e roteamento estático |
| **Level 2** | [`docs/architecture/system-context.md`](docs/architecture/system-context.md) | Atores humanos, pipelines CI/CD, integração com OpsBase e GitHub |
| **Level 2** | [`docs/application/backend-service.md`](docs/application/backend-service.md) | Arquitetura interna do Backend FastAPI, serviços e motor Git |
| **Level 2** | [`docs/application/frontend-console.md`](docs/application/frontend-console.md) | Arquitetura do Console React, rotas por URL, paginação e Design System Copan |
| **Level 2** | [`docs/application/portal-loft-site.md`](docs/application/portal-loft-site.md) | Arquitetura da build estática TypeScript `sites/portal-loft` (v1.0.0 e v1.1.0) |
| **Level 3** | [`docs/contracts/api-contracts.md`](docs/contracts/api-contracts.md) | Contratos completos de todos os endpoints REST (`/api/v1/*` e `/pages/*`) |
| **Level 3** | [`docs/contracts/data-model.md`](docs/contracts/data-model.md) | Modelo relacional SQLAlchemy 2.0 (10 tabelas `opspages_*`) |
| **Level 3** | [`docs/contracts/hbac-matrix.md`](docs/contracts/hbac-matrix.md) | Matriz de permissões HBAC (`Super Admin`, `Admin`, `Editor`, `Visualizador`) |
| **Level 4** | [`docs/operations/service-profile.md`](docs/operations/service-profile.md) | Portas, variáveis de ambiente, quotas e requisitos de runtime |
| **Level 4** | [`docs/operations/runbook.md`](docs/operations/runbook.md) | Procedimentos operacionais, rollback, lock de versão e recuperação de falhas |
| **Level 4** | [`docs/operations/monitoring-audit.md`](docs/operations/monitoring-audit.md) | Auditoria forense, Central de Erros (`/errors`), SLIs/SLOs e healthchecks |
| **Level 5** | [`docs/security/overview.md`](docs/security/overview.md) | Modelagem de ameaças STRIDE, proteção Zip-Slip, CORS estrito e CSP |
| **Level 5** | [`docs/security/trust-boundaries.md`](docs/security/trust-boundaries.md) | Fronteiras de confiança entre páginas públicas, previews, API e `/repos` |
| **Level 5** | [`docs/security/controls-and-compliance.md`](docs/security/controls-and-compliance.md) | Controles `P-1` a `P-13`, LGPD, Marco Civil da Internet e ISO/IEC 27037 |
| **Level 6** | [`docs/knowledge-gaps.md`](docs/knowledge-gaps.md) | Registro de evidências (`Confirmed`), dívidas técnicas e evoluções (`Proposed`) |
| **ADRs** | [`docs/decisions/`](docs/decisions/) | Decisões arquiteturais numeradas (`ADR-0001`, `ADR-0002`, `ADR-0003`) |

---

## 🧪 Testes Automatizados

```bash
cd backend
python3 -m pytest -v tests/test_opspages.py
```
