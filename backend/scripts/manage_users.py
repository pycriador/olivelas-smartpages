#!/usr/bin/env python3
"""
CLI User & Role Management Utility for Olivelas SmartPages (Supabase `smartpages` schema).

Commands:
  python scripts/manage_users.py status
  python scripts/manage_users.py list
  python scripts/manage_users.py create --email admin@olivelas.com --name "Global Admin" --password "StrongPassword123!"
  python scripts/manage_users.py create --email dev@olivelas.com --name "Dev Editor" --password "StrongPassword123!" --role editor
  python scripts/manage_users.py set-role --email dev@olivelas.com --role admin
  python scripts/manage_users.py promote-admin --email dev@olivelas.com
  python scripts/manage_users.py revoke-admin --email dev@olivelas.com
  python scripts/manage_users.py reset-password --email admin@olivelas.com --password "NewPassword456!"
  python scripts/manage_users.py activate --email dev@olivelas.com
  python scripts/manage_users.py deactivate --email dev@olivelas.com
  python scripts/manage_users.py delete --email dev@olivelas.com
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, init_meta_db
from app.models.meta_models import Group, Project, User
from app.services.audit_service import AuditService


def _find_user(db, identifier: str) -> User | None:
    clean = identifier.strip().lower()
    return (
        db.query(User)
        .filter((User.email == clean) | (User.username == clean))
        .first()
    )


def cmd_status(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        admin_count = db.query(User).filter(User.is_superuser.is_(True)).count()
        project_count = db.query(Project).count()
        groups = db.query(Group).order_by(Group.id.asc()).all()

        print("=" * 80)
        print(f"  Olivelas SmartPages — Status de Usuários & IAM (Schema: {settings.DB_SCHEMA})")
        print("=" * 80)
        print(f"  Supabase URL             : {settings.VITE_SUPABASE_URL or 'Local DB'}")
        print(f"  Schema Isolado           : {settings.DB_SCHEMA}")
        print(f"  Total de Usuários        : {user_count}")
        print(f"  Global Admins Ativos     : {admin_count}")
        print(f"  Total de Projetos        : {project_count}")
        print(
            f"  Próximo Cadastro         : "
            f"{'SERÁ PROMOVIDO AUTOMATICAMENTE A GLOBAL ADMIN' if user_count == 0 else 'Usuário padrão (viewer/editor conforme role)'}"
        )
        print("-" * 80)
        print("  Grupos HBAC Disponíveis:")
        for g in groups:
            print(f"    - [{g.id}] {g.name:<20} (role_level={g.role_level:<8}) — {g.description}")
        print("=" * 80)
    finally:
        db.close()


def cmd_list(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id.asc()).all()
        if not users:
            print(
                f"[INFO] Nenhum usuário cadastrado no schema '{settings.DB_SCHEMA}'. "
                "O primeiro usuário cadastrado será automaticamente promovido a Global Admin!"
            )
            return

        print(f"{'ID':<5} | {'USERNAME':<20} | {'EMAIL':<32} | {'NOME COMPLETO':<24} | {'ATIVO':<6} | {'GLOBAL ADMIN':<12} | {'GRUPOS HBAC'}")
        print("-" * 130)
        for u in users:
            group_names = ", ".join(f"{g.name} ({g.role_level})" for g in u.groups) or "-"
            print(
                f"{u.id:<5} | {u.username:<20} | {u.email:<32} | {(u.full_name or '-'):<24} | "
                f"{str(u.is_active):<6} | {str(u.is_superuser):<12} | {group_names}"
            )
    finally:
        db.close()


def cmd_create(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        clean_email = args.email.strip().lower()
        clean_username = (args.username or clean_email.split("@")[0]).strip().lower()

        existing = _find_user(db, clean_email) or _find_user(db, clean_username)
        if existing:
            print(f"[ERRO] Já existe um usuário com e-mail/username '{clean_email}' / '{clean_username}'.")
            sys.exit(1)

        total_before = db.query(User).count()
        is_first_user = total_before == 0

        role = "admin" if is_first_user else (args.role or "viewer")
        is_superuser = True if (is_first_user or role == "admin" or args.superuser) else False

        group = db.query(Group).filter(Group.role_level == role).first()
        user = User(
            username=clean_username,
            email=clean_email,
            full_name=(args.name or clean_username).strip(),
            hashed_password=hash_password(args.password),
            is_active=True,
            is_superuser=is_superuser,
        )
        if group:
            user.groups.append(group)

        db.add(user)
        db.commit()
        db.refresh(user)

        AuditService.log(
            db=db,
            actor_id=user.id,
            actor_email="cli-admin",
            action="BOOTSTRAP_GLOBAL_ADMIN" if is_first_user else "CLI_CREATE_USER",
            resource_type="user",
            resource_id=str(user.id),
            diff={
                "email": user.email,
                "username": user.username,
                "role": role,
                "is_superuser": user.is_superuser,
                "first_user_global_admin": is_first_user,
            },
        )

        if is_first_user:
            print(
                f"[OK] Primeiro usuário da plataforma cadastrado! "
                f"'{user.email}' (ID={user.id}) foi configurado automaticamente como GLOBAL ADMIN."
            )
        else:
            print(
                f"[OK] Usuário '{user.email}' (ID={user.id}, username='{user.username}') "
                f"criado com role='{role}' (Global Admin={user.is_superuser})."
            )
    finally:
        db.close()


def cmd_set_role(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        user = _find_user(db, args.email)
        if not user:
            print(f"[ERRO] Usuário '{args.email}' não encontrado.")
            sys.exit(1)

        group = db.query(Group).filter(Group.role_level == args.role).first()
        if not group:
            print(f"[ERRO] Grupo HBAC para role '{args.role}' não encontrado.")
            sys.exit(1)

        user.groups = [group]
        user.is_superuser = args.role == "admin"
        db.commit()

        AuditService.log(
            db=db,
            actor_id=user.id,
            actor_email="cli-admin",
            action="CLI_SET_USER_ROLE",
            resource_type="user",
            resource_id=str(user.id),
            diff={"email": user.email, "role": args.role, "is_superuser": user.is_superuser},
        )
        print(f"[OK] Role de '{user.email}' atualizada para '{args.role}' (Global Admin={user.is_superuser}).")
    finally:
        db.close()


def cmd_promote_or_revoke(args: argparse.Namespace, promote: bool) -> None:
    db = SessionLocal()
    try:
        user = _find_user(db, args.email)
        if not user:
            print(f"[ERRO] Usuário '{args.email}' não encontrado.")
            sys.exit(1)

        user.is_superuser = promote
        target_role = "admin" if promote else "editor"
        group = db.query(Group).filter(Group.role_level == target_role).first()
        if group:
            user.groups = [group]
        db.commit()

        AuditService.log(
            db=db,
            actor_id=user.id,
            actor_email="cli-admin",
            action="CLI_PROMOTE_GLOBAL_ADMIN" if promote else "CLI_REVOKE_GLOBAL_ADMIN",
            resource_type="user",
            resource_id=str(user.id),
            diff={"email": user.email, "is_superuser": user.is_superuser},
        )
        status_str = "promovido a GLOBAL ADMIN" if promote else "removido de Global Admin (definido como editor)"
        print(f"[OK] Usuário '{user.email}' foi {status_str}.")
    finally:
        db.close()


def cmd_reset_password(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        user = _find_user(db, args.email)
        if not user:
            print(f"[ERRO] Usuário '{args.email}' não encontrado.")
            sys.exit(1)

        if len(args.password) < 6:
            print("[ERRO] A nova senha deve possuir no mínimo 6 caracteres.")
            sys.exit(1)

        user.hashed_password = hash_password(args.password)
        db.commit()

        AuditService.log(
            db=db,
            actor_id=user.id,
            actor_email="cli-admin",
            action="CLI_RESET_PASSWORD",
            resource_type="user",
            resource_id=str(user.id),
            diff={"email": user.email},
        )
        print(f"[OK] Senha de '{user.email}' redefinida com sucesso.")
    finally:
        db.close()


def cmd_toggle_active(args: argparse.Namespace, active: bool) -> None:
    db = SessionLocal()
    try:
        user = _find_user(db, args.email)
        if not user:
            print(f"[ERRO] Usuário '{args.email}' não encontrado.")
            sys.exit(1)

        user.is_active = active
        db.commit()
        print(f"[OK] Usuário '{user.email}' foi {'ativado' if active else 'desativado'}.")
    finally:
        db.close()


def cmd_delete(args: argparse.Namespace) -> None:
    db = SessionLocal()
    try:
        user = _find_user(db, args.email)
        if not user:
            print(f"[ERRO] Usuário '{args.email}' não encontrado.")
            sys.exit(1)

        email_copy = user.email
        user_id_copy = user.id
        db.delete(user)
        db.commit()

        AuditService.log(
            db=db,
            actor_id=None,
            actor_email="cli-admin",
            action="CLI_DELETE_USER",
            resource_type="user",
            resource_id=str(user_id_copy),
            diff={"email": email_copy},
        )
        print(f"[OK] Usuário '{email_copy}' (ID={user_id_copy}) removido com sucesso.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Olivelas SmartPages — Gerenciador CLI de Usuários no Supabase (Schema: smartpages)"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Exibe o status do schema smartpages e da política de Primeiro Usuário Global Admin")
    sub.add_parser("list", help="Lista todos os usuários cadastrados no Supabase (schema smartpages)")

    p_create = sub.add_parser("create", help="Cadastra um novo usuário (o 1º usuário vira Global Admin automaticamente)")
    p_create.add_argument("--email", required=True, help="E-mail do usuário")
    p_create.add_argument("--username", required=False, help="Username opcional (padrão: prefixo do e-mail)")
    p_create.add_argument("--name", required=True, help="Nome completo do usuário")
    p_create.add_argument("--password", required=True, help="Senha inicial (mínimo 6 caracteres)")
    p_create.add_argument("--role", choices=["admin", "editor", "viewer"], default="viewer", help="Role HBAC")
    p_create.add_argument("--superuser", action="store_true", help="Forçar privilégio de Global Admin")

    p_role = sub.add_parser("set-role", help="Altera a role HBAC de um usuário (admin, editor, viewer)")
    p_role.add_argument("--email", required=True, help="E-mail ou username do usuário")
    p_role.add_argument("--role", choices=["admin", "editor", "viewer"], required=True)

    p_prom = sub.add_parser("promote-admin", help="Promove um usuário existente a Global Admin")
    p_prom.add_argument("--email", required=True, help="E-mail ou username do usuário")

    p_rev = sub.add_parser("revoke-admin", help="Remove privilégio de Global Admin de um usuário")
    p_rev.add_argument("--email", required=True, help="E-mail ou username do usuário")

    p_pwd = sub.add_parser("reset-password", help="Redefine a senha de um usuário")
    p_pwd.add_argument("--email", required=True, help="E-mail ou username do usuário")
    p_pwd.add_argument("--password", required=True, help="Nova senha (mínimo 6 caracteres)")

    p_act = sub.add_parser("activate", help="Ativa a conta de um usuário")
    p_act.add_argument("--email", required=True, help="E-mail ou username do usuário")

    p_deact = sub.add_parser("deactivate", help="Desativa a conta de um usuário")
    p_deact.add_argument("--email", required=True, help="E-mail ou username do usuário")

    p_del = sub.add_parser("delete", help="Remove um usuário pelo e-mail ou username")
    p_del.add_argument("--email", required=True, help="E-mail ou username do usuário")

    args = parser.parse_args()
    if args.command == "status":
        cmd_status(args)
    elif args.command == "list":
        cmd_list(args)
    elif args.command == "create":
        cmd_create(args)
    elif args.command == "set-role":
        cmd_set_role(args)
    elif args.command == "promote-admin":
        cmd_promote_or_revoke(args, promote=True)
    elif args.command == "revoke-admin":
        cmd_promote_or_revoke(args, promote=False)
    elif args.command == "reset-password":
        cmd_reset_password(args)
    elif args.command == "activate":
        cmd_toggle_active(args, active=True)
    elif args.command == "deactivate":
        cmd_toggle_active(args, active=False)
    elif args.command == "delete":
        cmd_delete(args)


if __name__ == "__main__":
    main()
