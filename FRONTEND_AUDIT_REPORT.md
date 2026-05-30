# 🏛️ ERPHUB FRONTEND COMPREHENSIVE AUDIT & SECURITY REPORT

**Date**: May 29, 2026  
**Project**: RetailManager - Angular 21 SaaS ERP Frontend  
**Status**: PRE-PRODUCTION REFACTOR REQUIRED  
**Health Score**: 6/10

---

## EXECUTIVE SUMMARY

The RetailManager frontend is a **technically sound but incomplete Angular 21 application** that requires **critical refactoring before MVP launch**. The application was built for the old microservices architecture and must be reconnected to the new `retailapi` monolith.

### Current State
- ✅ Modern Angular 21 stack with standalone components
- ✅ Well-organized service layer (15 services)
- ✅ Responsive Tailwind CSS styling
- ✅ Strict TypeScript 5.9 configuration
- ❌ **NO authentication system implemented**
- ❌ **NO HTTP interceptors for auth/error handling**
- ❌ **NO route guards or access control**
- ❌ **Broken SSR due to browser API usage without platform detection**
- ❌ **NO JWT token management**
- ❌ **NO landing page / auth flow**

### Critical Blockers for MVP
1. **No Authentication** - Users cannot log in; all routes are public
2. **No Security** - No token handling, no request signing, XSS risks
3. **Backend Disconnection** - Services point to old microservice URLs via API Gateway
4. **No State Management** - Session/tenant data scattered across components
5. **No Error Handling** - Global error handling missing; user-facing feedback absent
6. **SSR Broken** - localStorage/sessionStorage used without platform guards
7. **No Route Protection** - All routes accessible without verification
8. **No Loading States** - Poor UX during async operations

---

## 📊 CRITICAL RISKS & BLOCKERS

### 🔴 SEVERITY: CRITICAL

| Risk | Impact | Effort | Status |
|------|--------|--------|--------|
| No authentication system | Cannot deploy; no user isolation | High | 🟥 CRITICAL |
| JWT token handling missing | Security vulnerability; token expiration uncaught | High | 🟥 CRITICAL |
| Broken SSR on browser APIs | Application crashes on server render | Medium | 🟥 CRITICAL |
| No route guards | Unauthorized access to protected areas | Medium | 🟥 CRITICAL |
| All routes public | No multi-tenancy support | High | 🟥 CRITICAL |
| Backend URL hardcoding | Cannot switch environments; gateway outdated | Medium | 🟥 CRITICAL |

### 🟠 SEVERITY: HIGH

| Risk | Impact | Effort | Status |
|------|--------|--------|--------|
| No HTTP interceptors | No auth token injection; error handling missing | Medium | 🟠 HIGH |
| No global error handler | 500 errors crash app; poor UX | Low | 🟠 HIGH |
| No loading states | UI freezes during API calls | Low | 🟠 HIGH |
| Subscription memory leaks | App performance degrades over time | Medium | 🟠 HIGH |
| No environment configuration | Cannot manage dev/staging/prod URLs | Low | 🟠 HIGH |
| StockService empty | Inventory features incomplete | Low | 🟠 HIGH |

### 🟡 SEVERITY: MEDIUM

| Risk | Impact | Effort | Status |
|------|--------|--------|--------|
| localStorage used unsafely | Token theft via XSS; no CSRF protection | Medium | 🟡 MEDIUM |
| Template logic scattered | Hard to maintain; inconsistent patterns | Low | 🟡 MEDIUM |
| No form validation feedback | Poor user guidance on errors | Low | 🟡 MEDIUM |
| Unnecessary Bootstrap dependency | Conflicts with Tailwind; dead code | Low | 🟡 MEDIUM |
| No accessibility features | WCAG compliance issues | Medium | 🟡 MEDIUM |

---

## 🔐 SECURITY AUDIT REPORT

### Current Security Posture: **UNSAFE FOR PRODUCTION**

#### 1. **Authentication & Token Management**

**Finding**: NO JWT authentication implementation exists.

```typescript
// Current state: services use environment.gatewayUrl
private readonly _urlBase = `${environment.gatewayUrl}/api/v1/products`;
// No auth token attached to requests
// No token refresh logic
// No token expiration handling
```

**Vulnerabilities**:
- ❌ No Bearer token injection
- ❌ No token refresh handling
- ❌ No token expiration detection
- ❌ No logout/session invalidation
- ❌ No refresh token rotation

**Recommendations**:
```typescript
// ✅ Implement Auth Interceptor
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token && !req.url.includes('/auth/login')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        // Redirect to login
      }
      return throwError(() => error);
    })
  );
};
```

#### 2. **Token Storage Strategy**

**Current Risk**: No token storage mechanism exists.

**Vulnerabilities**:
- ❌ localStorage is vulnerable to XSS attacks
- ❌ sessionStorage is cleared on tab close (poor UX)
- ❌ No secure HttpOnly cookie support
- ❌ No token encryption
- ❌ No CSRF token management

**Recommendations** (Production-Grade):
```typescript
// Use secure storage pattern:
// 1. Access token: sessionStorage (15-min expiry)
// 2. Refresh token: secure HttpOnly cookie (7-day expiry)
// 3. User data: Signal-based in-memory store

export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  // ✅ SAFE: sessionStorage cleared on tab close
  setAccessToken(token: string): void {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }
  
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  // ✅ SAFER: HttpOnly cookie for refresh token (handled by backend)
  // Backend sets: Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict
}
```

#### 3. **XSS Prevention**

**Finding**: Unsafe template rendering patterns present.

**Current Code**:
```html
<!-- app/pages/home/home.component.html - OK -->
<!-- Using secure Angular directives: no innerHTML, proper binding -->
```

**Vulnerabilities**:
- ⚠️ Angular's built-in DomSanitizer not explicitly used in API response handling
- ⚠️ User input from forms not validated before submission
- ⚠️ API responses displayed without sanitization checks

**Recommendations**:
```typescript
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export class SafeContentComponent {
  constructor(private sanitizer: DomSanitizer) {}
  
  // ✅ Safe HTML rendering
  getSafeHtml(htmlContent: string): SafeHtml {
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      htmlContent
    ) || '';
  }
  
  // ✅ Safe URL binding
  getSafeUrl(url: string) {
    return this.sanitizer.sanitize(SecurityContext.URL, url);
  }
}
```

#### 4. **CSRF Protection**

**Finding**: No CSRF token mechanism exists.

**Vulnerabilities**:
- ❌ State-changing requests (POST/PATCH/DELETE) unprotected
- ❌ No CSRF token validation
- ❌ No SameSite cookie configuration

