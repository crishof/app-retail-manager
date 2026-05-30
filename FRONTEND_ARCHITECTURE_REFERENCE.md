# FRONTEND ARCHITECTURE REFERENCE

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER BROWSER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ANGULAR COMPONENT LAYER                                │  │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │  │
│  │  │ Login    │ Dashboard│ Products │ ...Protected... │  │  │
│  │  │ Component│Component │Component │ Components     │  │  │
│  │  └──────────┴──────────┴──────────┴──────────────────┘  │  │
│  │           │                                               │  │
│  │           ▼                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐  │
│  │  │ SERVICE LAYER (Business Logic)                      │  │
│  │  │ ┌──────────────┬──────────────┬─────────────────┐   │  │
│  │  │ │ AuthService  │ProductService│SupplierService │   │  │
│  │  │ │ TokenService │ CashService  │ CustomerService│   │  │
│  │  │ │ AuthStore    │ ...others    │ ...others      │   │  │
│  │  │ └──────────────┴──────────────┴─────────────────┘   │  │
│  │  └──────────────────────────────────────────────────────┘  │
│  │           │                                               │  │
│  │           ▼                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐  │
│  │  │ HTTP CLIENT + INTERCEPTORS                          │  │
│  │  │ ┌─────────────────────────────────────────────────┐ │  │
│  │  │ │ authInterceptor (inject Bearer token)           │ │  │
│  │  │ │ errorInterceptor (transform errors)             │ │  │
│  │  │ │ All requests route through interceptors         │ │  │
│  │  │ └─────────────────────────────────────────────────┘ │  │
│  │  └──────────────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────────┘
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ BROWSER STORAGE                                         │   │
│  │ ┌────────────────────┐     ┌─────────────────────────┐ │   │
│  │ │ sessionStorage     │     │ HttpOnly Cookie        │ │   │
│  │ │ access_token (JWT) │     │ refresh_token (backend)│ │   │
│  │ │ Cleared on tab close       HTTP-only, secure     │ │   │
│  │ └────────────────────┘     └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS Requests with
                            │ Authorization: Bearer {token}
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Gateway: http://localhost:8080                            │
│  ├─ POST /api/v1/auth/login                                   │
│  ├─ POST /api/v1/auth/logout                                  │
│  ├─ POST /api/v1/auth/refresh (token refresh)               │
│  ├─ GET  /api/v1/auth/me (validate user)                    │
│  ├─ POST /api/v1/registration/signup                         │
│  ├─ POST /api/v1/registration/verify-email                  │
│  ├─ POST /api/v1/password/forgot                            │
│  ├─ POST /api/v1/password/reset                             │
│  ├─ GET  /api/v1/products                                    │
│  ├─ GET  /api/v1/suppliers                                   │
│  ├─ GET  /api/v1/customers                                   │
│  └─ ... (60+ other endpoints)                                │
│                                                                 │
│  JWT Validation:                                              │
│  ├─ Extract token from Authorization header                  │
│  ├─ Validate signature                                       │
│  ├─ Check expiration                                         │
│  ├─ Verify user role & permissions                           │
│  └─ Set TenantContext for multi-tenancy                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Component Hierarchy

```
AppComponent (root)
│
├─ PublicShell (for /landing routes)
│  ├─ LandingHomeComponent
│  ├─ LoginComponent
│  ├─ SignupComponent
│  └─ PasswordRecoveryComponent
│
└─ AppShell (for authenticated routes)
   ├─ NavbarComponent
   │  ├─ Logo
   │  ├─ SearchBar
   │  └─ UserMenu
   │
   ├─ SidebarComponent
   │  └─ Navigation Links (based on role)
   │
   ├─ MainContentArea
   │  ├─ DashboardComponent
   │  ├─ ProductsComponent
   │  ├─ SuppliersComponent
   │  ├─ CustomersComponent
   │  └─ ... (feature components)
   │
   └─ FooterComponent
```

---

## 📁 File Structure (After Refactor)

