---
title: "ADR-0002: Abstração Multi-Banco com SQLAlchemy 2.0 (SQLite, PostgreSQL e MariaDB)"
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

# ADR-0002: Abstração Multi-Banco com SQLAlchemy 2.0 (SQLite, PostgreSQL e MariaDB)

## 1. Contexto
O AIOps OpsPages precisa rodar localmente sem dependências externas (usando SQLite) durante desenvolvimento e avaliações rápidas, mas suportar bancos relacionais corporativos (**PostgreSQL** e **MariaDB/MySQL**) em ambientes de staging e produção sem alteração de código.

## 2. Decisão
Utilizar **SQLAlchemy 2.0 Declarative ORM** ([`meta_models.py`](../../backend/app/models/meta_models.py)) com resolução dinâmica de driver em [`Settings.get_database_url()`](../../backend/app/core/config.py):
- `sqlite` ➔ `sqlite:////.../backend/opspages_meta.db` (com `check_same_thread=False`).
- `postgresql` ➔ `postgresql+psycopg://...` (com `pool_pre_ping=True`).
- `mariadb` / `mysql` ➔ `mysql+pymysql://...?charset=utf8mb4` (com `pool_pre_ping=True`).

Além disso, criar o utilitário CLI [`backend/scripts/setup_db.py`](../../backend/scripts/setup_db.py) e migração incremental idempotente `_run_schema_migrations()` na inicialização.

## 3. Consequências
- **Positivas:** Portabilidade imediata entre SQLite, PostgreSQL e MariaDB; zero necessidade de reescrever queries.
- **Trade-offs:** Tipos específicos de banco são evitados em favor de tipos portáveis (`String`, `Text`, `Integer`, `Boolean`, `DateTime`) e serialização JSON controlada.