**Recommendations**:
```typescript
// Backend should implement:
// 1. Double-submit cookie pattern
// 2. SameSite=Strict on cookies
// 3. CSRF token validation on POST/PATCH/DELETE

// Frontend should:
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = document.querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content');
    
    if (token) {
      req = req.clone({
        setHeaders: {
          'X-CSRF-Token': token
        }
      });
    }
  }
  
  return next(req);
};
```

#### 5. **Environment Variable Exposure**

**Finding**: No sensitive data management strategy.

**Current Risk**:
```typescript
// src/environments/environment.ts - EXPOSED IN BUILD
export const environment = {
  production: false,
  gatewayUrl: 'http://localhost:8080', // Hardcoded
  ecommerceUrl: 'http://localhost:4300',
};
```

**Vulnerabilities**:
- ❌ API URLs hardcoded in source
- ❌ No environment-specific configuration
- ❌ No secrets management
- ❌ Cannot deploy to different environments

**Recommendations**:
```typescript
// Use Angular's built-in environment differentiation
// OR use environment variables via build configuration:

// .env.production
VITE_API_URL=https://api.retailmanager.es
VITE_AUTH_URL=https://auth.retailmanager.es

// In code:
const apiUrl = import.meta.env.VITE_API_URL;

// OR use base href for API routing (better):
// All relative calls route through app base
```

#### 6. **Input Validation & Sanitization**

**Finding**: Limited form validation; no centralized validation rules.

**Current Patterns**:
- Forms use Angular Reactive Forms (good)
- No custom validators for business logic
- No real-time validation feedback
- Server validation errors not displayed to user

**Recommendations**:
```typescript
// Create centralized validation service
export class ValidationService {
  // Email validation
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(control.value)
        ? null
        : { invalidEmail: true };
    };
  }
  
  // Spanish phone number
  static spanishPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return /^(?:\+34|0034|0)?[679]\d{8}$/.test(control.value.replace(/\s/g, ''))
        ? null
        : { invalidPhone: true };
    };
  }
  
  // Password strength
  static passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const hasUpperCase = /[A-Z]/.test(control.value);
      const hasLowerCase = /[a-z]/.test(control.value);
      const hasNumeric = /[0-9]/.test(control.value);
      const hasSpecialChar = /[!@#$%^&*]/.test(control.value);
      
      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
      
      return passwordValid
        ? null
        : { weakPassword: { hasUpperCase, hasLowerCase, hasNumeric } };
    };
  }
}
```

#### 7. **API Request Signing & Validation**

**Finding**: No request/response validation mechanism.

**Vulnerabilities**:
- ❌ No request signature validation
- ❌ API responses not schema-validated
- ❌ Man-in-the-middle attacks possible
- ❌ No request tamper detection

**Recommendations**:
```typescript
// Use Zod or similar for runtime validation
import { z } from 'zod';

// Define API response schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// In service:
getUserProfile(): Observable<User> {
  return this.http.get<User>('/api/v1/auth/me').pipe(
    map(data => UserSchema.parse(data)), // Runtime validation
    catchError(error => {
      if (error instanceof z.ZodError) {
        console.error('Invalid API response', error);
        return throwError(() => new Error('Invalid server response'));
      }
      return throwError(() => error);
    })
  );
}
```

#### 8. **SSR Security Issues**

**Finding**: Browser APIs used without platform detection.

**Critical Code**:
```typescript
// ❌ BREAKS ON SERVER
constructor() {
  this.user = JSON.parse(localStorage.getItem('user') || '{}');
}
```

**Vulnerabilities**:
- ❌ Application crashes during SSR
- ❌ No graceful fallback for server rendering
- ❌ Session state not preserved across renders

**Recommendations**:
```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export class SafeStorageService {
  private platformId = inject(PLATFORM_ID);
  
  getItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null;
  }
  
  setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }
  
  removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }
}
```

---

## 📡 BACKEND INTEGRATION AUDIT

### Backend Architecture Overview

**New Architecture**: Monolithic Spring Boot application (`retailapi`)

```
retailapi (Spring Boot 3.x)
├── auth module (AuthController, AuthServiceImpl, JwtService)
├── registration module (RegistrationController, EmailService)
├── password recovery module (PasswordRecoveryController)
├── catalog module (ProductController, etc.)
├── inventory module (StockController, etc.)
├── order management module (InvoiceController, etc.)
└── settings module (CompanyController, BranchController, etc.)
```

**Key Endpoint Base**: `/api/v1`  
**Auth Endpoint Base**: `/api/v1/auth`  
**API Gateway**: `http://localhost:8080`  
**Direct Service**: `http://localhost:9020` (retailapi)

### Current Frontend Integration Status

#### ✅ Correct Integrations
- ProductService → `/api/v1/products` ✓
- SupplierService → `/api/v1/suppliers` ✓
- CategoryService → `/api/v1/categories` ✓
- BrandService → `/api/v1/brands` ✓
- CustomerService → `/api/v1/customers` ✓

#### ❌ Missing/Broken Integrations
- **NO AuthService** - Critical missing
- **NO RegistrationService** - Signup not implemented
- **NO PasswordRecoveryService** - Password reset not implemented
- **NO RefreshTokenService** - Token refresh not implemented
- **StockService empty** - Inventory endpoints not mapped
- **NO InvitationService** - User invitations not implemented
- **NO SessionService** - User session tracking missing

### Backend JWT Configuration

**Token Structure**:
```json
{
  "uid": "user-uuid",
  "role": "ADMIN|OPERATOR|VIEWER",
  "status": "ACTIVE|INACTIVE|PENDING_VERIFICATION",
  "tenantId": "tenant-uuid",
  "sub": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Token Expiration**:
- Access Token: 15 minutes (900,000 ms)
- Refresh Token: 7 days (604,800,000 ms)

**Critical Endpoints** (Frontend must implement):

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

POST   /api/v1/registration/signup
POST   /api/v1/registration/verify-email
POST   /api/v1/registration/resend-verification

POST   /api/v1/password/forgot
POST   /api/v1/password/reset

GET    /api/v1/invitations/{token}/info
POST   /api/v1/invitations/accept
POST   /api/v1/admin/invitations
```

### Integration Disconnection Map

