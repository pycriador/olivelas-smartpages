#!/usr/bin/env python3
"""
AIOps OpsPages - Script Administrativo: Gestão de Usuários e Permissões HBAC (Admin, Editor, Visualizador).

Subcomandos disponíveis:
  1. Listar todos os usuários, grupos e permissões por projeto:
     python scripts/manage_users.py list

  2. Criar um novo usuário já com papel global (admin, editor, viewer) e/ou em um projeto específico:
     python scripts/manage_users.py create --email dev@loft.com.br --username dev --name "Dev Loft" --password "Senha123" --role editor [--project loft-design-portal]

  3. Mudar a permissão (Admin, Editor, Visualizador) de um usuário existente globalmente ou em um projeto específico:
     python scripts/manage_users.py set-role --email dev@loft.com.br --role admin
     python scripts/manage_users.py set-role --email dev@loft.com.br --role viewer --project loft-design-portal

  4. Promover ou revogar Super Admin:
     python scripts/manage_users.py set-superadmin --email willian.jesus@loft.com.br --enable
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import hash_password
from app.db.session import SessionLocal, init_meta_db
from app.models.meta_models import Group, Project, ProjectPermission, User
from app.services.audit_service import AuditService
from app.services.hbac_service import HBACService

ROLE_ALIASES = {
    "admin": "admin",
    "administrador": "admin",
    "editor": "editor",
    "developer": "editor",
    "viewer": "viewer",
    "visualizador": "viewer",
}

ROLE_TO_GROUP_NAME = {
    "admin": "Platform Admins",
    "editor": "Frontend Editors",
    "viewer": "Project Viewers",
}


def normalize_cli_role(raw_role: str) -> str:
    clean = (raw_role or "").strip().lower()
    if clean not in ROLE_ALIASES:
        print(f"❌ Papel inválido: '{raw_role}'. Use: admin, editor ou viewer (visualizador).")
        sys.exit(1)
    return ROLE_ALIASES[clean]


def cmd_list() -> None:
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id.asc()).all()
        projects = {p.id: p.slug for p in db.query(Project).all()}
        print("=" * 95)
        print(f"{'ID':<4} {'USERNAME':<18} {'EMAIL':<30} {'SUPERADMIN':<11} {'GRUPOS (PAPEL GLOBAL)':<28}")
        print("-" * 95)
        for u in users:
            grp_str = ", ".join(f"{g.name} ({g.role_level})" for g in u.groups) or "-"
            sa_str = "SIM (★)" if u.is_superuser else "NÃO"
            print(f"{u.id:<4} {u.username:<18} {u.email:<30} {sa_str:<11} {grp_str}")
            if u.permissions:
                for perm in u.permissions:
                    p_slug = projects.get(perm.project_id, f"id:{perm.project_id}")
                    print(f"     └─ Permissão no Projeto [{p_slug}]: {perm.role.upper()}")
        print("=" * 95)
    finally:
        db.close()


def cmd_create(args: argparse.Namespace) -> None:
    import os
    role = normalize_cli_role(args.role)
    email = args.email.strip().lower()
    username = (args.username or email.split("@")[0]).strip().lower()
    full_name = (args.name or username).strip()
    password = args.password or os.environ.get("OPSPAGES_USER_PASSWORD", "")

    if len(password) < 6:
        print("❌ Erro: Informe --password (mínimo 6 caracteres) ou defina OPSPAGES_USER_PASSWORD no ambiente.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            print(f"❌ Erro: Já existe um usuário com email '{email}' ou username '{username}'.")
            sys.exit(1)

        target_group_name = ROLE_TO_GROUP_NAME[role]
        group = db.query(Group).filter(Group.name == target_group_name).first()

        user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            is_active=True,
            is_superuser=(role == "admin" and args.superadmin),
        )
        if group:
            user.groups = [group]

        db.add(user)
        db.flush()

        if args.project:
            proj = db.query(Project).filter(Project.slug == args.project.strip().lower()).first()
            if not proj:
                print(f"❌ Erro: Projeto '{args.project}' não encontrado.")
                sys.exit(1)
            db.add(ProjectPermission(project_id=proj.id, user_id=user.id, role=role))

        db.commit()
        AuditService.log(
            db=db,
            actor_email="cli-script",
            action="CLI_CREATE_USER",
            resource_type="user",
            resource_id=str(user.id),
            diff={"email": user.email, "role": role, "project": args.project},
        )
        print(f"✅ Usuário '{user.email}' (username: {user.username}) criado com sucesso com permissão '{role.upper()}'!")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar usuário: {e}")
        sys.exit(1)
    finally:
        db.close()


def cmd_set_role(args: argparse.Namespace) -> None:
    role = normalize_cli_role(args.role)
    identifier = args.email.strip().lower()

    db = SessionLocal()
    try:
        user = db.query(User).filter((User.email == identifier) | (User.username == identifier)).first()
        if not user:
            print(f"❌ Erro: Usuário '{identifier}' não encontrado.")
            sys.exit(1)

        if args.project:
            proj_slug = args.project.strip().lower()
            proj = db.query(Project).filter(Project.slug == proj_slug).first()
            if not proj:
                print(f"❌ Erro: Projeto '{proj_slug}' não encontrado.")
                sys.exit(1)

            perm = (
                db.query(ProjectPermission)
                .filter(ProjectPermission.project_id == proj.id, ProjectPermission.user_id == user.id)
                .first()
            )
            old_role = perm.role if perm else None
            if perm:
                perm.role = role
            else:
                perm = ProjectPermission(project_id=proj.id, user_id=user.id, role=role)
                db.add(perm)

            db.commit()
            AuditService.log(
                db=db,
                actor_email="cli-script",
                action="CLI_SET_PROJECT_ROLE",
                resource_type="permission",
                resource_id=str(user.id),
                project_id=proj.id,
                diff={"user": user.email, "project": proj.slug, "old_role": old_role, "new_role": role},
            )
            print(f"✅ Permissão de '{user.email}' no projeto '{proj.slug}' alterada para: {role.upper()}")
        else:
            target_group_name = ROLE_TO_GROUP_NAME[role]
            group = db.query(Group).filter(Group.name == target_group_name).first()
            if not group:
                group = db.query(Group).filter(Group.role_level == role).first()

            old_groups = [g.name for g in user.groups]
            if group:
                user.groups = [group]

            if args.superadmin is not None:
                user.is_superuser = bool(args.superadmin)

            db.commit()
            AuditService.log(
                db=db,
                actor_email="cli-script",
                action="CLI_SET_GLOBAL_ROLE",
                resource_type="user",
                resource_id=str(user.id),
                diff={"user": user.email, "old_groups": old_groups, "new_role": role},
            )
            print(f"✅ Permissão global de '{user.email}' alterada para: {role.upper()} (Grupo: {group.name if group else role})")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao alterar permissão: {e}")
        sys.exit(1)
    finally:
        db.close()


def cmd_set_superadmin(args: argparse.Namespace) -> None:
    identifier = args.email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter((User.email == identifier) | (User.username == identifier)).first()
        if not user:
            print(f"❌ Erro: Usuário '{identifier}' não encontrado.")
            sys.exit(1)

        user.is_superuser = not args.disable
        if user.is_superuser:
            admin_group = db.query(Group).filter(Group.role_level == "admin").first()
            if admin_group and all(g.id != admin_group.id for g in user.groups):
                user.groups.append(admin_group)

        db.commit()
        status_label = "ATIVADO" if user.is_superuser else "REVOGADO"
        print(f"✅ Status de Super Admin para '{user.email}': {status_label}")
    finally:
        db.close()


def main():
    init_meta_db()
    parser = argparse.ArgumentParser(
        description="AIOps OpsPages — Script CLI para criar usuários e alterar permissões (Admin, Editor, Visualizador)."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # list
    subparsers.add_parser("list", help="Lista todos os usuários e suas permissões (Admin, Editor, Visualizador)")

    # create
    p_create = subparsers.add_parser("create", help="Cria um novo usuário com papel Admin, Editor ou Visualizador")
    p_create.add_argument("--email", "-e", required=True, help="E-mail do usuário")
    p_create.add_argument("--username", "-u", help="Username (se omitido, usa prefixo do e-mail)")
    p_create.add_argument("--name", "-n", help="Nome completo")
    p_create.add_argument("--password", "-p", help="Senha inicial (ou via OPSPAGES_USER_PASSWORD no .env)")
    p_create.add_argument(
        "--role",
        "-r",
        default="editor",
        help="Permissão: admin | editor | viewer (ou visualizador)",
    )
    p_create.add_argument("--project", help="Slug opcional do projeto para vincular permissão direta")
    p_create.add_argument("--superadmin", action="store_true", help="Define como Super Admin global")

    # set-role
    p_role = subparsers.add_parser("set-role", help="Altera a permissão de um usuário (Admin, Editor, Visualizador)")
    p_role.add_argument("--email", "-e", required=True, help="E-mail ou username do usuário")
    p_role.add_argument(
        "--role",
        "-r",
        required=True,
        help="Nova permissão: admin | editor | viewer (ou visualizador)",
    )
    p_role.add_argument("--project", help="Slug opcional do projeto (se omitido, altera o grupo/papel global)")
    p_role.add_argument("--superadmin", type=bool, default=None, help="Define flag is_superuser")

    # set-superadmin
    p_sa = subparsers.add_parser("set-superadmin", help="Ativa ou desativa Super Admin em um usuário")
    p_sa.add_argument("--email", "-e", required=True, help="E-mail ou username do usuário")
    p_sa.add_argument("--enable", action="store_true", help="Promove a Super Admin")
    p_sa.add_argument("--disable", action="store_true", help="Remove privilégio de Super Admin")

    args = parser.parse_args()
    if args.command == "list":
        cmd_list()
    elif args.command == "create":
        cmd_create(args)
    elif args.command == "set-role":
        cmd_set_role(args)
    elif args.command == "set-superadmin":
        cmd_set_superadmin(args)


if __name__ == "__main__":
    main()
