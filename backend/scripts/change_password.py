#!/usr/bin/env python3
"""
Olivelas OpsPages - Script Administrativo: Alteração de Senha de Usuário.

Uso:
  python scripts/change_password.py --user admin@olivelas.com --password "NovaSenha@123"
  ou interativo:
  python scripts/change_password.py
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
from app.models.meta_models import User


def parse_args():
    parser = argparse.ArgumentParser(description="Alterar a senha de um usuário no Olivelas OpsPages.")
    parser.add_argument("--user", "-u", type=str, help="Username ou e-mail do usuário")
    parser.add_argument("--password", "-p", type=str, help="Nova senha")
    return parser.parse_args()


def main():
    print("=" * 65)
    print("  Olivelas OpsPages — Alteração de Senha de Usuário")
    print("=" * 65)

    init_meta_db()
    args = parse_args()

    identifier = args.user
    if not identifier:
        identifier = input("Digite o username ou e-mail do usuário: ").strip()
    if not identifier:
        print("❌ Erro: Identificador não pode ser vazio.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == identifier.lower()) | (User.email == identifier.lower())
        ).first()
        if not user:
            print(f"❌ Erro: Usuário '{identifier}' não encontrado.")
            sys.exit(1)

        password = args.password
        if not password:
            while True:
                p1 = getpass.getpass(f"Digite a nova senha para '{user.email}': ")
                if len(p1) < 6:
                    print("❌ A senha deve ter no mínimo 6 caracteres.")
                    continue
                p2 = getpass.getpass("Confirme a nova senha: ")
                if p1 != p2:
                    print("❌ As senhas não conferem.")
                    continue
                password = p1
                break
        elif len(password) < 6:
            print("❌ Erro: A senha deve ter no mínimo 6 caracteres.")
            sys.exit(1)

        user.hashed_password = hash_password(password)
        db.commit()
        print(f"\n✅ Senha do usuário '{user.email}' ({user.username}) atualizada com sucesso!")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao atualizar senha: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
