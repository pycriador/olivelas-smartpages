#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/logs"

BACKEND_PORT="${OPSPAGES_BACKEND_PORT:-8005}"
FRONTEND_PORT="${OPSPAGES_FRONTEND_PORT:-5176}"

mkdir -p "$PID_DIR" "$LOG_DIR" "$ROOT_DIR/repos"

GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

print_banner() {
  echo -e "${ORANGE}=================================================================${NC}"
  echo -e "${ORANGE}  Olivelas OpsPages — Enterprise Static Builds & Git /repos Hub  ${NC}"
  echo -e "${ORANGE}=================================================================${NC}"
}

init_db() {
  echo -e "${GREEN}[OpsPages]${NC} Inicializando banco de metadados e configurações da plataforma..."
  (cd "$BACKEND_DIR" && python3 scripts/setup_db.py)
}

start_services() {
  print_banner
  init_db

  if [ -f "$PID_DIR/backend.pid" ] && kill -0 "$(cat "$PID_DIR/backend.pid")" 2>/dev/null; then
    echo -e "${ORANGE}[Backend]${NC} Já está em execução (PID $(cat "$PID_DIR/backend.pid"))"
  else
    echo -e "${GREEN}[Backend]${NC} Iniciando FastAPI em http://localhost:${BACKEND_PORT} ..."
    (
      cd "$BACKEND_DIR"
      nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$LOG_DIR/backend.log" 2>&1 &
      echo $! > "$PID_DIR/backend.pid"
    )
  fi

  if [ -f "$PID_DIR/frontend.pid" ] && kill -0 "$(cat "$PID_DIR/frontend.pid")" 2>/dev/null; then
    echo -e "${ORANGE}[Frontend]${NC} Já está em execução (PID $(cat "$PID_DIR/frontend.pid"))"
  else
    echo -e "${GREEN}[Frontend]${NC} Iniciando Vite UI em http://localhost:${FRONTEND_PORT} ..."
    (
      cd "$FRONTEND_DIR"
      nohup npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" > "$LOG_DIR/frontend.log" 2>&1 &
      echo $! > "$PID_DIR/frontend.pid"
    )
  fi

  sleep 1
  status_services
}

stop_services() {
  for svc in backend frontend; do
    if [ -f "$PID_DIR/${svc}.pid" ]; then
      PID="$(cat "$PID_DIR/${svc}.pid")"
      if kill -0 "$PID" 2>/dev/null; then
        echo -e "${ORANGE}[${svc}]${NC} Encerrando processo PID $PID..."
        kill "$PID" 2>/dev/null || true
      fi
      rm -f "$PID_DIR/${svc}.pid"
    fi
  done
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    PORT_PIDS="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [ -n "$PORT_PIDS" ]; then
      kill $PORT_PIDS 2>/dev/null || true
    fi
  done
  echo -e "${GREEN}[OpsPages]${NC} Serviços encerrados."
}

status_services() {
  echo ""
  for svc in backend frontend; do
    if [ -f "$PID_DIR/${svc}.pid" ] && kill -0 "$(cat "$PID_DIR/${svc}.pid")" 2>/dev/null; then
      echo -e "  ● ${svc}: ${GREEN}ONLINE${NC} (PID $(cat "$PID_DIR/${svc}.pid"))"
    else
      echo -e "  ○ ${svc}: ${RED}OFFLINE${NC}"
    fi
  done
  echo ""
  echo -e "  🌐 Frontend Console : http://localhost:${FRONTEND_PORT}"
  echo -e "  ⚡ Backend API      : http://localhost:${BACKEND_PORT}/api/v1"
  echo -e "  📖 Swagger Docs     : http://localhost:${BACKEND_PORT}/docs"
  echo -e "  📦 Static Hosting   : http://localhost:${BACKEND_PORT}/pages/{project-slug}/"
  echo -e "  👤 Global Admin     : Primeiro usuário cadastrado na plataforma (ou via manage_users.py)"
  echo ""
}

ACTION="${1:-start}"
case "$ACTION" in
  start|--daemon)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    stop_services
    sleep 1
    start_services
    ;;
  status)
    status_services
    ;;
  logs)
    tail -n 100 -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
    ;;
  *)
    echo "Uso: ./start.sh {start|stop|restart|status|logs|--daemon}"
    exit 1
    ;;
esac
