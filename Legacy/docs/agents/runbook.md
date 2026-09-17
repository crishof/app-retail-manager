# Runbook - Commands Reference

## Docker

```bash
# Start all infrastructure
cd docker/compose
docker compose up -d

# Check status
docker ps

# View logs
docker logs -f postgres
docker logs -f rabbitmq
docker logs -f gateway-sv

# Stop everything
docker compose down

# Full reset (destroy data)
docker compose down -v
```

---

## Backend - Maven

```bash
# Run single service (dev profile)
cd microservices/brand-sv
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'

# Build
mvn clean package

# Run tests
mvn test

# Compile only
mvn compile
```

---

## Backend - IDE

```bash
# IntelliJ
# 1. Import as Maven project
# 2. Run configuration:
#    - VM options: -Xmx512m
#    - Program args: --spring.profiles.active=dev
#    - Working directory: microservices/brand-sv
```

---

## Frontend - npm

```bash
# Install
cd frontend/web-client
npm install

# Dev server
npm start

# Production build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

---

## Database

```bash
# Connect to PostgreSQL
psql -h localhost -p 5544 -U erphub

# List databases
docker exec postgres psql -U erphub -l

# Run init scripts
docker exec -it postgres psql -U erphub -f /docker/postgres/init/01-create-databases.sql
```

---

## Service Health

```bash
# Gateway health
curl http://localhost:8080/actuator/health

# Eureka
curl http://localhost:8761/actuator/health

# Individual service (internal)
docker logs brand-sv | grep UP
```

---

## Common Tasks

### Add new microservice
1. Create Spring Boot project in `microservices/`
2. Add to `docker-compose.yml`
3. Add database in `docker/postgres/init/`
4. Configure routes in `api-gateway`

### Update dependencies
```bash
# Backend
mvn versions:display-dependency-updates

# Frontend
npm outdated
```

### Create migration
```sql
-- Add to docker/postgres/init/ or Liquibase
ALTER TABLE product ADD COLUMN new_column VARCHAR(255);
```

---

## Troubleshooting

| Issue | Command |
|-------|---------|
| Service won't start | `docker logs {service}` |
| DB connection failed | `docker port postgres` |
| Port conflict | `lsof -i :8080` |
| Memory issues | `docker stats` |