---
title: "ADR-0002: Abstração Multi-Banco com SQLAlchemy 2.0 (PostgreSQL Supabase, SQLite e MariaDB)"
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

# ADR-0002: Abstração Multi-Banco com SQLAlchemy 2.0 (PostgreSQL Supabase, SQLite e MariaDB)

## 1. Contexto
O **Olivelas SmartPages (`Olivelas OpsPages`)** opera em produção conectado ao **Supabase PostgreSQL** no schema isolado `smartpages`, mas também precisa rodar testes automatizados isolados em SQLite sem depender de rede externa e suportar MariaDB/MySQL quando necessário.

## 2. Decisão
Utilizar **SQLAlchemy 2.0 Declarative ORM** ([`meta_models.py`](../../backend/app/models/meta_models.py)) com resolução dinâmica de driver em [`Settings.get_database_url()`](../../backend/app/core/config.py):
- `postgresql` ➔ `postgresql+psycopg://...` com suporte automático ao Session Pooler IPv4 do Supabase (`aws-1-us-west-2.pooler.supabase.com`) e `search_path=smartpages,public,extensions`.
- `sqlite` ➔ `sqlite:///...` (usado em suítes de testes automatizados offline com `check_same_thread=False`).
- `mariadb` / `mysql` ➔ `mysql+pymysql://...?charset=utf8mb4` (com `pool_pre_ping=True`).

Além disso, disponibilizar o utilitário CLI [`backend/scripts/setup_db.py`](../../backend/scripts/setup_db.py) que aplica as migrations de [`supabase/migrations/`](../../supabase/migrations/) diretamente no schema `smartpages`.

## 3. Consequências
- **Positivas:** Operação nativa no Supabase (`smartpages`) em produção e execução rápida/offline da suíte `pytest` em SQLite.
- **Trade-offs:** Tipos específicos de banco são evitados no ORM em favor de tipos portáveis (`String`, `Text`, `Integer`, `Boolean`, `DateTime`) e serialização JSON controlada.
