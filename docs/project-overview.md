---
title: "Visão Geral do Projeto — AIOps OpsPages"
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

# Level 1 — Visão Geral do Projeto (`project-overview.md`)

## 1. Propósito e Problema Resolvido (`Confirmed`)

O **AIOps OpsPages** resolve a necessidade corporativa de publicar, versionar, auditar e governar aplicações frontend estáticas (SPAs em React, Vite, Vue, Angular, portais editoriais e documentações técnicas) dentro do ecossistema **AIOps da Loft**, mantendo paridade visual e operacional com o **AIOps OpsBase**.

Diferente de servidores estáticos convencionais que sobrescrevem arquivos sem rastreabilidade, o **OpsPages** armazena cada projeto em um repositório Git dedicado dentro de `/repos/{slug}`, criando snapshots imutáveis (`releases/{version}`), tags Git semânticas, controle de aprovação manual/automática, trava de versão em produção (`Version Lock`), injeção dinâmica de configuração pública por ambiente (`env-config.js`) e auditoria forense completa.

---

## 2. Escopo Funcional (`Confirmed`)

1. **Hospedagem Estática de Produção e Preview por Versão**:
   - Produção ativa em `/pages/{slug}/` (apontando para a versão ativa ou travada).
   - Preview isolado por versão em `/pages/{slug}/v/{version}/` com reescrita automática de caminhos de assets (`P-5`) e proteção por token antes da aprovação (`P-4`).
2. **Controle de Versionamento Git Nativo (`/repos/{slug}`)**:
   - Repositório Git local em `/repos/{slug}/git_repo` sincronizável com repositórios remotos GitHub (`git push` / `git pull`).
   - Comparação visual de diferenças (`git diff`) entre quaisquer duas tags de versão.
3. **Governança de Releases**:
   - **Auto-Approval (`auto_approval`)**: Publica imediatamente novas builds ou retém como `pending_approval` até revisão de um `Editor` ou `Admin`.
   - **Version Lock (`is_locked`)**: Congela a versão ativa em produção enquanto permite que o CI/CD continue subindo novas releases em modo `ready`.
   - **Rollback sem Tela em Branco (`P-1` & `P-3`)**: `Cache-Control: no-cache` para HTML e resolução fallback de assets hasheados (`/assets/*`) entre versões recentes.
4. **Injeção de Credenciais Públicas por Ambiente (`P-13`)**:
   - Configuração dinâmica por ambiente (`production`, `staging`, `development`, `preview`) integrando páginas estáticas diretamente ao **AIOps OpsBase** via `window.__OPSPAGES_CONFIG__`, `window.__OPSBASE_CONFIG__`, `/pages/{slug}/env-config.js` e `/pages/{slug}/env-config.json`.
5. **Segurança Corporativa (`P-2`, `P-8`, `P-9`, `P-10`, `P-11`)**:
   - Controle de acesso hierárquico **HBAC** (`Super Admin`, `Admin`, `Editor`, `Visualizador`).
   - API Keys com prefixo tipado (`opsp_deploy_`, `opsp_admin_`, `opsp_read_`) e hash SHA-256.
   - Validação exata de `Origin` no CORS com `Vary: Origin` e headers de segurança configuráveis por projeto (`CSP`, `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`).
6. **Central de Reporte e Rastreamento de Erros (`/errors`)**:
   - Rota dedicada no frontend (`/errors`) e na API (`/api/v1/errors`) para registro, triagem, filtro e paginação de incidentes e erros de páginas ou de plataforma.

---

## 3. Não-Objetivos (`Confirmed`)

- **Não executa SSR (Server-Side Rendering) dinâmico Node.js por requisição**: O OpsPages hospeda builds estáticas pré-compiladas (HTML, CSS, JS, JSON, WebAssembly, imagens e fontes), injetando variáveis públicas via script de runtime (`env-config.js`).
- **Não substitui o backend transacional de negócio (AIOps OpsBase)**: Aplicações hospedadas no OpsPages consomem dados dinâmicos conectando-se diretamente ao **AIOps OpsBase** através das credenciais públicas injetadas (`P-13`).

---

## 4. Stack Tecnológica Verificada (`Confirmed`)

| Camada | Tecnologia / Biblioteca | Versão / Padrão | Evidência no Repositório |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Python + FastAPI + Uvicorn | Python 3.13 / FastAPI | [`backend/app/main.py`](../../backend/app/main.py) |
| **ORM & Banco de Dados** | SQLAlchemy 2.0 (`sqlite`, `postgresql+psycopg`, `mysql+pymysql`) | 2.0+ | [`backend/app/db/session.py`](../../backend/app/db/session.py) |
| **Autenticação & Hash** | PyJWT (`HS256`), PBKDF2/Bcrypt, SHA-256 API Keys | Padrão Loft | [`backend/app/core/security.py`](../../backend/app/core/security.py) |
| **Motor Git** | Git CLI Subprocess + Snapshots Imutáveis | Git 2.x | [`backend/app/services/git_storage.py`](../../backend/app/services/git_storage.py) |
| **Frontend UI** | React 18 + TypeScript + Vite 6 | React 18 / TS 5 | [`frontend/package.json`](../../frontend/package.json) |
| **Design System** | Ant Design v5 + Tailwind CSS + 20 Temas Copan | Loft Copan | [`frontend/src/theme/CopanThemeProvider.tsx`](../../frontend/src/theme/CopanThemeProvider.tsx) |
| **Estado & Internacionalização** | Zustand (`useAuthStore`, `useProjectStore`, `useI18nStore`) | `pt-BR`, `en`, `es` | [`frontend/src/stores/`](../../frontend/src/stores/) |

---

## 5. Glossário de Domínio (`Confirmed`)

- **Project (`opspages_projects`)**: Unidade lógica e repositório isolado em `/repos/{slug}` que agrupa builds, regras de CORS, configurações públicas, permissões HBAC e quotas.
- **Deployment / Release (`opspages_deployments`)**: Snapshot imutável de uma build estática associada a uma versão semântica (`1.0.0`, `1.1.0`), um commit SHA e uma tag Git.
- **Version Lock (`is_locked`)**: Trava administrativa que impede que novos uploads alterem a versão servida na URL principal `/pages/{slug}/`.
- **Public Runtime Config (`opspages_public_configs`)**: Conjunto de variáveis públicas e credenciais de escopo anônimo do OpsBase injetadas em runtime na página estática.