| Frontend Service | Current URL | Should Be |
|---|---|---|
| ProductService | ✓ Correct | `/api/v1/products` |
| SupplierService | ✓ Correct | `/api/v1/suppliers` |
| AuthService | ❌ Missing | `/api/v1/auth` |
| RegistrationService | ❌ Missing | `/api/v1/registration` |
| PasswordRecoveryService | ❌ Missing | `/api/v1/password` |
| TokenService | ❌ Missing | JWT management |
| StockService | ⚠️ Empty | `/api/v1/stock` |
| TransactionService | ⚠️ Empty | `/api/v1/transactions` |

---

## 🏗️ RECOMMENDED FRONTEND ARCHITECTURE

### Proposed Directory Structure

```
src/app/
├── core/                          # Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── auth.service.ts        # Authentication logic
│   │   ├── token.service.ts       # Token management
│   │   ├── auth.guard.ts          # Route protection
│   │   └── auth.interceptor.ts    # JWT injection
│   ├── error/
│   │   ├── error.service.ts       # Global error handling
│   │   └── error.interceptor.ts   # Error transformation
│   ├── http/
│   │   └── api.config.ts          # Centralized API configuration
│   └── models/
│       └── auth.models.ts         # Auth-related types
│
├── shared/                        # Reusable components & utilities
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── loading-spinner/
│   │   └── error-alert/
│   ├── ui/                        # Tailwind-based UI components
│   │   ├── button/
│   │   ├── input/
│   │   ├── form/
│   │   └── modal/
│   ├── pipes/
│   │   ├── safe-html.pipe.ts      # XSS prevention
│   │   └── currency.pipe.ts       # Currency formatting
│   └── utils/
│       ├── validators.ts          # Form validators
│       └── helpers.ts             # Utility functions
│
├── features/
│   ├── auth/                      # Authentication feature
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── password-recovery/
│   │   │   └── email-verification/
│   │   ├── auth.routes.ts
│   │   └── auth.module.ts (if needed)
│   │
│   ├── landing/                   # Landing page / public content
│   │   ├── pages/
│   │   │   └── landing-home/
│   │   └── landing.routes.ts
│   │
│   ├── dashboard/                 # Admin/user dashboard
│   │   ├── pages/
│   │   │   └── dashboard-home/
│   │   ├── dashboard.routes.ts
│   │   └── dashboard.module.ts
│   │
│   ├── catalog/                   # Products, brands, categories
│   │   ├── pages/
│   │   │   ├── products/
│   │   │   ├── product-detail/
│   │   │   ├── brands/
│   │   │   └── categories/
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   ├── brand.service.ts
│   │   │   └── category.service.ts
│   │   ├── models/
│   │   │   └── catalog.models.ts
│   │   └── catalog.routes.ts
│   │
│   ├── inventory/                 # Stock management
│   │   ├── pages/
│   │   │   └── stock-list/
│   │   ├── services/
│   │   │   └── stock.service.ts
│   │   ├── models/
│   │   │   └── inventory.models.ts
│   │   └── inventory.routes.ts
│   │
│   ├── operations/                # Sales, invoices, customers
│   │   ├── pages/
│   │   │   ├── invoices/
│   │   │   ├── customers/
│   │   │   └── vouchers/
│   │   ├── services/
│   │   │   ├── invoice.service.ts
│   │   │   └── customer.service.ts
│   │   ├── models/
│   │   │   └── operations.models.ts
│   │   └── operations.routes.ts
│   │
│   └── settings/                  # Configuration
│       ├── pages/
│       │   ├── companies/
│       │   ├── branches/
│       │   └── users/
│       ├── services/
│       │   ├── company.service.ts
│       │   ├── branch.service.ts
│       │   └── user.service.ts
│       └── settings.routes.ts
│
├── layout/
│   ├── app-shell/                 # Main layout container
│   └── public-shell/              # Landing/auth layout
│
├── app.routes.ts                  # Main routing configuration
├── app.config.ts                  # Application providers
└── app.component.ts               # Root component
```

### Layered Architecture Pattern

```
┌─────────────────────────────────────┐
│   PRESENTATION LAYER                │
│  Components & Page Components       │
│  (Smart & Dumb Components)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   STATE MANAGEMENT LAYER            │
│  Signals & Computed for local state │
│  Services for shared state          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   SERVICE LAYER                     │
│  Business logic, data transformation│
│  API integration patterns           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   HTTP & INTERCEPTOR LAYER          │
│  Auth injection, error handling     │
│  Request/response transformation    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   API GATEWAY / BACKEND             │
│  retailapi monolith (Spring Boot)   │
└─────────────────────────────────────┘
```

### State Management Strategy (Angular 21)

**Use Angular Signals + Computed Values** (No NgRx needed for MVP):

```typescript
// auth.store.ts - Centralized auth state
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // State signals
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal(false);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly tokenSignal = signal<string | null>(null);
  
  // Computed values
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  readonly canAdminister = computed(() => 
    this.currentUserSignal()?.role === 'ADMIN'
  );
  
  // Mutations
  setCurrentUser(user: User | null) {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(!!user);
  }
  
  setIsLoading(loading: boolean) {
    this.isLoadingSignal.set(loading);
  }
  
  setError(error: string | null) {
    this.errorSignal.set(error);
  }
}
```

---

## 🔐 AUTHENTICATION FLOW DESIGN

### Complete Auth Flow Diagram

```
LANDING PAGE
    │
    ├─→ LOGIN (existing user)
    │   ├─→ POST /api/v1/auth/login {email, password}
    │   ├─→ Backend validates & returns JWT access + refresh token
    │   ├─→ Frontend stores: accessToken (sessionStorage), refreshToken (HttpOnly cookie)
    │   ├─→ Sets AuthStore.currentUser with user data
    │   └─→ Navigate to /dashboard
    │
    ├─→ SIGNUP (new user)
    │   ├─→ POST /api/v1/registration/signup {email, password, name, company}
    │   ├─→ Backend creates user + sends verification email
    │   ├─→ Frontend shows: "Check your email for verification code"
    │   ├─→ USER_ENTERS_VERIFICATION_CODE
    │   ├─→ POST /api/v1/registration/verify-email {code}
    │   ├─→ Backend marks user verified + returns JWT
    │   ├─→ Frontend stores tokens & navigates to /dashboard
    │   └─→ Shows welcome message
    │
    ├─→ PASSWORD RECOVERY (forgot password)
    │   ├─→ POST /api/v1/password/forgot {email}
    │   ├─→ Backend sends password reset email with token
    │   ├─→ USER_CLICKS_RESET_LINK
    │   ├─→ Page validates token: GET /api/v1/password/verify/{token}
    │   ├─→ USER_ENTERS_NEW_PASSWORD
    │   ├─→ POST /api/v1/password/reset {token, newPassword}
    │   ├─→ Backend updates password
    │   └─→ Frontend redirects to /login with success message
    │
    └─→ DURING SESSION (logged in)
        ├─→ All API requests include: Authorization: Bearer {accessToken}
        ├─→ HTTP Interceptor injects token automatically
        ├─→ If 401 response:
        │   ├─→ Attempt token refresh: POST /api/v1/auth/refresh
        │   ├─→ If refresh succeeds: retry original request
        │   ├─→ If refresh fails: logout user → redirect to /login
        │   └─→ Show: "Session expired. Please log in again."
        ├─→ User clicks logout:
        │   ├─→ POST /api/v1/auth/logout
        │   ├─→ Clear tokens
        │   ├─→ Clear AuthStore.currentUser
        │   └─→ Redirect to /login
        └─→ Tab close / browser exit:
            └─→ sessionStorage cleared automatically (access token lost)
```

