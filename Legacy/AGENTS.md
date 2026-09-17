---
description: Spring Boot microservices architecture with domain-driven design and event-driven patterns
---

# RetailManager Backend Microservices

## Project Context

**Microservices Backend** - Spring Boot 4 with Java 25, domain-driven design, and event-driven architecture for retail operations.

- **Location**: `backend/erphub-api/microservices/`
- **Infrastructure**: Docker Compose, PostgreSQL, RabbitMQ
- **Gateway**: Spring Cloud Gateway + Eureka Service Registry
- **Database**: PostgreSQL (separate database per service)
- **Port**: Gateway at `http://localhost:8080`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         Spring Cloud Gateway (Port 8080)                │
│         - Route to microservices                        │
│         - Request filtering                             │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌─────────┐   ┌──────────────┐   ┌──────────┐
    │ Product │   │   Customer   │   │   Sales  │
    │ Service │   │   Service    │   │ Service  │
    └─────────┘   └──────────────┘   └──────────┘
        │                 │                 │
    ┌─────────┐   ┌──────────────┐   ┌──────────┐
    │ Product │   │   Customer   │   │  Sales   │
    │   DB    │   │      DB      │   │    DB    │
    └─────────┘   └──────────────┘   └──────────┘
        
        RabbitMQ (Event Bus)
        - async event propagation
        - cross-service communication
```

## Microservices

### Core Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| `api-gateway/` | 8080 | Entry point, service routing |
| `service-registry/` | 8761 | Eureka service discovery |
| `config-server/` | 8888 | Centralized configuration |

### Domain Services

| Service | Purpose |
|---------|---------|
| `product-sv/` | Product catalog, specs, images |
| `category-sv/` | Category hierarchy and navigation |
| `brand-sv/` | Brand management |
| `supplier-sv/` | Supplier master data |
| `supplier-catalog-sv/` | Supplier price lists, import |
| `inventory-sv/` | Stock management, warehouses |
| `customer-sv/` | Customer profiles, preferences |
| `sales-sv/` | Sales orders, quotations |
| `purchase-sv/` | Purchase orders, vendor orders |
| `pricing-sv/` | Pricing rules, discounts |
| `location-sv/` | Warehouses, branches, distribution |
| `branch-sv/` | Branch management |
| `cash-sv/` | Cash flow, payments |
| `exchange-sv/` | Currency rates |
| `image-sv/` | Cloudinary integration |
| `tenant-sv/` | Multi-tenant support |
| `reporting-sv/` | Business reports, analytics |

## Service Structure

### Standard Package Layout

```
src/main/java/com/crishof/{service}/
├── controller/           # REST endpoints
│   └── {Resource}Controller.java
├── service/              # Business logic
│   ├── {Resource}Service.java
│   └── {Process}UseCase.java
├── repository/           # Data access
│   └── {Entity}Repository.java
├── model/                # JPA entities
│   └── {Entity}.java
├── dto/                  # Transfer objects
│   ├── {Entity}Dto.java
│   └── {Entity}Request.java
├── config/               # Spring beans
│   └── {Service}Config.java
├── event/                # Event classes
│   └── {Domain}Event.java
├── exception/            # Custom exceptions
│   └── {Domain}Exception.java
└── {Service}Application.java    # Main class
```

### Resource Configuration

```
src/main/resources/
├── application.yaml           # Default config
├── application-dev.yaml       # Development profile
├── application-prod.yaml      # Production profile
├── messages.properties         # I18n messages
└── db/
    └── migration/             # Flyway migrations (if used)
```

## Development Workflow

### Building & Running

```bash
# Build service
cd microservices/brand-sv
mvn clean package -DskipTests

# Run in dev mode (requires config-server, registry running)
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'

# Run tests
mvn test

# Build Docker image
docker build -t retailmanager/brand-sv:latest .
```

### Docker Compose

```bash
# Start all infrastructure
cd docker/compose
docker compose up -d

