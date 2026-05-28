#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
BASE_DIR="$SCRIPT_DIR/microservices"
COMPOSE_FILE="$SCRIPT_DIR/docker/compose/docker-compose.yml"
PID_FILE="$SCRIPT_DIR/services.pids"
LOG_DIR="$SCRIPT_DIR/logs"

# Por defecto asumimos infraestructura en Docker y solo levantamos el monolito local.
START_LOCAL_INFRA="${START_LOCAL_INFRA:-false}"
if [[ "$START_LOCAL_INFRA" == "true" ]]; then
  SERVICES=(
    "service-registry"
    "config-server"
    "api-gateway"
    "retail-api"
  )
else
  SERVICES=("retail-api")
fi

if [[ ! -f "$SCRIPT_DIR/mvnw" ]]; then
  echo "❌ No se encontró mvnw en $SCRIPT_DIR"
  exit 1
fi

echo "🚀 Levantando infraestructura Docker..."
docker compose -f "$COMPOSE_FILE" up -d

mkdir -p "$LOG_DIR"
rm -f "$PID_FILE"
touch "$PID_FILE"

echo "🚀 Levantando servicios Spring..."
if [[ "$START_LOCAL_INFRA" != "true" ]]; then
  echo "ℹ️  START_LOCAL_INFRA=false -> solo se inicia retail-api local"
fi

for service in "${SERVICES[@]}"; do
  if [[ ! -d "$BASE_DIR/$service" ]]; then
    echo "⚠️  Saltando $service (directorio no existe)"
    continue
  fi

  echo "Iniciando $service..."
  (
    cd "$SCRIPT_DIR"
    ./mvnw -f "$BASE_DIR/pom.xml" -pl "$service" spring-boot:run
  ) > "$LOG_DIR/$service.log" 2>&1 &

  pid=$!
  echo "$service:$pid" >> "$PID_FILE"
  echo "  ↳ PID $pid | log: logs/$service.log"

  # Da tiempo a levantar dependencias base antes del siguiente módulo
  if [[ "$service" == "service-registry" || "$service" == "config-server" ]]; then
    sleep 4
  fi
done

echo "✅ Arranque lanzado."
echo "📌 PIDs guardados en: $PID_FILE"
echo "📌 Logs en: $LOG_DIR"

wait