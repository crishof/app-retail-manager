# RetailManager

A modular, microservices-based commercial management system for retail and wholesale operations.

---

## Quick Start

```bash
# Start infrastructure (PostgreSQL, RabbitMQ, Gateway)
cd docker/compose
docker compose up -d

# Frontend
cd frontend/web-client
npm install && npm start

# Backend (individual service)
cd backend/erphub-api/microservices/brand-sv
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
```

---

## Architecture

- **Backend**: Spring Boot 4 microservices (Java 25)
- **Frontend**: Angular 17
- **Gateway**: Spring Cloud Gateway + Eureka
- **Database**: PostgreSQL (one database per service)
- **Messaging**: RabbitMQ

### Microservices

| Service | Path | Description |
|---------|------|-------------|
| api-gateway | microservices/api-gateway | Entry point, routes to services |
| service-registry | microservices/service-registry | Eureka service discovery |
| config-server | microservices/config-server | Centralized configuration |
| brand-sv | microservices/brand-sv | Brand management |
| category-sv | microservices/category-sv | Category hierarchy |
| product-sv | microservices/product-sv | Product lifecycle |
| supplier-sv | microservices/supplier-sv | Supplier management |
| inventory-sv | microservices/inventory-sv | Stock control |
| purchase-sv | microservices/purchase-sv | Purchase orders |
| sales-sv | microservices/sales-sv | Sales management |
| cash-sv | microservices/cash-sv | Cash flow |
| customer-sv | microservices/customer-sv | Customer data |
| location-sv | microservices/location-sv | Warehouses/branches |
| pricing-sv | microservices/pricing-sv | Pricing rules |
| image-sv | microservices/image-sv | Cloudinary integration |
| exchange-sv | microservices/exchange-sv | Currency rates |
| reporting-sv | microservices/reporting-sv | Reports |

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Local Development Setup](docs/local-development.md)
- [Docker & Infrastructure](docs/docker.md)
- [Security Guidelines](docs/security.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

### For AI Agents

See [docs/agents/AGENTS.md](docs/agents/AGENTS.md) for detailed agent instructions.

---

## Key Features

- Multi-warehouse inventory management
- Supplier price list import (Excel)
- Purchase and sales workflow
- Customer account management
- Cash drawer operations
- Multi-branch support
- Image management (Cloudinary)
- Currency exchange rates

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Backend | Java 25, Spring Boot 4 |
| API | REST, Feign Client |
| Circuit Breaker | Resilience4j |
| Discovery | Eureka |
| Config | Spring Cloud Config |
| Frontend | Angular 17, TypeScript |
| Database | PostgreSQL |
| Messaging | RabbitMQ |
| Container | Docker Compose |

---

## License

MIT