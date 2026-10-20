#!/usr/bin/env python3
"""
AIOps OpsPages - Multi-Database Provisioning & Verification Script (SQLite, PostgreSQL, MariaDB).

Exemplos de uso:
  1. Inicializar e validar banco atual configurado no .env (SQLite por padrão):
     python scripts/setup_db.py

  2. Configurar e inicializar PostgreSQL:
     python scripts/setup_db.py --engine postgresql --url "postgresql+psycopg://user:pass@localhost:5432/aiops_opspages"

  3. Configurar e inicializar MariaDB / MySQL:
     python scripts/setup_db.py --engine mariadb --url "mysql+pymysql://root:pass@localhost:3306/aiops_opspages?charset=utf8mb4"
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Provisionar e verificar o banco de dados do AIOps OpsPages (SQLite, PostgreSQL ou MariaDB)."
    )
    parser.add_argument(
        "--engine",
        choices=["sqlite", "postgresql", "mariadb"],
        help="Motor de banco de dados desejado",
    )
    parser.add_argument(
        "--url",
        type=str,
        help="Connection URL SQLAlchemy completa (ex: postgresql+psycopg://... ou mysql+pymysql://...)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.engine:
        os.environ["OPSPAGES_DB_ENGINE"] = args.engine
    if args.url:
        os.environ["OPSPAGES_META_DB_URL"] = args.url

    from app.core.config import settings
    from app.db.session import SessionLocal, get_db_engine_info, init_meta_db
    from app.models.meta_models import Group, Project, User

    print("=" * 72)
    print("  AIOps OpsPages — Inicialização & Diagnóstico Multi-Banco de Dados")
    print("=" * 72)
    print(f"🔗 Connection URL Ativa : {settings.get_database_url()}")
    print(f"📁 Diretório /repos     : {settings.repos_root_path}")

    init_meta_db()
    info = get_db_engine_info()

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        group_count = db.query(Group).count()
        project_count = db.query(Project).count()
        super_admin = db.query(User).filter(User.email == settings.DEFAULT_SUPERADMIN_EMAIL).first()

        print(f"🗄️  Dialeto Detectado    : {info['dialect']} ({info['driver']})")
        print(f"✅ Conectado com Sucesso: {info['connected']}")
        print(f"👥 Grupos HBAC          : {group_count} (Admin, Editor, Viewer)")
        print(f"👤 Usuários Cadastrados : {user_count}")
        print(f"📦 Projetos em /repos   : {project_count}")
        if super_admin:
            print(f"⭐ Super Admin Padrão   : {super_admin.email} (is_superuser={super_admin.is_superuser})")
        print("=" * 72)
    finally:
        db.close()


if __name__ == "__main__":
    main()
