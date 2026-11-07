---
title: "Índice Mestre da Documentação — Olivelas SmartPages (Olivelas OpsPages)"
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

# Índice Mestre da Documentação — Olivelas SmartPages (Olivelas OpsPages)

Esta pasta concentra a **Fonte Única da Verdade (Single Source of Truth)** técnica, arquitetural, operacional e de segurança do projeto **Olivelas SmartPages (Olivelas OpsPages)**, estruturada segundo a cadeia determinística AI-Ready (`Context -> Knowledge -> Relationships -> Evidence -> Constraints -> Actions`).

- **Repositório Oficial**: [`https://github.com/pycriador/olivelas-smartpages`](https://github.com/pycriador/olivelas-smartpages)
- **GitHub Pages (Live)**: [`https://pycriador.github.io/olivelas-smartpages/`](https://pycriador.github.io/olivelas-smartpages/)
- **Schema Isolado no Supabase**: `smartpages`

---

## ⛓️ Cadeia de Raciocínio AI-Ready

Agentes de IA e engenheiros devem navegar a documentação na ordem determinística abaixo:

```text
Context ➔ Knowledge ➔ Relationships ➔ Evidence ➔ Constraints ➔ Actions
```

1. **Context**: [`docs/ai-context.md`](ai-context.md) e [`docs/project-overview.md`](project-overview.md)
2. **Knowledge**: [`docs/application/`](application/) e [`docs/contracts/`](contracts/)
3. **Relationships**: [`docs/architecture/overview.md`](architecture/overview.md) e [`docs/architecture/system-context.md`](architecture/system-context.md)
4. **Evidence**: [`docs/knowledge-gaps.md`](knowledge-gaps.md) e [`docs/decisions/`](decisions/)
5. **Constraints**: [`docs/contracts/hbac-matrix.md`](contracts/hbac-matrix.md) e [`docs/security/`](security/)
6. **Actions**: [`docs/operations/runbook.md`](operations/runbook.md) e [`docs/operations/service-profile.md`](operations/service-profile.md)

---

## 🪜 Mapa de Navegação Progressiva (Níveis 0 a 6)

| Nível | Categoria | Documento | Propósito |
| :---: | :--- | :--- | :--- |
| **Level 0** | AI Entrypoint | [`docs/ai-context.md`](ai-context.md) | Ponto de entrada obrigatório para agentes de IA, invariantes e regras não-negociáveis |
| **Level 1** | Visão Geral | [`docs/project-overview.md`](project-overview.md) | Propósito do sistema, escopo, isolamento no Supabase (`smartpages`), glossário e stack |
| **Level 2** | Arquitetura | [`docs/architecture/overview.md`](architecture/overview.md) | Diagramas C4/Mermaid, arquitetura híbrida GitHub Pages + Supabase `smartpages` + FastAPI `/repos` |
| **Level 2** | Contexto Sistêmico | [`docs/architecture/system-context.md`](architecture/system-context.md) | Atores humanos, 1º cadastro Global Admin, CI/CD, Supabase, Olivelas OpsBase e GitHub |
| **Level 2** | Aplicação (Backend) | [`docs/application/backend-service.md`](application/backend-service.md) | Detalhamento do Backend FastAPI (`:8005`), serviços de domínio, Supabase Pooler e motor Git |
| **Level 2** | Aplicação (Frontend) | [`docs/application/frontend-console.md`](application/frontend-console.md) | Detalhamento do Console React (`:5176` e GitHub Pages), `supabaseBridge.ts` e 20 temas visuais |
| **Level 2** | Aplicação (Site Demo) | [`docs/application/portal-loft-site.md`](application/portal-loft-site.md) | Portal Olivelas (`sites/portal-loft`): portal de notícias em TypeScript (`v1.0.0` e `v1.1.0`) |
| **Level 3** | Contratos de API | [`docs/contracts/api-contracts.md`](contracts/api-contracts.md) | Endpoints REST `/api/v1/*`, RPCs `smartpages.*`, rotas estáticas `/pages/*` e códigos HTTP |
| **Level 3** | Modelo de Dados | [`docs/contracts/data-model.md`](contracts/data-model.md) | Modelo relacional no schema `smartpages` (15 tabelas `opspages_*`), triggers e migrations SQL |
| **Level 3** | Matriz HBAC | [`docs/contracts/hbac-matrix.md`](contracts/hbac-matrix.md) | Hierarquia de permissões (`Global Admin`, `Admin`, `Editor`, `Visualizador`) e tokens |
| **Level 4** | Perfil de Serviço | [`docs/operations/service-profile.md`](operations/service-profile.md) | Portas (`8005` / `5176`), variáveis `.env`, GitHub Secrets e conexão Supabase |
| **Level 4** | Runbook Operacional | [`docs/operations/runbook.md`](operations/runbook.md) | CLI de usuários (`manage_users.py`), migrations (`setup_db.py`), `./start.sh` e rollback |
| **Level 4** | Monitoramento & Auditoria | [`docs/operations/monitoring-audit.md`](operations/monitoring-audit.md) | Trilha de auditoria forense, Central de Erros (`/errors`), SLIs e SLOs |
| **Level 5** | Segurança (STRIDE) | [`docs/security/overview.md`](security/overview.md) | Modelagem de ameaças STRIDE, RLS no schema `smartpages`, anti-Zip-Slip, CORS e CSP |
| **Level 5** | Limites de Confiança | [`docs/security/trust-boundaries.md`](security/trust-boundaries.md) | Isolamento entre schema `smartpages`, builds públicas, previews protegidos, API e `/repos` |
| **Level 5** | Conformidade & Controles | [`docs/security/controls-and-compliance.md`](security/controls-and-compliance.md) | Mapeamento completo dos controles `P-1` a `P-24`, LGPD, Marco Civil e ISO 27037 |
| **Level 6** | Evidências & Lacunas | [`docs/knowledge-gaps.md`](knowledge-gaps.md) | Classificação de fatos (`Confirmed`, `Inferred`, `Proposed`) e roadmap técnico |
| **ADRs** | Decisões Arquiteturais | [`docs/decisions/0001-git-backed-static-releases-in-repos.md`](decisions/0001-git-backed-static-releases-in-repos.md) | ADR-0001: Versionamento Git e snapshots imutáveis em `/repos/{slug}` |
| **ADRs** | Decisões Arquiteturais | [`docs/decisions/0002-multi-database-sqlalchemy-abstraction.md`](decisions/0002-multi-database-sqlalchemy-abstraction.md) | ADR-0002: Abstração SQLAlchemy 2.0 para PostgreSQL (Supabase), SQLite e MariaDB |
| **ADRs** | Decisões Arquiteturais | [`docs/decisions/0003-runtime-public-config-and-security-headers.md`](decisions/0003-runtime-public-config-and-security-headers.md) | ADR-0003: Injeção dinâmica de `env-config.js`, Cache-Control diferenciado e CSP |
| **ADRs** | Decisões Arquiteturais | [`docs/decisions/0004-supabase-smartpages-schema-and-github-pages.md`](decisions/0004-supabase-smartpages-schema-and-github-pages.md) | ADR-0004: Schema isolado `smartpages` no Supabase, 1º Cadastro Global Admin e GitHub Pages |
