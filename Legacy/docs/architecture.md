# Architecture Overview

## System Design

RetailManager follows a **microservices architecture** where each domain owns its data and business logic.

---

## High-Level Architecture

```
┌─────────────┐
│   Client    │ (Angular 17)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     API Gateway (8080)          │ Spring Cloud Gateway
│   - Route dispatch              │
│   - Load balancing              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│    Service Registry (8761)      │ Eureka
└──────┬──────────────────────────┘
       │
  ┌────┴────────────────────────────────────────┐
  │                                             │
  ▼                                             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐     ┌──────────┐
│  Brand   │  │ Product  │  │ Supplier │     │  Config  │
│   Service│  │  Service │  │  Service │     │  Server  │
└────┬─────┘  └────┬─────┘  └────┬─────┘     └──────────┘
     │             │             │
     ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ brand_  │   │product_ │   │supplier_ │
│   db    │   │   db    │   │   db    │
└─────────┘   └─────────┘   └─────────┘
```

---

## Components

### Infrastructure

| Component | Port | Description |
|-----------|------|-------------|
| PostgreSQL | 5544 | Multi-database instance |
| RabbitMQ | 15672 | Message broker (management UI) |
| API Gateway | 8080 | Single entry point |

### Microservices

All services:
- Run on internal Docker network (except gateway)
- Use Spring Boot 4 + Java 25
- Expose REST APIs under `/api/v1/{domain}`
- Use Spring Data JPA + PostgreSQL
- Include Spring Actuator health endpoints
- Support `dev` and `prod` profiles

---

## Communication Patterns

### Service-to-Service

```
┌─────────────┐      Feign Client      ┌─────────────┐
│Brand Service│ ─────────────────────▶│Supplier     │
│             │    + Resilience4j      │   Service   │
└─────────────┘     Circuit Breaker    └─────────────┘
```

- **Feign**: Declarative HTTP client
- **Resilience4j**: Circuit breaker, retry, rate limiter
- **Fallback**: Graceful degradation when service unavailable

### Async Events

All services publish events to RabbitMQ for:
- Stock movements
- Price updates
- Invoice generation
- Notification triggers

---

## Database Strategy

- **One database per service**: Data isolation
- **PostgreSQL 17**: Single container, multiple databases
- **Init scripts**: Automatic schema creation on startup

---

## API Design

### REST Conventions

```
GET    /api/v1/{resource}           # List all
GET    /api/v1/{resource}/{id}       # Get by ID
POST   /api/v1/{resource}           # Create
PUT    /api/v1/{resource}/{id}      # Update
DELETE /api/v1/{resource}/{id}      # Delete
```

### Request/Response

- JSON payloads
- UUID for identifiers
- ISO 8601 for dates
- Standard HTTP status codes

---

## Configuration

- **Config Server**: Centralized YAML configs
- **Location**: `config-server/src/main/resources/config/`
- **Per-service**: Service-specific properties
- **Profiles**: `dev` (localhost) vs `prod` (Docker network)

---

## Security (Planned)

- JWT authentication
- OAuth2 authorization
- Role-based access control (RBAC)
- Service-level permissions

---

## Deployment

Development:
```bash
docker compose up -d
```

Production:
- Container orchestration (Kubernetes recommended)
- Service discovery in production mode
- Load balancer in front of gateway