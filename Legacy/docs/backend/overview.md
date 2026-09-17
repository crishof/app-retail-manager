# Backend Overview

## Technology Stack

- **Java 25**
- **Spring Boot 4**
- **Spring Cloud** (Gateway, Config, Eureka, Feign)
- **Spring Data JPA**
- **Resilience4j** (Circuit Breaker)

---

## Microservices

Located in `backend/erphub-api/microservices/`:

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| api-gateway | 8080 | - | Entry point, routing |
| service-registry | 8761 | - | Eureka server |
| config-server | 8888 | - | Central config |
| brand-sv | 9010 | brand_db | Brand management |
| category-sv | 9011 | category_db | Categories |
| product-sv | 9012 | product_db | Products |
| supplier-sv | 9013 | supplier_db | Suppliers |
| inventory-sv | 9014 | inventory_db | Stock |
| purchase-sv | 9015 | purchase_db | Purchases |
| sales-sv | 9016 | sales_db | Sales |
| cash-sv | 9017 | cash_db | Cash flow |
| customer-sv | 9018 | customer_db | Customers |
| location-sv | 9019 | location_db | Warehouses |
| pricing-sv | 9020 | pricing_db | Pricing |
| image-sv | 9021 | image_db | Images |
| exchange-sv | 9022 | exchange_db | Currency |
| reporting-sv | 9023 | reporting_db | Reports |

---

## Project Structure

```
microservices/{service}/
├── src/main/java/com/crishof/{service}/
│   ├── controller/     # REST endpoints
│   ├── service/        # Business logic
│   ├── repository/     # Data access
│   ├── model/          # Entities
│   ├── dto/            # Data transfer objects
│   ├── config/         # Configuration
│   └── exception/      # Error handling
├── src/main/resources/
│   ├── application.yaml
│   └── messages.properties
├── src/test/java/       # Tests
└── pom.xml
```

---

## API Conventions

All endpoints use prefix: `/api/v1/{resource}`

```
GET    /api/v1/brands
GET    /api/v1/brands/{id}
POST   /api/v1/brands
PUT    /api/v1/brands/{id}
DELETE /api/v1/brands/{id}
```

---

## Configuration

1. **Config Server**: YAML files in `config-server/src/main/resources/config/`
2. **Profile**: Set via `--spring.profiles.active=dev|prod`

---

## Inter-Service Communication

```java
@FeignClient(name = "supplier-sv")
public interface SupplierClient {
    @GetMapping("/api/v1/suppliers/{id}")
    SupplierDTO getSupplier(@PathVariable UUID id);
}
```

With Resilience4j circuit breaker in `BaseService.java`.

---

## Testing

```bash
mvn test
mvn verify
```

---

## Development

```bash
cd microservices/brand-sv
mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
```