# Frontend Overview

## Technology Stack

- **Angular 17**
- **TypeScript 5**
- **RxJS**
- **Angular Material** (UI components)

---

## Project Structure

```
frontend/web-client/
├── src/
│   ├── app/
│   │   ├── core/           # Singleton services, guards
│   │   ├── shared/         # Shared components, pipes, directives
│   │   ├── features/       # Feature modules
│   │   │   ├── catalog/    # Products, categories, brands
│   │   │   ├── suppliers/  # Supplier management
│   │   │   ├── purchases/  # Purchase orders
│   │   │   ├── sales/      # Sales management
│   │   │   ├── customers/  # Customer data
│   │   │   ├── cash/       # Cash operations
│   │   │   └── settings/   # Configuration
│   │   ├── layout/         # Shell, navigation
│   │   └── app.component.ts
│   ├── assets/
│   ├── environments/       # Environment configs
│   └── styles/            # Global styles
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Key Commands

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

---

## API Integration

Services in `core/services/` use HttpClient:

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = 'http://localhost:8080/api/v1/products';

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }
}
```

---

## State Management

- Services with BehaviorSubject for local state
- RxJS for reactive data flow

---

## Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

---

## Code Generation

```bash
# Generate component
ng g c features/catalog/product-list

# Generate service
ng g s core/services/product

# Generate module
ng g m features/suppliers
```

---

## Type Safety

- Strongly typed models matching backend DTOs
- Avoid `any` - use proper interfaces
- Shared models in `core/models/`