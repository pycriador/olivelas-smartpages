---
title: "Runbook Operacional & CLI Supabase — Olivelas SmartPages"
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

# Level 4 — Runbook Operacional (`operations/runbook.md`)

## 1. Inicialização e Verificação do Schema `smartpages` no Supabase

Para aplicar as migrations de [`supabase/migrations/`](../../supabase/migrations/) e garantir que as configurações da plataforma, grupos HBAC e os 20 temas visuais estejam sincronizados no schema `smartpages`:

```bash
# Aplicar todas as migrations SQL e verificar o status do schema smartpages
python3 backend/scripts/setup_db.py

# Consultar apenas o status e contadores atuais do banco no Supabase
python3 backend/scripts/setup_db.py --status
```

---

## 2. Gerenciamento de Usuários no Supabase via CLI (`manage_users.py`)

O utilitário [`backend/scripts/manage_users.py`](../../backend/scripts/manage_users.py) (e o guia interativo [`backend/scripts/examples_supabase_cli.sh`](../../backend/scripts/examples_supabase_cli.sh)) permite administrar usuários diretamente no schema `smartpages` do Supabase:

```bash
# 1. Verificar se a plataforma já possui usuários ou se o próximo cadastro será o Global Admin
python3 backend/scripts/manage_users.py status

# 2. Listar todos os usuários e seus grupos HBAC
python3 backend/scripts/manage_users.py list

# 3. Cadastrar o primeiro usuário (promovido automaticamente a Global Admin)
python3 backend/scripts/manage_users.py create \
  --email "admin@olivelas.com" \
  --name "Global Admin Olivelas" \
  --password "<SENHA_FORTE>"

# 4. Cadastrar um usuário Editor ou Viewer
python3 backend/scripts/manage_users.py create \
  --email "editor@olivelas.com" \
  --name "Editor Frontend" \
  --password "<SENHA_FORTE>" \
  --role editor

# 5. Alterar o papel HBAC de um usuário (admin | editor | viewer)
python3 backend/scripts/manage_users.py set-role --email "editor@olivelas.com" --role admin

# 6. Promover ou revogar privilégio de Global Admin
python3 backend/scripts/manage_users.py promote-admin --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py revoke-admin  --email "editor@olivelas.com"

# 7. Redefinir senha de qualquer usuário
python3 backend/scripts/manage_users.py reset-password \
  --email "admin@olivelas.com" \
  --password "<NOVA_SENHA_FORTE>"

# 8. Desativar, reativar ou remover usuário
python3 backend/scripts/manage_users.py deactivate --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py activate   --email "editor@olivelas.com"
python3 backend/scripts/manage_users.py delete     --email "editor@olivelas.com"
```

---

## 3. Operação Local dos Serviços (`./start.sh`)

```bash
# Iniciar Backend (:8005) e Frontend (:5176)
./start.sh start

# Verificar saúde e PIDs ativos
./start.sh status

# Reiniciar serviços após alteração de .env
./start.sh restart

# Inspecionar logs em tempo real
./start.sh logs

# Parar todos os processos
./start.sh stop
```

---

## 4. Procedimentos de Emergência e Resposta a Incidentes

### 4.1. Rollback Imediato de uma Build com Defeito em Produção
1. **Via Console Web (`/deployments`)**:
   - Caso o projeto esteja com **Version Lock** ativo, clique em **Destravar Versão** no topo do Dashboard.
   - Na tabela de **Builds & Releases**, localize a versão estável anterior (ex.: `1.0.0`) e clique em **Rollback**.
2. **Via API (cURL)**:
   ```bash
   curl -X POST "http://localhost:8005/api/v1/projects/1/deployments/1.0.0/rollback" \
     -H "Authorization: Bearer <TOKEN_ADMIN_OU_EDITOR>"
   ```
3. **Comportamento Garantido (`P-1` & `P-3`)**:
   - O `index.html` possui `Cache-Control: no-cache, max-age=0, must-revalidate`, portanto os navegadores buscam imediatamente o HTML da versão restaurada.
   - Clientes com abas abertas que ainda requisitem `/assets/*` da versão anterior continuam sendo atendidos sem erro `404` graças ao fallback entre `/repos/{slug}/releases/*`.

### 4.2. Travar Produção Durante Congelamento de Mudanças (Change Freeze)
```bash
curl -X POST "http://localhost:8005/api/v1/projects/1/lock" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"is_locked": true, "version": "1.1.0", "reason": "Change Freeze"}'
```
