---
title: "Monitoramento, Auditoria e Telemetria de Erros — Olivelas SmartPages"
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

# Monitoramento, Auditoria e Telemetria de Erros (Nível 4)

## 1. Visão Geral

O **Olivelas SmartPages (`Olivelas OpsPages`)** mantém três pilares de observabilidade e governança forense no schema `smartpages` do Supabase:

1. **Healthcheck e Overview Operacional** (`/health`, `/api/v1/auth/bootstrap-status` e `/api/v1/public/overview`).
2. **Trilha de Auditoria Imutável (`smartpages.opspages_audit_logs`)**: registro de todas as ações administrativas, de bootstrap do Global Admin, publicação, aprovação, rollback, IAM e HBAC.
3. **Telemetria Centralizada de Erros (`/api/v1/errors/report` e `/errors`)**: captura de exceções de runtime, falhas de build, bloqueios CORS/CSP e erros reportados pelas páginas hospedadas ou pelo console administrativo (`smartpages.opspages_error_reports`).

---

## 2. Healthcheck & Overview

| Endpoint | Autenticação | Uso Recomendado |
| :--- | :--- | :--- |
| `GET /health` | Pública | Probe de *liveness/readiness* informando status, dialeto (`postgresql`) e schema (`smartpages`). |
| `GET /api/v1/auth/bootstrap-status` | Pública | Verifica o estado do schema `smartpages`, número de usuários e se o próximo cadastro será o Global Admin. |
| `GET /api/v1/public/overview` | Pública (Sanitizada — `P-11`) | Catálogo público de projetos e contadores agregados sem exposição de e-mails ou caminhos de disco. |
| `GET /api/v1/audit/logs` | `Bearer <JWT>` | Consulta paginada da trilha de auditoria forense. |

---

## 3. Trilha de Auditoria Forense (`smartpages.opspages_audit_logs`)

Toda mutação relevante no sistema grava um registro na tabela `smartpages.opspages_audit_logs` ([`backend/app/models/meta_models.py`](../../backend/app/models/meta_models.py)):

### 3.1 Eventos Auditados

| Categoria | Ações (`action`) | Descrição |
| :--- | :--- | :--- |
| **Bootstrap & IAM** | `BOOTSTRAP_GLOBAL_ADMIN`, `USER_REGISTER`, `USER_LOGIN`, `CREATE_USER`, `UPDATE_USER`, `CHANGE_PASSWORD`, `CREATE_GROUP` | Promoção automática do 1º usuário para Global Admin, logins e gestão de contas/grupos |
| **HBAC & Tokens** | `GRANT_PROJECT_PERMISSION`, `UPDATE_PROJECT_PERMISSION`, `REVOKE_PROJECT_PERMISSION`, `CREATE_API_TOKEN`, `REVOKE_API_TOKEN` | Concessão e revogação de acessos e chaves CI/CD |
| **Projetos & Segurança** | `CREATE_PROJECT`, `UPDATE_PROJECT`, `DELETE_PROJECT`, `CREATE_CORS_RULE`, `UPSERT_PUBLIC_CONFIG` | Criação de projetos, políticas CORS/CSP e configurações públicas por ambiente |
| **Builds & Git** | `DEPLOY_BUILD`, `APPROVE_DEPLOYMENT`, `ROLLBACK_DEPLOYMENT`, `LOCK_PROJECT_VERSION`, `UNLOCK_PROJECT_VERSION` | Publicações, aprovações, rollbacks e travamento de versão em produção |

---

## 4. Central de Erros e Diagnóstico (`/errors` e `/api/v1/errors/report`)

Todas as rotas do console administrativo possuem atalho direto para `/errors`, permitindo reportar e investigar incidentes com rastreabilidade completa da rota de origem (`?from=/rota-origem`).

```bash
curl -X POST http://localhost:8005/api/v1/errors/report \
  -H "Content-Type: application/json" \
  -d '{
    "project_slug": "olivelas-checkout",
    "version": "1.1.0",
    "page_url": "/pages/olivelas-checkout/index.html",
    "error_type": "CSP_VIOLATION",
    "severity": "error",
    "title": "Bloqueio de script externo não listado na diretiva script-src",
    "message": "Refused to load the script because it violates Content Security Policy."
  }'
```
