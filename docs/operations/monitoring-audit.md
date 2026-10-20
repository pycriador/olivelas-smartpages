---
title: "Monitoramento, Auditoria e Telemetria de Erros — AIOps OpsPages"
status: "ACCEPTED"
owner: "AIOps Platform Team (Loft)"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.0.0"
---

> **Language:** pt-BR
> **Status:** ACCEPTED
> **Documentation Standard v1.0 (Loft AIOps)**

# Monitoramento, Auditoria e Telemetria de Erros (Nível 4)

## 1. Visão Geral

O **AIOps OpsPages** mantém três pilares de observabilidade e governança forense:

1. **Healthcheck e Overview Operacional** (`/health` e `/api/v1/public/overview`).
2. **Trilha de Auditoria Imutável (`audit_logs`)**: registro de todas as ações administrativas, de publicação, aprovação, rollback, IAM e HBAC.
3. **Telemetria Centralizada de Erros (`/api/v1/errors/report` e `/errors`)**: captura de exceções de runtime, falhas de build, bloqueios CORS/CSP e erros reportados pelas páginas hospedadas ou pelo console administrativo.

---

## 2. Healthcheck & Overview

| Endpoint | Autenticação | Uso Recomendado |
| :--- | :--- | :--- |
| `GET /health` | Pública | Probe de *liveness/readiness* para Kubernetes, ALB ou scripts de monitoramento (`./start.sh status`). |
| `GET /api/v1/public/overview` | Pública (Sanitizada — `P-11`) | Catálogo público de projetos e contadores agregados sem exposição de e-mails ou caminhos de disco. |
| `GET /api/v1/audit/stats` | `Bearer <JWT>` | Métricas detalhadas de auditoria por ação, severidade e ator. |

---

## 3. Trilha de Auditoria Forense (`audit_logs`)

Toda mutação relevante no sistema grava um registro na tabela `audit_logs` ([`backend/app/models/entities.py`](file:///Users/willian.jesus/Downloads/aiops-opspages/backend/app/models/entities.py)):

### 3.1 Eventos Auditados

| Categoria | Ações (`action`) | Severidade Típica |
| :--- | :--- | :--- |
| **Autenticação & IAM** | `auth.login`, `auth.login_failed`, `user.create`, `user.update`, `group.create`, `group.member_add` | `info` / `warning` |
| **HBAC & Tokens** | `hbac.create`, `hbac.delete`, `token.create`, `token.revoke` | `info` / `warning` |
| **Projetos & Segurança** | `project.create`, `project.update`, `project.delete`, `cors.create`, `cors.update`, `public_config.upsert` | `info` / `warning` |
| **Builds & Git** | `build.upload`, `build.quick_build`, `build.approve`, `build.publish`, `build.rollback`, `project.lock`, `project.unlock` | `info` / `critical` (em rollback/lock) |
| **Erros Reportados** | `error.report` | `warning` / `error` / `critical` |

### 3.2 Consulta com Filtro e Paginação via URL

No console administrativo (`/audit`), os operadores filtram eventos sincronizando os parâmetros na URL:

- `?q=<termo>` — filtra por ação, ator, recurso ou IP.
- `?filter=<severidade>` — filtra por `info`, `warning`, `error` ou `critical`.
- `?page=1&pageSize=10` — paginação determinística (mínimo de 10 itens por página).

Via API:

```bash
curl -s http://localhost:8005/api/v1/audit \
  -H "Authorization: Bearer <JWT_TOKEN>" | jq .
```

---

## 4. Central de Erros e Diagnóstico (`/errors` e `/api/v1/errors/report`)

Todas as 14 rotas do console administrativo possuem atalho direto para `/errors`, permitindo reportar e investigar incidentes com rastreabilidade completa da rota de origem (`?from=/rota-origem`).

### 4.1 Contrato de Reporte (`POST /api/v1/errors/report`)

```bash
curl -X POST http://localhost:8005/api/v1/errors/report \
  -H "Content-Type: application/json" \
  -d '{
    "project_slug": "portal-loft",
    "version": "1.1.0",
    "route": "/pages/portal-loft/index.html",
    "error_code": "CSP_VIOLATION",
    "severity": "error",
    "message": "Bloqueio de script externo não listado na diretiva script-src",
    "details": {
      "blocked_uri": "https://cdn.example.com/tracker.js",
      "violated_directive": "script-src"
    }
  }'
```

### 4.2 Consulta de Erros Reportados (`GET /api/v1/errors`)

```bash
curl -s "http://localhost:8005/api/v1/errors?project_slug=portal-loft&severity=error" \
  -H "Authorization: Bearer <JWT_TOKEN>" | jq .
```

---

## 5. Logs Operacionais de Processo

Quando iniciado via `./start.sh start --bg`, os logs de execução dos processos ficam em:

- `logs/backend.log`: logs de acesso HTTP do Uvicorn, stack traces e inicialização do SQLAlchemy.
- `logs/frontend.log`: logs do servidor Vite/React.
