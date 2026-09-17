# Docker & Infrastructure

## Overview

The project uses Docker Compose to orchestrate:
- PostgreSQL (multi-database)
- RabbitMQ (message broker)
- API Gateway
- All microservices

---

## Quick Start

```bash
cd docker/compose
docker compose up -d
```

This starts 15 services:
- 1 PostgreSQL instance
- 1 RabbitMQ instance
- 1 API Gateway
- 13 Microservices

---

## Services

| Service | Port | Internal | Description |
|---------|------|----------|-------------|
| postgres | 5544 | No | PostgreSQL 17 (mapped 5432→5544) |
| rabbitmq | 15672 | No | RabbitMQ 3.13 management |
| gateway-sv | 8080 | No | Spring Cloud Gateway |
| brand-sv | - | Yes | Brand service |
| category-sv | - | Yes | Category service |
| product-sv | - | Yes | Product service |
| supplier-sv | - | Yes | Supplier service |
| inventory-sv | - | Yes | Inventory service |
| purchase-sv | - | Yes | Purchase service |
| sales-sv | - | Yes | Sales service |
| cash-sv | - | Yes | Cash service |
| customer-sv | - | Yes | Customer service |
| location-sv | - | Yes | Location service |
| pricing-sv | - | Yes | Pricing service |
| image-sv | - | Yes | Image service |
| exchange-sv | - | Yes | Exchange service |
| service-registry | - | Yes | Eureka server |
| config-server | - | Yes | Config server |

---

## Configuration

### Environment Variables

See `.env` file in `docker/compose/`:

```bash
POSTGRES_USER=erphub
POSTGRES_PASSWORD=RetailMgr2024!
POSTGRES_DB_PORT=5544
SPRING_ACTIVE_PROFILE=prod
```

### Spring Profiles

| Profile | Database Host | RabbitMQ Host | Purpose |
|---------|---------------|---------------|---------|
| `dev` | localhost:5544 | localhost | IDE development |
| `prod` | postgres:5432 | rabbitmq | Docker containers |

---

## Database Initialization

On first start, PostgreSQL runs scripts from `docker/postgres/init/`:

1. `01-create-databases.sql` - Creates 13 databases
2. `02-grant-privileges.sql` - Grants user permissions

Databases created:
- brand_db, category_db, customer_db, product_db
- supplier_db, inventory_db, pricing_db, image_db
- price_list_db, sales_db, exchange_db, location_db, branch_db

---

## Common Commands

```bash
# Start all services
docker compose up -d

# Start with logs
docker compose up

# Stop all services
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v

# View logs
docker logs postgres
docker logs gateway-sv
docker logs brand-sv -f

# Check status
docker ps

# Rebuild services
docker compose build --no-cache
docker compose up -d --force-recreate
```

---

## Health Checks

All services expose health endpoints:

```bash
# Gateway
curl http://localhost:8080/actuator/health

# Individual service (via gateway)
docker logs brand-sv | grep "UP"
```

---

## Network

- Network name: `erphub-net`
- All microservices communicate on internal network
- Only gateway exposed to host

---

## Security Notes

- Change default passwords in `.env` before production
- Use secrets management (Vault, AWS Secrets Manager)
- Do not expose services without authentication layer

---

## Troubleshooting

### Container keeps restarting

```bash
docker logs <service-name>
```

Common causes:
- Database not ready (wait for healthcheck)
- Missing environment variable
- Port conflict

### Cannot connect from IDE

1. Verify port mapping: `docker port postgres`
2. Verify dev profile is active
3. Test: `psql -h localhost -p 5544 -U erphub -l`