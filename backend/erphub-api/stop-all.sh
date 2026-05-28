#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
COMPOSE_FILE="$SCRIPT_DIR/docker/compose/docker-compose.yml"
PID_FILE="$SCRIPT_DIR/services.pids"

if [[ -f "$PID_FILE" ]]; then
  echo "🛑 Deteniendo servicios Spring..."

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue

    # Formato nuevo: service:pid. Formato antiguo: pid
    if [[ "$line" == *":"* ]]; then
      service="${line%%:*}"
      pid="${line##*:}"
    else
      service="unknown"
      pid="$line"
    fi

    if kill -0 "$pid" 2>/dev/null; then
      echo "➡️  Deteniendo $service (PID $pid)"
      kill "$pid" || true
    else
      echo "⚠️  $service (PID $pid) ya no existe"
    fi
  done < "$PID_FILE"

  rm -f "$PID_FILE"
  echo "✅ Servicios Spring detenidos."
else
  echo "⚠️ No existe $PID_FILE, no hay servicios registrados."
fi

echo "🛑 Deteniendo infraestructura Docker..."
docker compose -f "$COMPOSE_FILE" down