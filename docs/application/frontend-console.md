---
title: "Detalhamento do Console Frontend React — AIOps OpsPages"
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

# Level 2 — Frontend Console (`application/frontend-console.md`)

## 1. Visão Geral (`Confirmed`)

O console web do **AIOps OpsPages** é uma SPA em **React 18 + TypeScript + Vite + Ant Design v5 + Tailwind CSS**, servida na porta `5176` (`http://localhost:5176`). Segue o mesmo padrão visual e estrutural do **AIOps OpsBase**, com suporte a **20 temas Copan** (10 claros + 10 escuros, padrão `loft-classic`) e internacionalização em **3 idiomas** (`pt-BR`, `en`, `es`).

---

## 2. Roteamento por URL e Paginação Sincronizada (`Confirmed`)

Gerenciado por [`frontend/src/utils/urlState.ts`](../../frontend/src/utils/urlState.ts) e [`frontend/src/stores/useProjectStore.ts`](../../frontend/src/stores/useProjectStore.ts):

1. **Rota Própria para Cada Página (`SECTION_TO_PATH`)**:
   - `/`: Landing Page pública ([`LandingPage.tsx`](../../frontend/src/features/landing/LandingPage.tsx))
   - `/login`: Tela de autenticação ([`LoginPage.tsx`](../../frontend/src/features/auth/LoginPage.tsx))
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

2. **Filtro e Paginação por URL (`useUrlTableState`)**:
   - Sincroniza `?page=1&page_size=10&q=...&status=...` com `window.history.replaceState` e `popstate`.
   - Garante que todas as tabelas com múltiplos itens exibam no mínimo **10 elementos por página** (`Math.max(10, pageSize)`, opções `['10', '20', '50', '100']`).
