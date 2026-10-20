#!/usr/bin/env python3
"""
AIOps OpsPages - Script Administrativo: Criação de Superadministrador.

Por padrão, o sistema já cadastra automaticamente `willian.jesus@loft.com.br` como Super Admin.
Este script permite:
  1. Garantir/redefinir o Super Admin padrão:
     python scripts/create_admin.py --default
  2. Criar ou promover qualquer usuário a Super Admin via CLI ou modo interativo:
     python scripts/create_admin.py --username willian.jesus --email willian.jesus@loft.com.br --full-name "Willian Jesus" --password "<senha>"
"""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, init_meta_db
from app.models.meta_models import Group, User


def parse_args():
    parser = argparse.ArgumentParser(description="Cadastrar ou atualizar um Superadministrador no AIOps OpsPages.")
    parser.add_argument(
        "--default",
        action="store_true",
        help="Garante o cadastro do Super Admin padrão (willian.jesus@loft.com.br)",
    )
    parser.add_argument("--username", "-u", type=str, help="Nome de usuário (login)")
    parser.add_argument("--email", "-e", type=str, help="E-mail do administrador")
    parser.add_argument("--full-name", "-n", type=str, help="Nome completo")
    parser.add_argument(
        "--password",
        "-p",
        type=str,
        help="Senha de acesso (opcional no modo --default; se omitida no modo custom, será solicitada de forma oculta)",
    )
    return parser.parse_args()


def main():
    print("=" * 68)
    print("  AIOps OpsPages — Cadastro de Superadministrador de Plataforma")
    print("=" * 68)

    init_meta_db()
    args = parse_args()

    if args.default:
        username = (args.username or settings.DEFAULT_SUPERADMIN_USERNAME).strip().lower()
        email = (args.email or settings.DEFAULT_SUPERADMIN_EMAIL).strip().lower()
        full_name = (args.full_name or settings.DEFAULT_SUPERADMIN_NAME).strip()
        password = args.password or settings.DEFAULT_SUPERADMIN_PASSWORD
    else:
        username = args.username
        if not username:
            username = input(f"Nome de usuário [{settings.DEFAULT_SUPERADMIN_USERNAME}]: ").strip() or settings.DEFAULT_SUPERADMIN_USERNAME
        username = username.lower()

        email = args.email
        if not email:
            email = input(f"E-mail corporativo [{settings.DEFAULT_SUPERADMIN_EMAIL}]: ").strip() or settings.DEFAULT_SUPERADMIN_EMAIL
        if "@" not in email:
            print("❌ Erro: E-mail inválido.")
            sys.exit(1)
        email = email.lower()

        full_name = args.full_name
        if not full_name:
            full_name = input(f"Nome completo [{settings.DEFAULT_SUPERADMIN_NAME}]: ").strip() or settings.DEFAULT_SUPERADMIN_NAME

        password = args.password
        if not password:
            while True:
                p1 = getpass.getpass("Digite a senha do Super Admin (mín. 6 caracteres): ")
                if len(p1) < 6:
                    print("❌ A senha deve conter no mínimo 6 caracteres.")
                    continue
                p2 = getpass.getpass("Confirme a senha: ")
                if p1 != p2:
                    print("❌ As senhas não conferem. Tente novamente.")
                    continue
                password = p1
                break

    if len(password) < 6:
        print("❌ Erro: A senha deve ter no mínimo 6 caracteres.")
        sys.exit(1)

    db = SessionLocal()
    try:
        admin_group = db.query(Group).filter(Group.role_level == "admin").first()
        user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        hashed = hash_password(password)

        if user:
            user.username = username
            user.email = email
            user.full_name = full_name
            user.hashed_password = hashed
            user.is_active = True
            user.is_superuser = True
            if admin_group and all(g.id != admin_group.id for g in user.groups):
                user.groups.append(admin_group)
            db.commit()
            print(f"\n✅ Super Admin '{user.email}' (username: {user.username}) atualizado com sucesso!")
        else:
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=hashed,
                is_active=True,
                is_superuser=True,
            )
            if admin_group:
                user.groups = [admin_group]
            db.add(user)
            db.commit()
            print(f"\n✅ Super Admin '{user.email}' (username: {user.username}) criado com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao persistir Super Admin: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