### 1. LANDING PAGE

**Purpose**: Unauthenticated users see marketing/entry point  
**Routes**:
- `/` → Redirects to `/landing`
- `/landing` → SaaS-oriented landing page
- `/landing/login` → Login form
- `/landing/signup` → Registration form
- `/landing/password-recovery` → Password reset request

**Features**:
- Clean, professional SaaS design
- Quick links: Login / Sign Up / Pricing / Features
- No authentication required
- Redirect authenticated users to /dashboard

### 2. LOGIN PAGE

**Route**: `/landing/login`

**Form Fields**:
```typescript
interface LoginForm {
  email: string;              // Email address (required, email format)
  password: string;           // Password (required, min 8 chars)
  rememberMe: boolean;        // Optional: remember for 30 days?
}
```

**Success Flow**:
```typescript
// Component
login(): void {
  this.authService.login(this.form.value).subscribe({
    next: (response) => {
      // 1. Store tokens
      this.tokenService.setAccessToken(response.accessToken);
      // Refresh token comes via HttpOnly cookie automatically
      
      // 2. Update auth state
      this.authStore.setCurrentUser(response.user);
      
      // 3. Navigate to dashboard
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.errorMessage = error.message; // "Invalid credentials"
      this.authStore.setError(error.message);
    }
  });
}
```

**Error Handling**:
- Invalid email/password → "Invalid credentials"
- User not verified → "Please verify your email first"
- Account inactive → "Your account is inactive. Contact support."
- Server error (5xx) → "Login service temporarily unavailable"

### 3. SIGNUP PAGE

**Route**: `/landing/signup`

**Form Fields**:
```typescript
interface SignupForm {
  email: string;              // (required, email format, unique check)
  password: string;           // (required, min 8, uppercase, lowercase, number)
  confirmPassword: string;    // (required, must match password)
  firstName: string;          // (required, min 2)
  lastName: string;           // (required, min 2)
  companyName: string;        // (required for B2B)
  acceptTerms: boolean;       // (required checkbox)
}
```

**Signup Flow**:
```
1. User fills form → client-side validation
2. Submit POST /api/v1/registration/signup
3. Backend response:
   - Success (201): "Verification email sent to {email}"
   - Conflict (409): "Email already registered"
   - Validation error (422): Show validation messages
   
4. Show verification code input
5. User enters 6-digit code
6. Submit POST /api/v1/registration/verify-email {code}
7. Backend response:
   - Success: Return JWT tokens
   - Invalid code: "Invalid code. Try again or resend."
   - Expired code: "Code expired. Request a new one."
   
8. If verified: Store tokens → Navigate to dashboard
9. If not verified: Show "Check your email" page with resend option
```

**Password Requirements** (Spain - Best Practice):
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)
- ✅ No dictionary words
- ✅ No personal information

### 4. PASSWORD RECOVERY PAGE

**Route**: `/landing/password-recovery`

**Step 1: Request Reset**
```
Email field (required, must exist in system)
→ POST /api/v1/password/forgot {email}
→ Backend sends reset email with token/link
→ Show: "Reset link sent to {email}"
```

**Step 2: Verify Token**
```
User clicks reset link in email: /landing/password-reset?token={resetToken}
→ Component validates token (optional verification request)
→ Show password reset form (only if token valid)
```

**Step 3: Reset Password**
```
New password + confirm password fields
→ POST /api/v1/password/reset {token, newPassword}
→ Backend updates password
→ Show: "Password updated successfully"
→ Redirect to /landing/login after 3 seconds
```

**Error Cases**:
- Token expired → "Reset link expired. Request a new one."
- Token invalid → "Invalid reset link. Request a new one."
- Server error → "Service temporarily unavailable"

---

## 🛣️ REFACTOR ROADMAP - PHASED IMPLEMENTATION

### Phase 1: Foundation & Security (Week 1-2)

**Goal**: Establish secure auth infrastructure

**Tasks**:
1. Create `AuthService` with login/logout/signup methods
2. Implement `TokenService` for JWT management
3. Create `AuthInterceptor` for token injection
4. Implement `AuthGuard` for route protection
5. Create `ErrorInterceptor` for global error handling
6. Setup centralized API configuration
7. Create `AuthStore` using Angular Signals
8. Add platform detection for SSR safety

**Deliverables**:
- ✅ Auth service fully functional
- ✅ Token refresh working
- ✅ Interceptors in place
- ✅ Route guards working
- ✅ ErrorInterceptor catching 401/403/500 responses

**Estimated Effort**: 16 hours

### Phase 2: Landing & Auth Pages (Week 2-3)

**Goal**: Create user-facing authentication UI

**Tasks**:
1. Create landing page shell
2. Implement login form + page
3. Implement signup form + page
4. Implement password recovery flow
5. Implement email verification flow
6. Create public auth layout (no navbar/sidebar)
7. Add loading states and spinners
8. Add form validation feedback
9. Add success/error notifications
10. Create mobile-responsive design

**Deliverables**:
- ✅ Professional landing page
- ✅ Working login flow end-to-end
- ✅ Working signup flow with email verification
- ✅ Working password recovery
- ✅ All forms validated and error-handled
- ✅ Mobile responsive

**Estimated Effort**: 24 hours

### Phase 3: Protected Dashboard & Layout (Week 3-4)

**Goal**: Create authenticated user dashboard

**Tasks**:
1. Create authenticated app shell/layout
2. Implement navbar with user menu
3. Implement sidebar with navigation
4. Create dashboard home page
5. Add user profile dropdown
6. Add logout flow
7. Add session expiration handling
8. Add "You are about to be logged out" warning (2 min before expiry)
9. Create breadcrumbs component
10. Add loading skeletons

