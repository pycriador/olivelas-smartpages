#!/usr/bin/env python3
"""
CLI Database Setup & Supabase Migration Runner for Olivelas SmartPages (`smartpages` schema).

Applies the SQL migrations in `supabase/migrations/*.sql` against the configured
Supabase PostgreSQL database (or initializes SQLAlchemy tables if using SQLite),
and seeds ONLY:
  - Platform configurations (`opspages_platform_settings`)
  - HBAC Role Groups (`Platform Admins`, `Frontend Editors`, `Project Viewers`)
  - 20 Visual Themes (`opspages_themes`)

Note: Zero users and zero projects are seeded by default so that the very first
registration on the platform becomes the Global Admin (`is_superuser = true`).

Usage:
  python scripts/setup_db.py
  python scripts/setup_db.py --status
  python scripts/setup_db.py --reset-users-and-projects
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.core.config import ROOT_DIR, settings
from app.db.session import SessionLocal, engine, get_db_engine_info, init_meta_db
from app.models.meta_models import Group, PlatformSetting, PlatformTheme, Project, User


def apply_supabase_migrations() -> None:
    """Applies all SQL files in supabase/migrations/ when connected to PostgreSQL."""
    if engine.dialect.name != "postgresql":
        print(f"[INFO] Engine is '{engine.dialect.name}' (not PostgreSQL); skipping raw SQL migration files.")
        return

    migrations_dir = ROOT_DIR / "supabase" / "migrations"
    if not migrations_dir.exists():
        print(f"[WARN] Migrations directory not found: {migrations_dir}")
        return

    sql_files = sorted(migrations_dir.glob("*.sql"))
    raw_conn = engine.raw_connection()
    try:
        raw_conn.autocommit = True
        cur = raw_conn.cursor()
        for sql_file in sql_files:
            print(f"  -> Applying migration: {sql_file.name} ...")
            sql_content = sql_file.read_text(encoding="utf-8")
            cur.execute(sql_content)
        cur.close()
    finally:
        raw_conn.close()


def reset_users_and_projects() -> None:
    """Clears all users and projects in `smartpages` while preserving platform settings, themes, and groups."""
    schema_prefix = f"{settings.DB_SCHEMA}." if engine.dialect.name == "postgresql" else ""
    with engine.begin() as conn:
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_release_files"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_deployments"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_project_permissions"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_api_tokens"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_project_quotas"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_cors_rules"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_public_configs"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_error_reports"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_projects"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_user_groups"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_users"))
        conn.execute(text(f"DELETE FROM {schema_prefix}opspages_audit_logs"))
    print("[OK] Users, projects, and logs cleared. Next registered user will be Global Admin.")


def print_status() -> None:
    info = get_db_engine_info()
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        project_count = db.query(Project).count()
        group_count = db.query(Group).count()
        setting_count = db.query(PlatformSetting).count()
        theme_count = db.query(PlatformTheme).count()

        print("=" * 72)
        print("  Olivelas SmartPages — Database & Schema Status")
        print("=" * 72)
        print(f"  Dialect / Driver : {info['dialect']} ({info['driver']})")
        print(f"  Isolated Schema  : {info['schema']}")
        print(f"  Supabase URL     : {info['supabase_url'] or 'N/A'}")
        print(f"  Connected        : {info['connected']}")
        print("-" * 72)
        print(f"  Platform Settings: {setting_count} configured")
        print(f"  Visual Themes    : {theme_count} themes (Light & Dark)")
        print(f"  HBAC Role Groups : {group_count} groups (admin, editor, viewer)")
        print(f"  Registered Users : {user_count} {'(Next registration = GLOBAL ADMIN)' if user_count == 0 else ''}")
        print(f"  Hosted Projects  : {project_count}")
        print("=" * 72)
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Olivelas SmartPages Database & Supabase Schema Setup")
    parser.add_argument("--status", action="store_true", help="Show current schema and table counts")
    parser.add_argument(
        "--reset-users-and-projects",
        action="store_true",
        help="Clear all users and projects so the next registered user becomes Global Admin",
    )
    args = parser.parse_args()

    if args.status:
        print_status()
        return

    print(f"[INFO] Connecting to database ({engine.dialect.name}, schema='{settings.DB_SCHEMA}')...")
    apply_supabase_migrations()
    init_meta_db()

    if args.reset_users_and_projects:
        reset_users_and_projects()

    print_status()


if __name__ == "__main__":
    main()
