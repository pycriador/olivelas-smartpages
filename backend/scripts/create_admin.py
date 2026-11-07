#!/usr/bin/env python3
"""
Olivelas SmartPages — Script Administrativo: Criação / Promoção de Global Admin no Supabase (`smartpages`).

Exemplos de uso:
  python scripts/create_admin.py --email admin@olivelas.com --full-name "Admin Global" --password "SuaSenhaForte123!"
  python scripts/create_admin.py   # Modo interativo
"""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import hash_password
from app.db.session import SessionLocal, init_meta_db
from app.models.meta_models import Group, User


def parse_args():
    parser = argparse.ArgumentParser(description="Cadastrar ou atualizar um Global Admin no Olivelas SmartPages.")
    parser.add_argument("--username", "-u", type=str, help="Nome de usuário (opcional; padrão: prefixo do e-mail)")
    parser.add_argument("--email", "-e", type=str, help="E-mail do Global Admin")
    parser.add_argument("--full-name", "-n", type=str, help="Nome completo")
    parser.add_argument("--password", "-p", type=str, help="Senha de acesso (mínimo 6 caracteres)")
    return parser.parse_args()


def main():
    print("=" * 72)
    print("  Olivelas SmartPages — Cadastro de Global Admin (Schema: smartpages)")
    print("=" * 72)

    init_meta_db()
    args = parse_args()

    email = (args.email or "").strip().lower()
    if not email:
        email = input("E-mail do Global Admin: ").strip().lower()
    if "@" not in email:
        print("[ERRO] E-mail inválido.")
        sys.exit(1)

    username = (args.username or email.split("@")[0]).strip().lower()
    full_name = (args.full_name or "").strip()
    if not full_name:
        full_name = input(f"Nome completo [{username}]: ").strip() or username

    password = args.password
    if not password:
        while True:
            p1 = getpass.getpass("Digite a senha do Global Admin (mín. 6 caracteres): ")
            if len(p1) < 6:
                print("[ERRO] A senha deve conter no mínimo 6 caracteres.")
                continue
            p2 = getpass.getpass("Confirme a senha: ")
            if p1 != p2:
                print("[ERRO] As senhas não conferem. Tente novamente.")
                continue
            password = p1
            break

    if len(password) < 6:
        print("[ERRO] A senha deve ter no mínimo 6 caracteres.")
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
            print(f"\n[OK] Global Admin '{user.email}' (username: {user.username}) atualizado com sucesso!")
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
            print(f"\n[OK] Global Admin '{user.email}' (username: {user.username}) criado com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"\n[ERRO] Falha ao persistir Global Admin: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
