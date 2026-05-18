#!/bin/bash

COMPOSE_FILE="docker/compose/docker-compose.yml"
PID_FILE="services.pids"

if [ -f "$PID_FILE" ]; then
  echo "🛑 Deteniendo microservicios..."

  while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "➡️  Matando PID $pid"
      kill "$pid"
    else
      echo "⚠️  PID $pid ya no existe"
    fi
  done < "$PID_FILE"

  rm -f "$PID_FILE"
  echo "✅ Microservicios detenidos."
else
  echo "⚠️ No existe $PID_FILE, no hay microservicios registrados."
fi

echo "🛑 Deteniendo infraestructura docker..."
docker compose -f "$COMPOSE_FILE" down