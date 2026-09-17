# Ecommerce Frontend Agents

## Project Context

**RetailManager E-commerce Frontend** - Angular 21 standalone SPA for B2C/B2B product catalog, shopping cart, and checkout.

- **Location**: `frontend/ecommerce/`
- **Backend**: Spring microservices (Gateway at http://localhost:8080)
- **Dev Server**: http://localhost:4201 (Angular dev server)

## Task Categories

### 🛍️ Product Management Features
- Product catalog and search
- Product detail pages with specs and reviews
- Category navigation and filtering
- Stock availability display

### 🛒 Shopping Cart & Checkout
- Add/remove items from cart
- Cart persistence (localStorage or backend)
- Checkout flow with order review
- Payment gateway integration

### 👤 User Account
- User profile and preferences
- Order history and tracking
- Address book management
- Account settings

### 🎨 UI/UX Components
**Use `frontend-design` skill** for:
- Component design and layouts
- Page templates and interfaces
- Visual consistency and theming
- Accessibility-first implementations

### ♿ Accessibility & SEO
**Use `accessibility` skill** for WCAG AA compliance
**Use `seo` skill** for metadata and structured data

## Code Standards

### TypeScript
- Strict type checking (mandatory)
- No `any` type usage
- Full type annotations on public APIs

### Angular Components
- Standalone components only (no NgModules)
- Use `input()` and `output()` functions
- Apply `ChangeDetectionStrategy.OnPush`
- Implement `OnInit` lifecycle hook for initialization

### Templates
- Use native control flow: `@if`, `@for`, `@switch`
- Apply `class` and `style` bindings (not `[ngClass]`/`[ngStyle]`)
- Prefer reactive forms over template-driven
- Include semantic HTML and ARIA attributes

### State Management
- Signals for local component state
- `computed()` for derived values
- Pure state transformations
- Use `set()` or `update()` on signals (no `mutate`)

### Accessibility (WCAG AA)
- Minimum 4.5:1 color contrast
- Keyboard navigation throughout
- Screen reader support with proper semantics
- Focus management and visible indicators
- All interactive elements must be accessible

## Communication with Backend

### API Integration
- Use HttpClient with interceptors for auth/errors
- Gateway base: `http://localhost:8080`
- Microservices behind gateway (transparent routing)

### Key API Endpoints
```
Product Service:
  GET  /api/products           - List all products
  GET  /api/products/{id}      - Get product details
  POST /api/products/search    - Search with filters

Sales Service:
  POST /api/orders             - Create order
  GET  /api/orders/{id}        - Get order details

Customer Service:
  GET  /api/customers/{id}     - Get user profile
  PUT  /api/customers/{id}     - Update profile
```

## File Organization

```
src/app/
├── core/                  # Singletons, never lazy-load
│   ├── services/          # AuthService, ApiService, CartService
│   ├── guards/            # AuthGuard, RoleGuard
│   └── interceptors/      # ErrorHandler, AuthToken
├── shared/                # Reusable across features
│   ├── components/        # Button, Modal, Header, Footer
│   ├── pipes/             # CurrencyFormat, DateFormat
│   └── utils/             # Validators, Constants, Helpers
├── features/              # Lazy-loaded feature routes
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── account/
└── app.routes.ts          # Route definitions with lazy loading
```

## When to Use Skills

| Task | Skill |
|------|-------|
| Build new page or component UI | `frontend-design` |
| Audit accessibility compliance | `accessibility` |
| Add meta tags, structured data | `seo` |
| Type checking, module patterns | (no skill, built-in) |

## Troubleshooting References

- **Build issues**: See [SETUP.md](SETUP.md)
- **Component patterns**: See `.instructions.md` in this folder
- **Global guidelines**: See root `docs/agents/AGENTS.md`

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
