---
title: "Detalhamento do Console Frontend React & GitHub Pages — Olivelas SmartPages"
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

# Level 2 — Frontend Console (`application/frontend-console.md`)

## 1. Visão Geral (`Confirmed`)

O console web do **Olivelas SmartPages (`Olivelas OpsPages`)** é uma SPA em **React 18 + TypeScript + Vite 6 + Ant Design v5 + Tailwind CSS**, publicada no **GitHub Pages** ([`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/)) e servida localmente na porta `5176` (`http://localhost:5176`). Possui suporte a **20 temas visuais** (10 claros + 10 escuros, com padrão `Olivelas Obsidian` / `Olivelas Classic`) e internacionalização em **3 idiomas** (`pt-BR`, `en`, `es`).

---

## 2. Operação Híbrida com Supabase (`supabaseBridge.ts`) & GitHub Pages (`Confirmed`)

Implementada em [`frontend/src/services/supabaseBridge.ts`](../../frontend/src/services/supabaseBridge.ts) e [`frontend/src/services/api.ts`](../../frontend/src/services/api.ts):

1. **Comunicação Direta com o Schema `smartpages` no Supabase**:
   - Quando executada no GitHub Pages (`*.github.io`) ou quando o Backend FastAPI local não está ativo, o interceptor Axios redireciona todas as chamadas `/api/v1/*` diretamente para a API REST/RPC do Supabase (`VITE_SUPABASE_URL`) com os cabeçalhos `Accept-Profile: smartpages` e `Content-Profile: smartpages`.
   - Permite cadastro do 1º usuário (Global Admin), login, gestão de usuários e grupos HBAC (`/iam`), criação de projetos, publicação de builds via Quick Web Builder ou arquivo `.zip`, exploração de arquivos da release (`opspages_release_files`), gerenciamento de tokens, quotas, regras de CORS, configurações públicas, erros e auditoria forense diretamente no Supabase.
2. **Suporte a Deep Links SPA no GitHub Pages**:
   - [`frontend/public/404.html`](../../frontend/public/404.html) e [`frontend/index.html`](../../frontend/index.html) preservam o roteamento SPA sob o base path `/olivelas-smartpages/`.

---

## 3. Tela de Autenticação e 1º Cadastro Global Admin (`Confirmed`)

Implementada em [`frontend/src/features/auth/LoginPage.tsx`](../../frontend/src/features/auth/LoginPage.tsx):
- Ao abrir `/login`, consulta `/api/v1/auth/bootstrap-status` (ou RPC `smartpages.bootstrap_status`).
- Enquanto `user_count === 0` (`next_user_will_be_global_admin === true`), destaca automaticamente a aba **★ 1º Cadastro (Global Admin)** com banner informativo explicando que a primeira conta criada receberá privilégios totais de **Global Admin** no schema `smartpages`.

---

## 4. Roteamento por URL e Paginação Sincronizada (`Confirmed`)

Gerenciado por [`frontend/src/utils/urlState.ts`](../../frontend/src/utils/urlState.ts) e [`frontend/src/stores/useProjectStore.ts`](../../frontend/src/stores/useProjectStore.ts):

- `/`: Landing Page pública ([`LandingPage.tsx`](../../frontend/src/features/landing/LandingPage.tsx))
- `/login`: Autenticação e Cadastro Inicial Global Admin ([`LoginPage.tsx`](../../frontend/src/features/auth/LoginPage.tsx))
- `/dashboard`: Visão geral do projeto ([`ProjectDashboard.tsx`](../../frontend/src/features/projects/ProjectDashboard.tsx))
- `/deployments`: Gestão de builds e releases ([`DeploymentsManager.tsx`](../../frontend/src/features/deployments/DeploymentsManager.tsx))
- `/explorer`: Explorador de arquivos da build ([`BuildFileExplorer.tsx`](../../frontend/src/features/explorer/BuildFileExplorer.tsx))
- `/git`: Controle Git e comparador de diff ([`GitVersionControl.tsx`](../../frontend/src/features/git/GitVersionControl.tsx))
- `/tokens`: Chaves de API e deploy CI/CD ([`TokensManager.tsx`](../../frontend/src/features/tokens/TokensManager.tsx))
- `/iam`: Usuários, grupos e HBAC ([`IamManager.tsx`](../../frontend/src/features/iam/IamManager.tsx))
- `/quotas`: Quotas de armazenamento e builds ([`QuotasManager.tsx`](../../frontend/src/features/quotas/QuotasManager.tsx))
- `/cors`: Regras de CORS por projeto ([`CorsManager.tsx`](../../frontend/src/features/cors/CorsManager.tsx))
- `/public-config`: Configuração pública OpsBase, Cache-Control e Security Headers ([`PublicConfigManager.tsx`](../../frontend/src/features/config/PublicConfigManager.tsx))
- `/audit`: Auditoria forense ([`AuditViewer.tsx`](../../frontend/src/features/audit/AuditViewer.tsx))
- `/errors`: Central para informar e gerenciar erros ([`ErrorsManager.tsx`](../../frontend/src/features/errors/ErrorsManager.tsx))
- `/settings`: Configurações do projeto, temas e diagnóstico de DB ([`SettingsPage.tsx`](../../frontend/src/features/settings/SettingsPage.tsx))
