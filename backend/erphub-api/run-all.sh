#!/bin/bash
set -e

BASE_DIR="microservices"
COMPOSE_FILE="docker/compose/docker-compose.yml"
PID_FILE="services.pids"

SERVICES=(
  "branch-sv"
  "brand-sv"
  "cash-sv"
  "category-sv"
  "customer-sv"
  "exchange-sv"
  "identity-sv"
  "image-sv"
  "inventory-sv"
  "location-sv"
  "pricing-sv"
  "product-sv"
  "purchase-sv"
  "reporting-sv"
  "sales-sv"
  "supplier-catalog-sv"
  "supplier-sv"
  "tenant-sv"
)

echo "🚀 Levantando infraestructura..."
docker compose -f "$COMPOSE_FILE" up -d

rm -f "$PID_FILE"
touch "$PID_FILE"

echo "🚀 Levantando microservicios..."

for service in "${SERVICES[@]}"; do
  echo "Iniciando $service..."
  (cd "$BASE_DIR/$service" && mvn spring-boot:run) &
  echo $! >> "$PID_FILE"
done

echo "✅ Todos los servicios iniciados."
echo "📌 PIDs guardados en: $PID_FILE"

wait