```
src/app/
│
├── core/
│   ├── auth/
│   │   ├── auth.service.ts          ✅ Authentication logic
│   │   ├── auth.guard.ts            ✅ Route protection
│   │   ├── auth.interceptor.ts      ✅ JWT injection
│   │   ├── auth.store.ts            ✅ Auth state (Signals)
│   │   └── token.service.ts         ✅ Token management
│   │
│   ├── http/
│   │   ├── api.config.ts            ✅ Centralized URLs
│   │   ├── error.interceptor.ts     ✅ Global error handling
│   │   └── error.service.ts         ✅ Error state & notifications
│   │
│   └── models/
│       ├── auth.models.ts
│       ├── user.models.ts
│       └── api-response.models.ts
│
├── shared/
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── loading-spinner/
│   │   ├── error-alert/
│   │   └── toast-notification/
│   │
│   ├── ui/
│   │   ├── button/
│   │   ├── input/
│   │   ├── form-field/
│   │   └── modal/
│   │
│   ├── pipes/
│   │   └── safe-html.pipe.ts
│   │
│   └── utils/
│       ├── validators.ts
│       └── helpers.ts
│
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── landing-home/
│   │   │   │   ├── landing-home.component.ts
│   │   │   │   └── landing-home.component.html
│   │   │   ├── login/
│   │   │   │   └── login.component.ts
│   │   │   ├── signup/
│   │   │   │   └── signup.component.ts
│   │   │   ├── password-recovery/
│   │   │   │   └── password-recovery.component.ts
│   │   │   └── email-verification/
│   │   │       └── email-verification.component.ts
│   │   └── auth.routes.ts
│   │
│   ├── dashboard/
│   │   ├── pages/
│   │   │   └── dashboard-home/
│   │   └── dashboard.routes.ts
│   │
│   ├── catalog/
│   │   ├── pages/
│   │   │   ├── products/
│   │   │   ├── product-detail/
│   │   │   ├── brands/
│   │   │   └── categories/
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   ├── brand.service.ts
│   │   │   └── category.service.ts
│   │   └── catalog.routes.ts
│   │
│   ├── operations/
│   │   ├── pages/
│   │   │   ├── invoices/
│   │   │   ├── customers/
│   │   │   └── vouchers/
│   │   ├── services/
│   │   │   ├── invoice.service.ts
│   │   │   └── customer.service.ts
│   │   └── operations.routes.ts
│   │
│   └── inventory/
│       ├── pages/
│       │   └── stock-list/
│       ├── services/
│       │   └── stock.service.ts
│       └── inventory.routes.ts
│
├── layout/
│   ├── app-shell/
│   │   ├── app-shell.component.ts
│   │   └── app-shell.component.html
│   └── public-shell/
│       ├── public-shell.component.ts
│       └── public-shell.component.html
│
├── app.routes.ts
├── app.config.ts
└── app.component.ts
```

---

## 🔄 Authentication Flow Sequence

```
┌─────────────┐                                    ┌──────────────┐
│   Browser   │                                    │  Backend API │
└──────┬──────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. User enters credentials                      │
       ├──────────────────────────────────────────────▶ │
       │    POST /api/v1/auth/login                     │
       │    { email, password }                         │
       │                                                   │
       │                                   Validate       │
       │                                   Generate JWT   │
       │                                   Set HttpOnly   │
       │ 2. Return JWT + User                           │
       │ ◀───────────────────────────────────────────── │
       │    { accessToken, user, refreshToken }        │
       │                                                   │
   ✅ STORE                                             │
   - accessToken → sessionStorage                        │
   - refreshToken → HttpOnly cookie (automatic)          │
   - user data → AuthStore (Signal)                      │
       │                                                   │
       │ 3. API Request (with token)                    │
       ├──────────────────────────────────────────────▶ │
       │    GET /api/v1/products                        │
       │    Headers: Authorization: Bearer {token}      │
       │                                                   │
       │                                 Validate token   │
       │                                 Check role/perms │
       │ 4. Return data (200 OK)                        │
       │ ◀───────────────────────────────────────────── │
       │    [ products... ]                             │
       │                                                   │
   ✅ COMPONENT receives data                          │
       │                                                   │
       ├─ [Later] Token near expiry (< 2 min remaining] │
       │                                                   │
       │ 5. Refresh token (automatic)                   │
       ├──────────────────────────────────────────────▶ │
       │    POST /api/v1/auth/refresh                   │
       │    (Cookie sent automatically)                 │
       │                                                   │
       │                                 Generate new    │
       │                                 access token    │
       │ 6. Return new JWT                             │
       │ ◀───────────────────────────────────────────── │
       │    { accessToken }                             │
       │                                                   │
   ✅ UPDATE sessionStorage with new token               │
       │                                                   │
       │ 7. User logs out or session expires            │
       │                                                   │
       │ 8. Call logout                                 │
       ├──────────────────────────────────────────────▶ │
       │    POST /api/v1/auth/logout                   │
       │                                                   │
       │                                 Invalidate      │
       │                                 refresh token   │
       │ 9. Return (200 OK)                            │
       │ ◀───────────────────────────────────────────── │
       │                                                   │
   ✅ CLEAR
   - sessionStorage (accessToken)
   - AuthStore (user data)
   - Redirect to /landing/login
       │
```