**Deliverables**:
- ✅ Authenticated layout structure
- ✅ Dashboard home page
- ✅ Navigation working
- ✅ User menu with profile/logout
- ✅ Session warning before expiry

**Estimated Effort**: 20 hours

### Phase 4: API Reconnection & Services (Week 4-5)

**Goal**: Update all services to connect to new monolith

**Tasks**:
1. Verify all product endpoints
2. Verify all supplier endpoints
3. Verify all customer endpoints
4. Verify all category/brand endpoints
5. Create/complete stock service
6. Create tenant context service
7. Fix pagination handling
8. Add proper error handling to all services
9. Add retry logic with exponential backoff
10. Test all endpoints with real backend

**Deliverables**:
- ✅ All services correctly integrated
- ✅ No broken endpoints
- ✅ Proper error handling
- ✅ Retry logic implemented
- ✅ Tested against real backend

**Estimated Effort**: 24 hours

### Phase 5: Error Handling & Loading States (Week 5-6)

**Goal**: Professional error/loading UX

**Tasks**:
1. Create global error alert component
2. Create loading spinner component
3. Create toast notifications component
4. Implement error state for all pages
5. Add loading skeletons for all async components
6. Implement empty state pages
7. Add retry buttons on errors
8. Create error logging service
9. Add user-friendly error messages
10. Test error scenarios

**Deliverables**:
- ✅ Consistent error UI across app
- ✅ Loading states on all async operations
- ✅ Empty states handled
- ✅ Error logging for debugging
- ✅ User-friendly error messages

**Estimated Effort**: 16 hours

### Phase 6: Data Validation & Security (Week 6-7)

**Goal**: Comprehensive input validation

**Tasks**:
1. Create validation service with custom validators
2. Add real-time validation feedback
3. Implement server-side validation error handling
4. Create form error component
5. Add XSS prevention (DomSanitizer usage)
6. Add CSRF token handling (if needed)
7. Audit all localStorage/sessionStorage usage
8. Add environment-based API URLs
9. Create secrets management (no hardcoded values)
10. Security review and fixes

**Deliverables**:
- ✅ All forms validated
- ✅ XSS protection in place
- ✅ No secrets in code
- ✅ Proper storage strategy
- ✅ CSRF handled if applicable
- ✅ Environment-aware configuration

**Estimated Effort**: 20 hours

### Phase 7: Code Cleanup & Optimization (Week 7-8)

**Goal**: Production-ready codebase

**Tasks**:
1. Remove dead code and unused files
2. Remove Bootstrap dependency
3. Consolidate duplicate services
4. Fix all subscription leaks (unsubscribe patterns)
5. Optimize bundle size
6. Add proper tree-shaking
7. Implement lazy loading on feature routes
8. Performance audit
9. Add JSDoc comments to public APIs
10. Create deployment checklist

**Deliverables**:
- ✅ Clean codebase
- ✅ No unused dependencies
- ✅ Optimized bundle
- ✅ Lazy loading implemented
- ✅ Performance optimized
- ✅ Well documented

**Estimated Effort**: 24 hours

### Phase 8: Testing & QA (Week 8-9)

**Goal**: Comprehensive testing

**Tasks**:
1. Write unit tests for services
2. Write component tests for pages
3. Write integration tests for auth flow
4. Manual QA on all features
5. Cross-browser testing
6. Mobile responsiveness testing
7. Performance testing
8. Security testing
9. Load testing (if resources available)
10. Create test documentation

**Deliverables**:
- ✅ Unit tests (>80% coverage on services)
- ✅ Component tests for critical pages
- ✅ Integration tests for auth
- ✅ All manual QA passed
- ✅ Mobile responsive verified
- ✅ Performance acceptable

**Estimated Effort**: 24 hours

### Phase 9: Deployment & Monitoring (Week 9-10)

**Goal**: Production deployment

**Tasks**:
1. Configure production environment
2. Setup CI/CD pipeline
3. Create deployment documentation
4. Setup error monitoring (Sentry/similar)
5. Setup performance monitoring (web vitals)
6. Create rollback plan
7. Final security audit
8. Create user documentation
9. Staff training
10. Production deployment

**Deliverables**:
- ✅ Production environment configured
- ✅ CI/CD pipeline working
- ✅ Monitoring in place
- ✅ Rollback plan documented
- ✅ Deployed to production
- ✅ Monitoring showing healthy metrics

**Estimated Effort**: 16 hours

---

## **TOTAL ESTIMATED EFFORT: ~184 hours (~5-6 weeks for 1 full-time developer)**

### Timeline Assumptions:
- 1 senior developer (full-time)
- 40 hours/week
- ~160 hours available per month
- Includes testing, documentation, minor refactoring

### Risk Adjustments:
- Add 20% buffer for backend changes/integration issues
- Add 10% buffer for security issues discovered
- Add 5% buffer for client feedback changes

**Realistic Timeline**: **6-8 weeks** with a single developer

---

## 🧩 COMPONENT & MODULE RECOMMENDATIONS

### New Components to Create

#### 1. Auth Module Components

```typescript
// landing-home.component.ts - SaaS landing page
// Displays: Hero, Features, CTA buttons (Login/Signup)
// NO authentication required

// login.component.ts - Login form
// Form: email, password, remember-me checkbox
// Links: Signup, Password recovery

// signup.component.ts - Registration form
// Form: email, password, name, company
// Step 1: Form + submit
// Step 2: Email verification code input
// Links: Login, Help

// password-recovery.component.ts - Password reset request
// Step 1: Email input → "Check your email"
// Step 2: Reset form (after clicking email link)
// Password validation feedback

// email-verification.component.ts - Verification code input
// Display: "Enter 6-digit code sent to {email}"
// Resend button with countdown
// Error messages for invalid/expired codes
```

#### 2. Shared UI Components

```typescript
// button.component.ts - Tailwind button
// Variants: primary, secondary, danger
// Sizes: sm, md, lg
// States: loading, disabled
// Icons support

// input.component.ts - Text input
// Error state + message display
// Label, placeholder, required indicator
// Validation feedback

// form-field.component.ts - Form group wrapper
// Label, input, error message
// Accessibility (aria-labels)

// loading-spinner.component.ts - Loading indicator
// Overlay vs inline spinner
// Customizable size/color

// error-alert.component.ts - Error display
// Dismissable
// Retry button support
// Different severity levels

// toast-notification.component.ts - Toast messages
// Success, warning, error types
// Auto-dismiss after 5 seconds
// Stacking multiple toasts
```

### Services to Create/Update

