# Local Development Setup

## Prerequisites

- Java 25
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose

---

## Infrastructure (Required)

Start PostgreSQL and RabbitMQ:

```bash
cd docker/compose
docker compose up -d
```

Verify services:
```bash
docker ps                           # All containers running
docker logs postgres -f            # PostgreSQL logs
docker logs rabbitmq -f             # RabbitMQ logs
```

Access:
- PostgreSQL: `localhost:5544` (user: `erphub`, pass: `RetailMgr2024!`)
- RabbitMQ UI: `http://localhost:15672` (guest/guest)

---

## Backend Development

### Option 1: Run Single Service

```bash
cd backend/erphub-api/microservices/brand-sv

# Development profile (connects to Docker localhost)
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
```

### Option 2: Run All Services (Docker)

```bash
cd backend/erphub-api/docker/compose

# Start all services (gateway + 13 microservices)
docker compose up -d

# Check health
curl http://localhost:8080/actuator/health
```

### Build a Service

```bash
cd backend/erphub-api/microservices/brand-sv
mvn clean package -DskipTests
```

---

## Frontend Development

```bash
cd frontend/web-client
npm install
npm start
```

Navigate to: `http://localhost:4200`

### Build for Production

```bash
cd frontend/web-client
npm run build
```

---

## IDE Configuration

### IntelliJ IDEA

1. Import as Maven project
2. Set SDK to Java 25
3. Run configuration:
   - Main class: `SpringBootApplication`
   - Program args: `--spring.profiles.active=dev`
   - Environment: `MAVEN_OPTS=-Xmx512m`

### VS Code

Install extensions:
- Extension Pack for Java
- Angular Language Service

---

## Environment Variables

Create `.env` in project root (DO NOT commit):

```bash
# Database
POSTGRES_USER=erphub
POSTGRES_PASSWORD=RetailMgr2024!
POSTGRES_PORT=5544

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Spring
SPRING_PROFILES_ACTIVE=dev
```

---

## Common Tasks

### Add New Microservice

1. Create Spring Boot project in `microservices/`
2. Add to `docker-compose.yml`
3. Add database in `docker/postgres/init/`
4. Configure routes in `api-gateway`

### Update Dependencies

```bash
# Backend
mvn dependency:tree
mvn versions:display-dependency-updates

# Frontend
npm outdated
```

### Run Tests

```bash
# Backend
mvn test

# Frontend
npm test
```

---

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for common issues.