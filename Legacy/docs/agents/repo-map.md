# Repository Map

## Quick Reference

| Path | Description |
|------|-------------|
| `backend/erphub-api/` | Main backend code |
| `backend/erphub-api/microservices/` | All Spring Boot services |
| `backend/erphub-api/docker/` | Docker and PostgreSQL config |
| `frontend/web-client/` | Angular application |
| `docs/` | Documentation |

---

## Backend Structure

### Microservices (`microservices/`)

```
microservices/
├── api-gateway/           # Port 8080, entry point
├── service-registry/      # Port 8761, Eureka
├── config-server/         # Port 8888, Config
├── brand-sv/              # Brand CRUD
├── category-sv/           # Category hierarchy
├── product-sv/            # Product management
├── supplier-sv/           # Supplier data
├── supplier-catalog-sv/   # Price list import
├── inventory-sv/          # Stock management
├── purchase-sv/           # Purchase orders
├── sales-sv/              # Sales orders
├── cash-sv/               # Cash operations
├── customer-sv/            # Customer data
├── location-sv/            # Warehouses/branches
├── branch-sv/              # Branch management
├── pricing-sv/            # Pricing rules
├── image-sv/              # Cloudinary integration
├── exchange-sv/           # Currency rates
├── tenant-sv/             # Multi-tenant support
└── reporting-sv/          # Reports
```

### Service Structure

Each service follows:

```
{service}/
├── src/main/java/com/crishof/{service}/
│   ├── controller/   # REST endpoints
│   ├── service/      # Business logic
│   ├── repository/   # Data access
│   ├── model/        # JPA entities
│   ├── dto/          # Request/Response objects
│   ├── config/       # Spring config
│   └── exception/    # Error handling
├── src/main/resources/
│   ├── application.yaml
│   └── messages.properties
└── pom.xml
```

---

## Docker (`docker/`)

```
docker/
├── compose/
│   ├── docker-compose.yml   # Service definitions
│   ├── .env                 # Environment variables
│   └── README.md            # Docker docs (legacy)
├── postgres/
│   └── init/                # Database initialization
│       ├── 01-create-databases.sql
│       └── 02-grant-privileges.sql
└── nginx/                   # Reverse proxy (optional)
```

---

## Frontend (`frontend/web-client/`)

```
frontend/web-client/
├── src/app/
│   ├── core/           # Services, guards, interceptors
│   ├── shared/         # Reusable components
│   ├── features/       # Feature modules by domain
│   │   ├── catalog/
│   │   ├── suppliers/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── cash/
│   │   └── settings/
│   └── layout/         # App shell, navigation
├── src/environments/   # Dev/prod configs
└── angular.json
```

---

## Documentation (`docs/`)

```
docs/
├── architecture.md         # System overview
├── local-development.md   # Setup guide
├── docker.md              # Docker usage
├── security.md           # Security guidelines
├── troubleshooting.md    # Common issues
├── backend/
│   └── overview.md       # Backend stack
├── frontend/
│   └── overview.md       # Frontend stack
├── agents/
│   ├── AGENTS.md         # This file
│   ├── repo-map.md       # Current file
│   ├── runbook.md        # Commands reference
│   └── tasks.md          # Task templates
└── plans/
    └── work-plan.md      # Code change proposals
```

---

## Key Ports

| Service | Port | Environment |
|---------|------|-------------|
| API Gateway | 8080 | Both |
| Service Registry | 8761 | Both |
| Config Server | 8888 | Both |
| PostgreSQL | 5544 (dev), 5432 (prod) | Both |
| RabbitMQ | 5672 | Both |
| RabbitMQ UI | 15672 | Both |
| Frontend | 4200 | Dev |

---

## Where to Work

- **Backend bugs**: `microservices/{service}/src/main/java/`
- **Frontend bugs**: `frontend/web-client/src/app/`
- **Docker config**: `docker/compose/`
- **Config files**: `config-server/src/main/resources/config/`
- **Documentation**: `docs/`