```typescript
// Core Services

// auth.service.ts - Authentication logic
login(email, password): Observable<AuthResponse>
logout(): Observable<void>
signup(userData): Observable<RegistrationResponse>
verifyEmail(code): Observable<AuthResponse>
requestPasswordReset(email): Observable<void>
resetPassword(token, newPassword): Observable<void>
refreshToken(): Observable<AuthResponse>
getCurrentUser(): Observable<User>
isLoggedIn(): boolean

// token.service.ts - Token management
setAccessToken(token: string): void
getAccessToken(): string | null
setRefreshToken(token: string): void (HttpOnly cookie handled by backend)
getRefreshToken(): string | null
isTokenExpired(): boolean
clearTokens(): void
getTokenExpiration(): Date | null

// error.service.ts - Global error handling
handleError(error: HttpErrorResponse): void
getLastError(): HttpErrorResponse | null
clearError(): void
subscribe(callback): Subscription

// Feature Services

// product.service.ts - Already exists, verify endpoints
// supplier.service.ts - Already exists, verify endpoints
// customer.service.ts - Already exists, verify endpoints
// stock.service.ts - Complete the implementation
// transaction.service.ts - Complete the implementation
// invoice.service.ts - Verify or create
// user.service.ts - User management endpoints
```

### Deprecated/Removed Components

Remove or refactor:
- `EnConstruccionComponent` - Replace with actual pages
- Bootstrap imports - Switch to Tailwind only
- Old gateway integrations - Update to monolith

---

## ✅ PRODUCTION MVP CHECKLIST

### Pre-Launch Requirements

#### Authentication & Security
- [ ] ✅ AuthService fully implemented and tested
- [ ] ✅ JWT token handling with refresh logic
- [ ] ✅ Session storage strategy implemented (sessionStorage + HttpOnly cookie)
- [ ] ✅ AuthGuard protecting all private routes
- [ ] ✅ AuthInterceptor injecting tokens on all requests
- [ ] ✅ ErrorInterceptor handling 401/403/500 responses
- [ ] ✅ Logout flow clearing all tokens and state
- [ ] ✅ Password validation regex implementing Spain requirements
- [ ] ✅ XSS prevention: DomSanitizer usage in components
- [ ] ✅ CSRF tokens handled (if applicable)
- [ ] ✅ No hardcoded secrets in source code
- [ ] ✅ Environment-based API URLs (.env-based or build config)
- [ ] ✅ SSR-safe: isPlatformBrowser checks on browser APIs
- [ ] ✅ Security audit completed and issues resolved

#### User Experience
- [ ] ✅ Professional SaaS landing page
- [ ] ✅ Working login page with error handling
- [ ] ✅ Working signup page with email verification
- [ ] ✅ Working password recovery flow
- [ ] ✅ All forms have validation feedback
- [ ] ✅ Loading states on all async operations
- [ ] ✅ Error alerts for failed requests
- [ ] ✅ Success notifications for actions
- [ ] ✅ Mobile responsive design
- [ ] ✅ Touch-friendly buttons/inputs
- [ ] ✅ Accessible color contrast (WCAG AA minimum)
- [ ] ✅ Keyboard navigation working
- [ ] ✅ Screen reader compatible

#### Backend Integration
- [ ] ✅ All services correctly point to monolith endpoints
- [ ] ✅ ProductService verified working
- [ ] ✅ SupplierService verified working
- [ ] ✅ CustomerService verified working
- [ ] ✅ StockService completed and working
- [ ] ✅ InvoiceService completed and working
- [ ] ✅ TransactionService completed and working
- [ ] ✅ No broken 404 endpoints
- [ ] ✅ Pagination working correctly
- [ ] ✅ Filtering working correctly
- [ ] ✅ Error responses handled properly
- [ ] ✅ Tested against real backend

#### Code Quality
- [ ] ✅ No TypeScript compilation errors
- [ ] ✅ No console warnings/errors in production build
- [ ] ✅ No unused imports
- [ ] ✅ No dead code
- [ ] ✅ Consistent code formatting (Prettier)
- [ ] ✅ All files follow style guide
- [ ] ✅ Proper JSDoc comments on public APIs
- [ ] ✅ No hardcoded strings (all in components/configs)
- [ ] ✅ Tree-shaking enabled
- [ ] ✅ Lazy loading on feature routes

#### Performance
- [ ] ✅ Bundle size < 500KB (gzipped)
- [ ] ✅ Initial load time < 3 seconds
- [ ] ✅ No memory leaks (subscription cleanup)
- [ ] ✅ Change detection optimized (OnPush used)
- [ ] ✅ No unnecessary change detection cycles
- [ ] ✅ Images optimized
- [ ] ✅ Lazy loading implemented
- [ ] ✅ Caching strategy for API responses
- [ ] ✅ Web Vitals passing

#### Testing
- [ ] ✅ Unit tests for all services (>80% coverage)
- [ ] ✅ Component tests for critical pages
- [ ] ✅ E2E tests for auth flow
- [ ] ✅ Manual QA completed
- [ ] ✅ Cross-browser testing (Chrome, Firefox, Safari)
- [ ] ✅ Mobile testing (iOS, Android)
- [ ] ✅ Tested error scenarios
- [ ] ✅ Tested slow network conditions
- [ ] ✅ Tested offline behavior

#### Deployment
- [ ] ✅ Environment files configured (.env.production)
- [ ] ✅ API endpoints point to production server
- [ ] ✅ Build succeeds without warnings
- [ ] ✅ Deployment process documented
- [ ] ✅ Rollback plan documented
- [ ] ✅ CI/CD pipeline working
- [ ] ✅ Error monitoring setup (Sentry/similar)
- [ ] ✅ Performance monitoring setup
- [ ] ✅ Logs being captured
- [ ] ✅ Backup/disaster recovery plan

#### Compliance & Legal
- [ ] ✅ Terms of Service displayed
- [ ] ✅ Privacy Policy available
- [ ] ✅ GDPR compliance (user data collection)
- [ ] ✅ Cookies policy displayed (if applicable)
- [ ] ✅ Security audit completed
- [ ] ✅ Penetration testing completed (recommended)
- [ ] ✅ No exposed secrets/API keys
- [ ] ✅ Data encryption in transit (HTTPS only)

#### Documentation
- [ ] ✅ README updated with setup instructions
- [ ] ✅ API integration guide created
- [ ] ✅ Architecture documentation created
- [ ] ✅ Deployment guide created
- [ ] ✅ Developer setup guide created
- [ ] ✅ Troubleshooting guide created

---

## 🚀 CONCRETE REFACTOR TASKS

