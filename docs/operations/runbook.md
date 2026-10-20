---
title: "Runbook Operacional — AIOps OpsPages"
status: "ACCEPTED"
owner: "aiops-platform-team"
created: "2026-10-20"
updated: "2026-10-20"
review_date: "2027-01-20"
version: "1.1"
---

> Language: pt-BR
>
> Status: ACCEPTED
>
> Documentation Standard v1.0 (Loft AIOps)

# Level 4 — Runbook Operacional (`operations/runbook.md`)

## 1. Operação Diária dos Serviços (`./start.sh`)

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

## 2. Procedimentos de Emergência e Resposta a Incidentes

### 2.1. Rollback Imediato de uma Build com Defeito em Produção
1. **Via Console Web (`http://localhost:5176/deployments`)**:
   - Caso o projeto esteja com **Version Lock** ativo, clique em **Destravar Versão** no topo do Dashboard.
   - Na tabela de **Builds & Releases**, localize a versão estável anterior (ex.: `1.0.0`) e clique em **Rollback**.
2. **Via API (cURL)**:
   ```bash
   curl -X POST "http://localhost:8005/api/v1/projects/1/deployments/1/rollback" \
     -H "Authorization: Bearer <TOKEN_ADMIN_OU_EDITOR>"
   ```
3. **Comportamento Garantido (`P-1` & `P-3`)**:
   - O `index.html` possui `Cache-Control: no-cache, max-age=0, must-revalidate`, portanto os navegadores buscam imediatamente o HTML da versão restaurada.
   - Clientes com abas abertas que ainda requisitem `/assets/*` da versão anterior continuam sendo atendidos sem erro `404` graças ao fallback entre `/repos/{slug}/releases/*`.

### 2.2. Travar Produção Durante Congelamento de Mudanças (Change Freeze)
```bash
curl -X POST "http://localhost:8005/api/v1/projects/1/lock" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"is_locked": true, "version": "1.1.0", "reason": "Change Freeze Black Friday"}'
```

### 2.3. Recuperação de Acesso Administrativo (Reset de Senha via CLI)
Caso um administrador perca acesso ao console web:
```bash
cd backend
python3 scripts/change_password.py --user willian.jesus@loft.com.br --password "<NOVA_SENHA_FORTE>"
```
