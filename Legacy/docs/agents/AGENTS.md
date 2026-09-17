# RetailManager - Monorepo Agent Guide

## 🏗️ Monorepo Structure

```
RetailManager/
├── frontend/
│   ├── ecommerce/              # 🆕 B2C e-commerce SPA (Angular 21)
│   └── web-client/             # B2B admin dashboard (Angular 21 + SSR)
├── backend/
│   └── erphub-api/             # Spring Boot microservices
│       ├── microservices/       # 17+ domain services
│       ├── docker/              # Docker & PostgreSQL
│       └── AGENTS.md            # Backend guidelines
├── docs/
│   └── agents/                  # Documentation hub
└── .agents/
    └── skills/                  # Shared skills (accessible globally)
```

---

## 📋 Project-Specific Guides

Each project has its own **AGENTS.md** with detailed guidelines:

| Project | Guide | Stack |
|---------|-------|-------|
| **E-commerce** | [frontend/ecommerce/AGENTS.md](../../frontend/ecommerce/AGENTS.md) | Angular 21, Vanilla CSS, Standalone |
| **Web Client** | [frontend/web-client/AGENTS.md](../../frontend/web-client/AGENTS.md) | Angular 21, Tailwind CSS, SSR |
| **Backend** | [backend/AGENTS.md](../../backend/AGENTS.md) | Spring Boot 4, Microservices, Java 25 |

---

## 🛠️ Quick Reference Commands

### Docker (Full Stack)

```bash
cd backend/erphub-api/docker/compose
docker compose up -d              # Start all services
docker compose logs -f api-gateway  # View API Gateway logs
docker compose down -v            # Stop and remove volumes
```

### Frontend - Ecommerce

```bash
cd frontend/ecommerce
npm start                         # Dev server (http://localhost:4201)
npm run build                     # Production build
npm test                          # Run tests
```

### Frontend - Web Client

```bash
cd frontend/web-client
npm start                         # Dev server with SSR (http://localhost:4200)
npm run build:ssr                 # SSR production build
npm run serve:ssr                 # Serve SSR build
```

### Backend - Single Service

```bash
cd backend/erphub-api/microservices/brand-sv
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
mvn clean package -DskipTests     # Build
mvn test                          # Run tests
```

---

## 🎯 Task Routing

Choose the right guide for your task:

### ✨ **Building UI Components/Pages**
→ Go to **[frontend/ecommerce/AGENTS.md](../../frontend/ecommerce/AGENTS.md)** or **[frontend/web-client/AGENTS.md](../../frontend/web-client/AGENTS.md)**

Use **`frontend-design` skill** for distinctive, production-grade interfaces

### 🛍️ **E-commerce Features**
- Product catalog, search, filtering
- Shopping cart and checkout flow
- User profiles and order history

→ **frontend/ecommerce/AGENTS.md** + `frontend-design` skill

### 📊 **Admin/Dashboard Features**
- B2B supplier portal
- Inventory management
- Sales analytics

→ **frontend/web-client/AGENTS.md** + `frontend-design` skill

### 🔧 **Backend Microservices**
- REST API endpoints
- Database schema
- Event-driven communication

→ **backend/AGENTS.md**

### ♿ **Accessibility Audit**
→ Use **`accessibility` skill** (WCAG AA compliance)

### 🔍 **SEO Optimization**
→ Use **`seo` skill** (metadata, structured data)

---

## 🧠 Available Skills

Global skills are in `.agents/skills/`:

| Skill | Use Case | Location |
|-------|----------|----------|
| **frontend-design** | Build distinctive UIs, pages, components | `.agents/skills/frontend-design/` |
| **accessibility** | WCAG AA compliance audit | `.agents/skills/accessibility/` |
| **seo** | Search engine optimization | `.agents/skills/seo/` |

**Access from any project**: Skills are automatically available to all agents in the monorepo

---

## 🔌 Integration Points

### Frontend ↔ Backend

```
Frontend (http://localhost:4200 / 4201)
    ↓
API Gateway (http://localhost:8080)
    ↓
Microservices (internal network)
    ↓
Databases (PostgreSQL, one per service)
```

### Key Endpoints

- **Products**: `GET /api/products` (product-sv)
- **Orders**: `POST /api/orders` (sales-sv)
- **Customers**: `GET /api/customers` (customer-sv)
- **Inventory**: `PATCH /api/inventory` (inventory-sv)

---

## 📝 Code Standards by Stack

### TypeScript/Angular (Both Frontends)
- ✅ Strict type checking
- ✅ Standalone components only
- ✅ Signals for state management
- ✅ `ChangeDetectionStrategy.OnPush`
- ❌ No NgModules
- ❌ No `any` type

### Java/Spring (Backend)
- ✅ Java 25 features (records, pattern matching)
- ✅ Domain-driven design
- ✅ Event-driven communication
- ✅ Dedicated database per service
- ✅ Custom exceptions for business logic
- ❌ No direct cross-service DB access