### CRITICAL TASKS (Start Immediately)

#### Task 1.1: Create AuthService
**Priority**: CRITICAL  
**Effort**: 4 hours  
**Dependencies**: None

**Steps**:
1. Create `src/app/core/auth/auth.service.ts`
2. Implement methods:
   - `login(email: string, password: string): Observable<AuthResponse>`
   - `logout(): Observable<void>`
   - `signup(data: SignupData): Observable<RegistrationResponse>`
   - `verifyEmail(code: string): Observable<AuthResponse>`
   - `requestPasswordReset(email: string): Observable<void>`
   - `resetPassword(token: string, password: string): Observable<void>`
   - `refreshToken(): Observable<AuthResponse>`
   - `getCurrentUser(): Observable<User>`

**Code Template**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        // Store token
        // Store user
        // Emit to currentUser$
      })
    );
  }
  
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        // Clear tokens
        // Clear user
        // Emit null
      })
    );
  }
  
  // ... other methods
}
```

---

#### Task 1.2: Create TokenService
**Priority**: CRITICAL  
**Effort**: 2 hours  
**Dependencies**: None

**Steps**:
1. Create `src/app/core/auth/token.service.ts`
2. Implement methods:
   - `setAccessToken(token: string): void`
   - `getAccessToken(): string | null`
   - `clearAccessToken(): void`
   - `isTokenExpired(): boolean`
   - `getTokenExpiration(): Date | null`

**Code Template**:
```typescript
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as jwtDecode from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private platformId = inject(PLATFORM_ID);
  private readonly TOKEN_KEY = 'access_token';
  
  setAccessToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }
  
  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }
  
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    
    const decoded: any = jwtDecode.jwtDecode(token);
    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
  }
  
  clearAccessToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }
}
```

---

#### Task 1.3: Create AuthInterceptor
**Priority**: CRITICAL  
**Effort**: 2 hours  
**Dependencies**: TokenService

**Steps**:
1. Create `src/app/core/auth/auth.interceptor.ts`
2. Implement token injection on all requests
3. Handle 401 responses with token refresh
4. Clear tokens and redirect to login on 401 + refresh failure

**Code Template**:
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = tokenService.getAccessToken();
  
  if (token && !req.url.includes('/auth/login')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Attempt refresh
        return authService.refreshToken().pipe(
          switchMap((response) => {
            tokenService.setAccessToken(response.accessToken);
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });
            return next(newReq);
          }),
          catchError(() => {
            // Refresh failed - logout
            authService.logout().subscribe();
            router.navigate(['/login']);
            return throwError(() => new Error('Session expired'));
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

#### Task 1.4: Create AuthGuard
**Priority**: CRITICAL  
**Effort**: 1 hour  
**Dependencies**: AuthService

**Steps**:
1. Create `src/app/core/auth/auth.guard.ts`
2. Protect all routes except `/landing/*`
3. Redirect unauthenticated users to `/landing/login`

**Code Template**:
```typescript
import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn()) {
    return true;
  }
  
  router.navigate(['/landing/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

---

#### Task 1.5: Create ErrorInterceptor
**Priority**: HIGH  
**Effort**: 2 hours  
**Dependencies**: None

**Steps**:
1. Create `src/app/core/http/error.interceptor.ts`
2. Catch all HTTP errors
3. Transform backend errors to user-friendly messages
4. Emit to error service for global handling

**Code Template**:
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorService } from './error.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'An unexpected error occurred';
      
      if (error.status === 0) {
        userMessage = 'Unable to connect to server';
      } else if (error.status === 400) {
        userMessage = error.error?.message || 'Invalid request';
      } else if (error.status === 403) {
        userMessage = 'You do not have permission to do this';
      } else if (error.status === 404) {
        userMessage = 'Resource not found';
      } else if (error.status === 409) {
        userMessage = error.error?.message || 'Request conflict';
      } else if (error.status === 422) {
        userMessage = 'Validation error. Check your input.';
      } else if (error.status >= 500) {
        userMessage = 'Server error. Please try again later.';
      }
      
      errorService.setError(userMessage);
      return throwError(() => ({ ...error, userMessage }));
    })
  );
};
```

---

#### Task 1.6: Update app.config.ts with Interceptors
**Priority**: CRITICAL  
**Effort**: 1 hour  
**Dependencies**: authInterceptor, errorInterceptor

**Steps**:
1. Update `src/app/app.config.ts`
2. Add interceptors to providers
3. Add guard to root provider

**Code**:
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...existing providers...
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
  ],
};
```

---

#### Task 2.1: Create AuthStore (Signals)
**Priority**: HIGH  
**Effort**: 2 hours  
**Dependencies**: None

**Steps**:
1. Create `src/app/core/auth/auth.store.ts`
2. Use Angular signals for state
3. Expose as readonly signals
4. Create computed values for derived state

**Code Template**:
```typescript
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal(false);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  
  // Readonly public signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  // Computed values
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  readonly canAdminister = computed(() => 
    this.currentUserSignal()?.role === 'ADMIN'
  );
  readonly userName = computed(() => 
    this.currentUserSignal()?.name || 'Guest'
  );
  
  // State mutations
  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(!!user);
  }
  
  setIsLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }
  
  setError(error: string | null): void {
    this.errorSignal.set(error);
  }
  
  clear(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.errorSignal.set(null);
  }
}
```

---

#### Task 2.2: Create Landing Page Shell
**Priority**: HIGH  
**Effort**: 4 hours  
**Dependencies**: None

**Steps**:
1. Create public auth layout (no navbar/sidebar)
2. Create `/landing` route with shell layout
3. Create landing home page component
4. Add routing for `/landing/login`, `/landing/signup`, `/landing/password-recovery`

**File Structure**:
```
src/app/features/auth/
├── pages/
│   ├── landing-home/
│   ├── login/
│   ├── signup/
│   ├── password-recovery/
│   └── email-verification/
├── auth.routes.ts
└── components/
    └── auth-layout/
```

---

#### Task 2.3: Create Login Page
**Priority**: CRITICAL  
**Effort**: 6 hours  
**Dependencies**: AuthService, AuthStore, error-alert component

**Steps**:
1. Create login form component
2. Add email + password validation
3. Connect to AuthService.login()
4. Handle success (store token, navigate)
5. Handle errors (display message)
6. Add "Forgot password?" link
7. Add "Sign up" link
8. Add loading state

**Code Template**:
```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 class="text-2xl font-bold mb-6">Login</h1>
        
        @if (store.error()) {
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
            {{ store.error() }}
          </div>
        }
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Email</label>
            <input formControlName="email" type="email" class="w-full px-4 py-2 border" />
          </div>
          
          <div class="mb-6">
            <label class="block text-gray-700 mb-2">Password</label>
            <input formControlName="password" type="password" class="w-full px-4 py-2 border" />
          </div>
          
          <button 
            type="submit" 
            [disabled]="store.isLoading() || form.invalid"
            class="w-full bg-blue-500 text-white py-2 rounded">
            @if (store.isLoading()) {
              <span>Logging in...</span>
            } @else {
              <span>Login</span>
            }
          </button>
        </form>
        
        <p class="mt-4 text-center">
          Don't have an account? <a href="/landing/signup" class="text-blue-500">Sign up</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  form: FormGroup;
  store = inject(AuthStore);
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  
  onSubmit(): void {
    this.store.setIsLoading(true);
    this.authService.login(this.form.value.email, this.form.value.password)
      .subscribe({
        next: (response) => {
          this.store.setCurrentUser(response.user);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.store.setError(error.userMessage || 'Login failed');
          this.store.setIsLoading(false);
        }
      });
  }
}
```

---

### HIGH PRIORITY TASKS (Week 1-2)

#### Task 3.1: Verify & Fix All API Service Endpoints
**Priority**: HIGH  
**Effort**: 8 hours  
**Dependencies**: None

**Current Status**:
- ProductService: ✓ Correct
- SupplierService: ✓ Correct
- CustomerService: ✓ Correct
- CategoryService: ✓ Correct
- BrandService: ✓ Correct
- **StockService**: ❌ EMPTY - needs implementation
- **TransactionService**: ❌ EMPTY - needs implementation
- **InvoiceService**: Needs verification

**Task**:
1. Review backend endpoints documentation
2. Update all service URLs to point to monolith `/api/v1/*`
3. Complete StockService with all stock endpoints
4. Complete TransactionService with transaction endpoints
5. Test each service against real backend

---

#### Task 3.2: Create Environment Configuration
**Priority**: HIGH  
**Effort**: 2 hours  
**Dependencies**: None

**Steps**:
1. Update `src/environments/environment.ts`
2. Update `src/environments/environment.prod.ts`
3. Remove hardcoded gateway URL
4. Use centralized API config service

**Code**:
```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  authUrl: 'http://localhost:8080/api/v1/auth',
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.retailmanager.es/api/v1',
  authUrl: 'https://api.retailmanager.es/api/v1/auth',
};

// core/http/api.config.ts
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiConfig {
  readonly baseUrl = environment.apiUrl;
  readonly authUrl = environment.authUrl;
  
  getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
```

---

#### Task 4.1: Remove Dead Code & Dependencies
**Priority**: MEDIUM  
**Effort**: 4 hours  
**Dependencies**: None

**Items to Remove**:
- [ ] Bootstrap from package.json (use Tailwind only)
- [ ] Unused jQuery dependency
- [ ] `EnConstruccionComponent` (replace with actual pages)
- [ ] Unused route definitions
- [ ] Unused services
- [ ] Temporary mock data
- [ ] Old microservice integrations

**Files to Remove/Update**:
- [ ] `node_modules/bootstrap` entry
- [ ] Bootstrap CSS imports
- [ ] jQuery usage
- [ ] Mock data files (if any)

---

### MEDIUM PRIORITY TASKS (Week 3-4)

#### Task 5.1: Create Signup Page with Email Verification
**Priority**: MEDIUM  
**Effort**: 8 hours  
**Dependencies**: RegistrationService (to be created)

#### Task 5.2: Create Password Recovery Flow
**Priority**: MEDIUM  
**Effort**: 6 hours  
**Dependencies**: PasswordRecoveryService (to be created)

#### Task 5.3: Create Error Alert & Loading Spinner Components
**Priority**: MEDIUM  
**Effort**: 4 hours  
**Dependencies**: None

#### Task 5.4: Create Dashboard Layout & Navbar
**Priority**: MEDIUM  
**Effort**: 6 hours  
**Dependencies**: AuthService, AuthStore

---

### LOW PRIORITY TASKS (Week 5-8)

#### Task 6.1: Add Form Validation Service
#### Task 6.2: Add Toast Notifications
#### Task 6.3: Setup Lazy Loading on Routes
#### Task 6.4: Performance Optimization
#### Task 6.5: Security Audit & Fixes
#### Task 6.6: Unit Test Creation
#### Task 6.7: E2E Test Creation
#### Task 6.8: Documentation

---

## 📋 NEXT IMMEDIATE STEPS

### Today (Sprint Start)

1. **Create directory structure** for `core/auth` and `features/auth`
2. **Start Task 1.1**: Implement AuthService
3. **Start Task 1.2**: Implement TokenService
4. **Start Task 1.3**: Implement AuthInterceptor
5. **Update app.config.ts** to add interceptor

### This Week

6. Start Task 1.4: AuthGuard
7. Start Task 1.5: ErrorInterceptor
8. Start Task 2.1: AuthStore
9. Start Task 2.2: Landing page shell
10. Start Task 2.3: Login page

### Key Success Metrics

- ✅ Users can log in and receive JWT token
- ✅ Token is injected on all protected API requests
- ✅ Unauthorized (401) responses trigger token refresh
- ✅ Session expiration redirects to login
- ✅ All API services point to correct monolith endpoints
- ✅ Application builds without TypeScript errors
- ✅ No console warnings in development

---

## 🎯 FINAL RECOMMENDATION

**This frontend is salvageable and has good bones.** The primary issue is **missing authentication infrastructure**, not architectural problems.

### Quick Wins (High Impact, Low Effort)
1. Implement AuthService + Interceptors (will unblock most issues)
2. Create landing + login pages (users can authenticate)
3. Fix environment configuration (proper endpoint mapping)
4. Add error handling (better UX)

### Investment Areas (High Impact, Higher Effort)
1. Create complete signup/password recovery flows
2. Implement proper state management with AuthStore
3. Comprehensive error handling across all services
4. Performance optimization and testing

### Timeline Reality
- **Minimum viable product**: 4-5 weeks (1 developer, full-time)
- **Production-ready**: 6-8 weeks (with testing, documentation, security audit)
- **High-quality SaaS product**: 8-10 weeks (with all polish, monitoring, CI/CD)

**Start immediately with Task 1.1 (AuthService) - it unblocks everything else.**

---

**Report Generated**: May 29, 2026  
**Prepared by**: Senior Angular Architect & SaaS Frontend Specialist  
**Status**: Ready for Refactor Kickoff