---

## 🔐 Token Refresh Flow

```
AccessToken (15 min)  →  [Expires]  →  [401 Unauthorized]
                                            ↓
                                    [authInterceptor catches]
                                            ↓
                                    [POST refresh]  ← uses HttpOnly cookie
                                            ↓
                                    ┌─────────────────────┐
                                    │ Success (200)       │
                                    │ New accessToken     │
                                    └─────────────────────┘
                                            ↓
                                    [Store new token]
                                            ↓
                                    [Retry original request]
                                            ↓
                                    [Return data to component]

RefreshToken (7 days)  →  [Expires]  →  [Refresh fails]
                                            ↓
                                    [403 Forbidden]
                                            ↓
                                    [Force logout]
                                            ↓
                                    [Redirect to /landing/login]
                                            ↓
                                    "Session expired. Please log in."
```

---

## 🎯 State Management Pattern (Signals)

```typescript
// Instead of complex RxJS with Subjects:
// ❌ OLD PATTERN (RxJS BehaviorSubject)
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();

// ✅ NEW PATTERN (Angular Signals)
private currentUserSignal = signal<User | null>(null);
public currentUser = this.currentUserSignal.asReadonly();

// Benefits:
// - Simpler syntax
// - Automatic change detection optimization
// - No subscription leaks (no need to unsubscribe)
// - Better TypeScript inference
// - Computed values are cached & reactive
```

---

## 🚦 Route Protection

```
UNAUTHENTICATED USER:
  GET /landing        → ✅ ALLOWED (PublicShell)
  GET /landing/login  → ✅ ALLOWED (PublicShell)
  GET /dashboard      → ❌ DENIED → Redirect to /landing/login
  GET /products       → ❌ DENIED → Redirect to /landing/login

AUTHENTICATED USER:
  GET /landing        → ✅ ALLOWED (but usually redirect to /dashboard)
  GET /landing/login  → ✅ ALLOWED (but usually redirect to /dashboard)
  GET /dashboard      → ✅ ALLOWED (AppShell)
  GET /products       → ✅ ALLOWED (AppShell)
  
ADMIN USER:
  GET /admin/*        → ✅ ALLOWED (role check)
  
VIEWER USER:
  GET /admin/*        → ❌ DENIED (403 Forbidden from backend)
```

---

## 📊 Error Handling Flow

```
Component makes API call
       ↓
Service calls HttpClient
       ↓
authInterceptor adds Bearer token
       ↓
errorInterceptor added to chain
       ↓
HTTP request sent to backend
       ↓
┌─ Response 200 ─ ✅ Success ─ Data returned to component
│
├─ Response 400 ─ ❌ Validation Error
│  ├─ errorInterceptor transforms
│  └─ Error message → AuthStore
│     └─ Component displays error to user
│
├─ Response 401 ─ ❌ Unauthorized
│  ├─ authInterceptor catches
│  ├─ Attempts token refresh
│  ├─ If refresh succeeds: Retry original request
│  └─ If refresh fails: Force logout → Redirect to /login
│
├─ Response 403 ─ ❌ Forbidden
│  ├─ errorInterceptor transforms
│  └─ Error message: "You do not have permission"
│
├─ Response 404 ─ ❌ Not Found
│  ├─ errorInterceptor transforms
│  └─ Error message: "Resource not found"
│
├─ Response 500 ─ ❌ Server Error
│  ├─ errorInterceptor transforms
│  └─ Error message: "Server error. Try again later."
│
└─ Response 0 ─ ❌ Network Error
   ├─ errorInterceptor catches
   └─ Error message: "Unable to connect to server"

Component subscribes to error stream:
  store.error() signal
  ├─ Displays error alert to user
  ├─ Shows retry button (if applicable)
  └─ Logs to monitoring service
```