---

## 🚀 Quick Start

### First Time Setup

```bash
# Clone and install
git clone <repo>
cd RetailManager

# Start infrastructure
cd backend/erphub-api/docker/compose
docker compose up -d

# Start backend service (optional)
cd ../microservices/brand-sv
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'

# Start frontend (in new terminal)
cd frontend/ecommerce
npm install && npm start
```

Then access:
- 📱 **E-commerce**: http://localhost:4201
- 🖥️ **Admin Dashboard**: http://localhost:4200
- 🔌 **API Gateway**: http://localhost:8080
- 📡 **Service Registry**: http://localhost:8761

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [docs/agents/AGENTS.md](AGENTS.md) | **📍 YOU ARE HERE** - Monorepo routing |
| [frontend/ecommerce/AGENTS.md](../../frontend/ecommerce/AGENTS.md) | E-commerce project guide |
| [frontend/ecommerce/.instructions.md](../../frontend/ecommerce/.instructions.md) | E-commerce code standards |
| [frontend/web-client/AGENTS.md](../../frontend/web-client/AGENTS.md) | Web client project guide |
| [backend/AGENTS.md](../../backend/AGENTS.md) | Microservices guide |
| [docs/agents/repo-map.md](repo-map.md) | Repository structure reference |
| [docs/agents/runbook.md](runbook.md) | Operational procedures |
| [docs/agents/tasks.md](tasks.md) | Development tasks |

---

## 🔍 Common Scenarios

### "I need to add a product card component"
1. Read: [frontend/ecommerce/AGENTS.md](../../frontend/ecommerce/AGENTS.md)
2. Use: `frontend-design` skill
3. Follow: Angular component patterns (standalone, OnPush)
4. Check: `.instructions.md` for code standards

### "I need to build the product listing page"
1. Read: [frontend/ecommerce/AGENTS.md](../../frontend/ecommerce/AGENTS.md) → "UI/UX Components"
2. Use: `frontend-design` skill
3. Create: Standalone component with lazy loading
4. Test: Accessibility with `accessibility` skill

### "I need to add a new microservice"
1. Read: [backend/AGENTS.md](../../backend/AGENTS.md)
2. Follow: Service structure patterns
3. Set up: Separate database
4. Configure: Eureka registration and routing

### "I need to audit accessibility"
1. Use: `accessibility` skill
2. Target: Frontend project files
3. Fix: WCAG AA violations
4. Verify: AXE checks pass

---

## ✅ Before Starting Work

- [ ] Read the **project-specific AGENTS.md** (ecommerce, web-client, or backend)
- [ ] Check **available skills** for your task type
- [ ] Understand the **code standards** for your stack
- [ ] Verify **Docker services** are running (if backend work)
- [ ] Know the **integration points** between frontend and backend
```

### Frontend

```bash
cd frontend/web-client
npm install
npm start
```

---

## Architecture Patterns

### Service Communication

- **Feign Client**: Inter-service HTTP calls
- **Resilience4j**: Circuit breaker, retry, rate limiter
- **Fallback**: Graceful degradation

Example:
```java
@FeignClient(name = "supplier-sv", fallback = SupplierFallback.class)
public interface SupplierClient {}
```

### Database

- One PostgreSQL database per service
- Database-per-service pattern
- Init scripts in `docker/postgres/init/`

### API Routes

- Format: `/api/v1/{resource}`
- Examples: `/api/v1/brands`, `/api/v1/suppliers`, `/api/v1/products`

---

## Configuration

- **Dev Profile**: Connects to localhost:5544 (PostgreSQL), localhost:5672 (RabbitMQ)
- **Prod Profile**: Connects to Docker network hostnames (postgres, rabbitmq)

Set via: `--spring.profiles.active=dev`

---

## Important Files

| File | Purpose |
|------|---------|
| `docker/compose/docker-compose.yml` | Service orchestration |
| `docker/compose/.env` | Environment variables |
| `config-server/src/main/resources/config/*.yaml` | Central config |
| `microservices/*/src/main/resources/application.yaml` | Service config |

---

## Safety Rules

1. **NEVER** commit secrets, credentials, `.env` files
2. **NEVER** modify `.gitignore` to include secrets
3. **DO NOT** delete code without explicit approval
4. **DO NOT** introduce breaking changes without testing

---

## Working on Code Changes

When implementing features:

1. Follow existing patterns in codebase
2. Use consistent naming (camelCase for Java, PascalCase for TypeScript)
3. Add tests for new functionality
4. Update documentation if needed
5. Verify build passes before completing

---

## Troubleshooting

See [troubleshooting.md](../troubleshooting.md) for common issues.

---

## References

- [Local Development](../local-development.md)
- [Docker Setup](../docker.md)
- [Backend Overview](../backend/overview.md)
- [Frontend Overview](../frontend/overview.md)