# View logs
docker compose logs -f api-gateway

# Stop services
docker compose down
```

## API Patterns

### RESTful Endpoints

```
GET    /api/{resource}              # List all
POST   /api/{resource}              # Create new
GET    /api/{resource}/{id}         # Get by ID
PUT    /api/{resource}/{id}         # Update
DELETE /api/{resource}/{id}         # Delete
GET    /api/{resource}/search       # Search/filter
```

### Response Format

```json
{
  "status": "SUCCESS",
  "data": { /* payload */ },
  "message": "Operation completed",
  "timestamp": "2026-05-12T12:00:00Z"
}
```

### Error Handling

```json
{
  "status": "ERROR",
  "message": "Resource not found",
  "errors": [{
    "field": "id",
    "message": "Product ID 123 does not exist"
  }],
  "timestamp": "2026-05-12T12:00:00Z"
}
```

## Event-Driven Communication

### Publishing Events

```java
@Service
public class OrderService {
  @Autowired private ApplicationEventPublisher eventPublisher;
  
  public Order createOrder(OrderRequest request) {
    Order order = new Order(request);
    eventPublisher.publishEvent(new OrderCreatedEvent(order));
    return order;
  }
}
```

### Subscribing to Events

```java
@Component
public class InventoryListener {
  @EventListener
  public void onOrderCreated(OrderCreatedEvent event) {
    // Update inventory based on order items
  }
}
```

## Database

### Multi-Database Strategy

Each service has **dedicated database**:

```sql
-- Service databases
CREATE DATABASE product_service;
CREATE DATABASE customer_service;
CREATE DATABASE sales_service;
-- ... one per service
```

### Migrations

- Use Flyway for schema versioning
- Location: `src/main/resources/db/migration/`
- Naming: `V1__Initial_schema.sql`

## Code Standards

### Java Best Practices
- Java 25 features (records, sealed classes, pattern matching)
- Strict null checking with `@Nullable` / `@NonNull`
- Immutable objects where possible
- Custom exceptions for business logic
- Logging with SLF4J + Logback

### Spring Conventions
- Use `@Service` for business logic
- Use `@Repository` for data access
- Use `@Configuration` for bean definitions
- Dependency injection via constructor
- Use `@Transactional` for transaction management

### REST Controller Standards
```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
  
  @GetMapping("/{id}")
  public ResponseEntity<ProductDto> getById(@PathVariable Long id) {
    // Implementation
  }
  
  @PostMapping
  public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductRequest req) {
    // Implementation
  }
}
```

## Debugging & Monitoring

### Logs
```bash
# View service logs
docker compose logs -f brand-sv

# Application logs location
logs/application.log
```

### Health Check
```bash
# Check service status
curl http://localhost:8080/actuator/health

# Service registry
http://localhost:8761  # Eureka dashboard
```

## Testing

### Test Structure
```
src/test/java/com/crishof/{service}/
├── controller/          # REST endpoint tests
├── service/             # Business logic tests
└── repository/          # Database tests
```

### Running Tests
```bash
mvn test
mvn test -Dtest=ProductServiceTest  # Single test
mvn test -Dtest=*ServiceTest        # Pattern matching
```

## When to Create New Service

1. **Separate domain**: Different bounded context
2. **Independent scaling**: Service needs own resources
3. **Different database**: Service manages own data
4. **Asynchronous operations**: Event-driven required
5. **Team ownership**: Clear service team responsible

## Important Notes

1. **No Direct Service Calls**: Always via Gateway
2. **Database Isolation**: No cross-service direct DB access
3. **Event Bus**: Use RabbitMQ for async communication
4. **Configuration**: Centralized in config-server
5. **Service Discovery**: Eureka registration automatic

## Troubleshooting

- **Service not found**: Check Eureka registry (port 8761)
- **Connection refused**: Ensure Docker containers running
- **Port conflicts**: Check Docker Compose port bindings
- **Database connection**: Verify PostgreSQL credentials in application.yaml