---

## 🔄 Lifecycle Hook Usage

```typescript
// ✅ RECOMMENDED (Signals - auto cleanup)
export class MyComponent {
  store = inject(AuthStore);
  data = computed(() => 
    this.store.currentUser()?.data  // Auto-reactive
  );
  // No subscriptions = no memory leaks
}

// ⚠️ ACCEPTABLE (if using RxJS)
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))  // Always cleanup!
      .subscribe(data => ...);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ❌ WRONG (memory leak)
export class MyComponent {
  ngOnInit() {
    this.service.getData().subscribe(...);  // Never unsubscribed!
  }
}
```

---

## 📋 Environment Configuration

```typescript
// ✅ RECOMMENDED
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  authUrl: 'http://localhost:8080/api/v1/auth',
};

// ✅ MORE SECURE (using build variables)
// .env.local
VITE_API_URL=http://localhost:8080/api/v1

// src/app/core/http/api.config.ts
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ NEVER DO THIS
const apiUrl = 'http://localhost:8080';  // Hardcoded, cannot change
const apiKey = 'secret-key-exposed';     // Secrets in code!
```

---

## 🎨 Component Communication Pattern

```
Parent Component
├─ Inputs: @Input() data: User[]
├─ Outputs: @Output() itemSelected = new EventEmitter<string>()
│
├─ Template
│  └─ <app-child [data]="data" (itemSelected)="onItemSelected($event)" />
│
└─ Service (Shared State)
   ├─ AuthStore (signals)
   ├─ AuthService (logic)
   └─ ErrorService (errors)

Child Component
├─ Receives: @Input() data
├─ Emits: @Output() itemSelected.emit(item.id)
└─ Uses: inject(AuthStore) for shared state
```

---

## 🔍 API Call Pattern (Recommended)

```typescript
// ✅ GOOD: Typed, error handling, loading state
export class ProductService {
  private http = inject(HttpClient);
  private store = inject(DataStore);
  
  getProducts(): Observable<Product[]> {
    this.store.setLoading(true);
    
    return this.http.get<Product[]>('/api/v1/products').pipe(
      tap(products => {
        this.store.setProducts(products);
        this.store.setLoading(false);
      }),
      catchError(error => {
        this.store.setError('Failed to load products');
        this.store.setLoading(false);
        return throwError(() => error);
      })
    );
  }
}

// Component usage
export class ProductsComponent {
  store = inject(DataStore);
  service = inject(ProductService);
  
  ngOnInit() {
    this.service.getProducts().subscribe();
    // Component automatically updates via signals
  }
}

// Template
<div>
  @if (store.isLoading()) {
    <app-loading-spinner />
  } @else if (store.products().length) {
    <div>{{ store.products() | json }}</div>
  } @else {
    <p>No products found</p>
  }
</div>
```

---

## ✅ Quality Checklist

```
BEFORE DEPLOYMENT:
□ All routes have @auth guards (except /landing/*)
□ All API calls go through interceptors
□ No console.log() in production code
□ No hardcoded API URLs
□ No localStorage (use sessionStorage + HttpOnly cookies)
□ No memory leaks (all subscriptions cleaned up or using signals)
□ All forms validated
□ Error handling on all services
□ Loading states on all async operations
□ Mobile responsive design
□ Accessibility (WCAG AA minimum)
□ No unused imports or dead code
□ TypeScript strict mode: no 'any'
□ Build succeeds: npm run build
□ No warnings in build output
```

---

**Last Updated**: May 29, 2026  
**Architecture Version**: 2.0 (Angular 21 with Signals)
