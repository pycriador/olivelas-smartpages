#!/usr/bin/env bash
# ==============================================================================
# Olivelas SmartPages — Exemplos de Gerenciamento de Usuários no Supabase via CLI
# Schema Isolado: smartpages
# ==============================================================================
# Uso:
#   chmod +x backend/scripts/examples_supabase_cli.sh
#   ./backend/scripts/examples_supabase_cli.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cat << 'EOF'
================================================================================
  Olivelas SmartPages — Guia Prático de Comandos CLI para Usuários no Supabase
================================================================================

1. Consultar status do schema `smartpages` e verificar se o próximo cadastro será Global Admin:
   python3 backend/scripts/manage_users.py status

2. Listar todos os usuários cadastrados no Supabase (schema `smartpages`):
   python3 backend/scripts/manage_users.py list

3. Cadastrar o PRIMEIRO usuário da plataforma (promovido automaticamente a GLOBAL ADMIN):
   python3 backend/scripts/manage_users.py create \
     --email "admin@olivelas.com" \
     --name "Administrador Global" \
     --password "SuaSenhaForte123!"

4. Cadastrar um usuário Editor (Frontend Editors) ou Viewer (Project Viewers):
   python3 backend/scripts/manage_users.py create \
     --email "editor@olivelas.com" \
     --name "Equipe Frontend" \
     --password "SenhaEditor123!" \
     --role editor

5. Alterar a role HBAC de um usuário existente (admin | editor | viewer):
   python3 backend/scripts/manage_users.py set-role \
     --email "editor@olivelas.com" \
     --role admin

6. Promover ou revogar Global Admin diretamente:
   python3 backend/scripts/manage_users.py promote-admin --email "editor@olivelas.com"
   python3 backend/scripts/manage_users.py revoke-admin  --email "editor@olivelas.com"

7. Redefinir a senha de qualquer usuário via CLI:
   python3 backend/scripts/manage_users.py reset-password \
     --email "admin@olivelas.com" \
     --password "NovaSenhaSegura2026!"

8. Desativar / Reativar ou Remover um usuário:
   python3 backend/scripts/manage_users.py deactivate --email "editor@olivelas.com"
   python3 backend/scripts/manage_users.py activate   --email "editor@olivelas.com"
   python3 backend/scripts/manage_users.py delete     --email "editor@olivelas.com"

9. Alternativa via API REST/RPC do Supabase (PostgREST com Accept-Profile: smartpages):
   source .env
   curl -sS -X POST "${VITE_SUPABASE_URL}/rest/v1/rpc/bootstrap_status" \
     -H "apikey: ${VITE_SUPABASE_KEY}" \
     -H "Authorization: Bearer ${VITE_SUPABASE_KEY}" \
     -H "Accept-Profile: smartpages" \
     -H "Content-Profile: smartpages" \
     -H "Content-Type: application/json" \
     -d '{}'
================================================================================
EOF

echo ""
echo "Executando verificação ao vivo do schema 'smartpages' no Supabase..."
python3 "$BACKEND_DIR/scripts/manage_users.py" status
python3 "$BACKEND_DIR/scripts/manage_users.py" list
