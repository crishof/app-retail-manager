# FRONTEND REFACTOR - QUICK START GUIDE

## 📌 Before You Start

1. **Read FRONTEND_AUDIT_REPORT.md** - Full context of all issues and recommendations
2. **Backup current code** - `git commit -m "Pre-refactor backup"`
3. **Create feature branch** - `git checkout -b feat/auth-refactor`
4. **Install jwt-decode** - `npm install jwt-decode @types/jwt-decode`

---

## 🚀 CRITICAL PATH (Next 2 Days)

### Day 1: Foundation (Auth Infrastructure)

**Goal**: Get authentication working with token management

#### Step 1: Create Core Auth Directory
```bash
mkdir -p src/app/core/auth
mkdir -p src/app/core/http
mkdir -p src/app/core/models
```

#### Step 2: Create TokenService (30 min)
**File**: `src/app/core/auth/token.service.ts`

```typescript
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  uid: string;
  email: string;
  role: string;
  tenantId: string;
  exp: number;
  iat: number;
}

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
  
  clearAccessToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }
  
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    
    try {
      const decoded: TokenPayload = jwtDecode(token);
      const expirationTime = decoded.exp * 1000; // Convert to ms
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
  }
  
  getTokenExpiration(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      const decoded: TokenPayload = jwtDecode(token);
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
  
  getTokenPayload(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }
}
```

#### Step 3: Create AuthStore with Signals (1 hour)
**File**: `src/app/core/auth/auth.store.ts`

```typescript
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  tenantId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Private signals
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal(false);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  
  // Public readonly signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  // Computed values
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  readonly canAdminister = computed(() => 
    this.currentUserSignal()?.role === 'ADMIN'
  );
  readonly userDisplayName = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.firstName} ${user.lastName}` : 'Guest';
  });
  readonly userEmail = computed(() => this.currentUserSignal()?.email || '');
  readonly isVerified = computed(() => 
    this.currentUserSignal()?.status === 'ACTIVE'
  );
  
  // State mutations
  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(!!user);
    this.errorSignal.set(null);
  }
  
  setIsLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }
  
  setError(error: string | null): void {
    this.errorSignal.set(error);
  }
  
  clearError(): void {
    this.errorSignal.set(null);
  }
  
  clear(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.errorSignal.set(null);
    this.isLoadingSignal.set(false);
  }
}
```

#### Step 4: Create AuthService (1.5 hours)
**File**: `src/app/core/auth/auth.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthStore, User } from './auth.store';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

interface VerifyEmailRequest {
  code: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private store = inject(AuthStore);
  private apiUrl = environment.authUrl;
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  constructor() {
    // Check if user already logged in on service creation
    this.checkExistingSession();
  }
  
  login(email: string, password: string): Observable<AuthResponse> {
    this.store.setIsLoading(true);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    } as LoginRequest).pipe(
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
        this.store.setCurrentUser(response.user);
        this.isLoggedInSubject.next(true);
      }),
      catchError(error => {
        this.store.setError(error.error?.message || 'Login failed');
        this.store.setIsLoading(false);
        return throwError(() => error);
      })
    );
  }
  
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.tokenService.clearAccessToken();
        this.store.clear();
        this.isLoggedInSubject.next(false);
      }),
      catchError(error => {
        // Clear state even if logout fails
        this.tokenService.clearAccessToken();
        this.store.clear();
        this.isLoggedInSubject.next(false);
        return throwError(() => error);
      })
    );
  }
  
  signup(data: SignupRequest): Observable<{ message: string }> {
    this.store.setIsLoading(true);
    
    return this.http.post<{ message: string }>(
      `${this.apiUrl.replace('/auth', '')}/registration/signup`,
      data
    ).pipe(
      tap(() => {
        this.store.setIsLoading(false);
      }),
      catchError(error => {
        this.store.setError(error.error?.message || 'Signup failed');
        this.store.setIsLoading(false);
        return throwError(() => error);
      })
    );
  }
  
  verifyEmail(code: string): Observable<AuthResponse> {
    this.store.setIsLoading(true);
    
    return this.http.post<AuthResponse>(
      `${this.apiUrl.replace('/auth', '')}/registration/verify-email`,
      { code } as VerifyEmailRequest
    ).pipe(
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
        this.store.setCurrentUser(response.user);
        this.isLoggedInSubject.next(true);
      }),
      catchError(error => {
        this.store.setError(error.error?.message || 'Verification failed');
        this.store.setIsLoading(false);
        return throwError(() => error);
      })
    );
  }
  
  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/password/forgot`,
      { email }
    ).pipe(
      catchError(error => {
        this.store.setError(error.error?.message || 'Request failed');
        return throwError(() => error);
      })
    );
  }
  
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/password/reset`,
      { token, password }
    ).pipe(
      catchError(error => {
        this.store.setError(error.error?.message || 'Reset failed');
        return throwError(() => error);
      })
    );
  }
  
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
        this.store.setCurrentUser(response.user);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }
  
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.store.setCurrentUser(user);
      }),
      catchError(error => {
        this.store.clear();
        return throwError(() => error);
      })
    );
  }
  
  isLoggedIn(): boolean {
    const token = this.tokenService.getAccessToken();
    return !!(token && !this.tokenService.isTokenExpired());
  }
  
  private checkExistingSession(): void {
    const token = this.tokenService.getAccessToken();
    if (token && !this.tokenService.isTokenExpired()) {
      this.getCurrentUser().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          this.tokenService.clearAccessToken();
          this.store.clear();
        }
      });
    }
  }
}
```

#### Step 5: Create AuthInterceptor (1 hour)
**File**: `src/app/core/auth/auth.interceptor.ts`

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError, of } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Don't add token to login/signup requests
  if (req.url.includes('/auth/login') || 
      req.url.includes('/registration/signup') ||
      req.url.includes('/password/')) {
    return next(req);
  }
  
  // Inject token if available
  const token = tokenService.getAccessToken();
  if (token) {
    req = addToken(req, token);
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        
        return authService.refreshToken().pipe(
          switchMap(response => {
            isRefreshing = false;
            tokenService.setAccessToken(response.accessToken);
            
            // Retry original request with new token
            return next(addToken(req, response.accessToken));
          }),
          catchError(() => {
            isRefreshing = false;
            authService.logout();
            router.navigate(['/landing/login']);
            return throwError(() => new Error('Session expired'));
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

function addToken(req: any, token: string): any {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
```

#### Step 6: Create ErrorInterceptor (45 min)
**File**: `src/app/core/http/error.interceptor.ts`

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'An unexpected error occurred';
      
      switch (error.status) {
        case 0:
          userMessage = 'Unable to connect to server. Check your internet connection.';
          break;
        case 400:
          userMessage = error.error?.message || 'Invalid request. Please check your input.';
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'Resource not found.';
          break;
        case 409:
          userMessage = error.error?.message || 'Request conflict. This item may already exist.';
          break;
        case 422:
          userMessage = 'Validation error. Please check your input.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          userMessage = 'Server error. Please try again later.';
          break;
      }
      
      store.setError(userMessage);
      
      return throwError(() => ({
        ...error,
        userMessage
      }));
    })
  );
};
```

#### Step 7: Update app.config.ts (30 min)
**File**: `src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideClientHydration(),
    provideAnimationsAsync(),
  ],
};
```

---

### Day 2: Routes & Guards (4 hours)

#### Step 8: Create AuthGuard (30 min)
**File**: `src/app/core/auth/auth.guard.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
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

#### Step 9: Create Landing Routes (1 hour)
**File**: `src/app/features/auth/auth.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadChildren: () => import('./pages/landing-home/landing-home.routes').then(m => m.LANDING_ROUTES)
  },
  {
    path: 'landing/login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'landing/signup',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'landing/password-recovery',
    loadComponent: () => import('./pages/password-recovery/password-recovery.component').then(m => m.PasswordRecoveryComponent)
  }
];
```

#### Step 10: Update app.routes.ts (1 hour)
**File**: `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  // Auth routes (public)
  ...AUTH_ROUTES,
  
  // Redirect root to landing
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  
  // Protected routes (require auth)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  // ... other protected routes
  
  // 404
  { path: '**', redirectTo: 'landing' }
];
```

#### Step 11: Create Login Component (2 hours)
**File**: `src/app/features/auth/pages/login/login.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Login</h1>
          <p class="text-gray-600 mt-2">Sign in to RetailManager</p>
        </div>

        <!-- Error Alert -->
        @if (store.error()) {
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700">{{ store.error() }}</p>
          </div>
        }

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              formControlName="email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-xs text-red-600 mt-1">Please enter a valid email</p>
            }
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              formControlName="password"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-xs text-red-600 mt-1">Password is required</p>
            }
          </div>

          <!-- Remember me -->
          <div class="mb-6 flex items-center">
            <input
              id="remember"
              type="checkbox"
              formControlName="rememberMe"
              class="h-4 w-4 text-blue-600"
            />
            <label for="remember" class="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="store.isLoading() || form.invalid"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            @if (store.isLoading()) {
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">New to RetailManager?</span>
          </div>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center mb-4">
          <a routerLink="/landing/signup" class="text-blue-600 hover:text-blue-800 font-medium">
            Create an account
          </a>
        </p>

        <!-- Forgot Password Link -->
        <p class="text-center">
          <a routerLink="/landing/password-recovery" class="text-sm text-gray-600 hover:text-gray-800">
            Forgot your password?
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  store = inject(AuthStore);
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }
  
  onSubmit(): void {
    if (!this.form.valid) return;
    
    this.store.setIsLoading(true);
    this.authService.login(this.form.value.email, this.form.value.password)
      .subscribe({
        next: () => {
          this.store.setIsLoading(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.store.setIsLoading(false);
        }
      });
  }
}
```

---

## ✅ Quick Verification Checklist (After Day 2)

- [ ] `npm install jwt-decode @types/jwt-decode` successful
- [ ] `npm run build` compiles without errors
- [ ] No TypeScript errors in auth services
- [ ] Can navigate to `/landing/login`
- [ ] Login form displays without errors
- [ ] Auth interceptor configured in app.config.ts
- [ ] Token service handles SSR safely (isPlatformBrowser checks)
- [ ] Environment files correctly configured

---

## 🚦 Next Steps After Foundation

### Week 1 (Days 3-5)
1. Create signup page with email verification
2. Create password recovery page
3. Create landing home page
4. Add loading spinner component
5. Add error alert component

### Week 2 (Days 6-10)
1. Create authenticated dashboard layout
2. Fix all API service endpoints
3. Add route guards to all protected routes
4. Test backend authentication against real API
5. Implement token refresh logic

### Week 3-4
1. Add form validation service
2. Create all remaining pages
3. Performance optimization
4. Security audit
5. Testing

---

## 📞 Common Issues & Solutions

### Issue: "Cannot find module 'jwt-decode'"
```bash
npm install jwt-decode @types/jwt-decode
```

### Issue: "authInterceptor not injecting tokens"
Check that it's registered in `app.config.ts` with `withInterceptors()`

### Issue: "401 errors keep happening"
Verify that `refreshToken()` endpoint exists on backend and returns correct token format

### Issue: "sessionStorage is undefined on server"
Verify `isPlatformBrowser()` guard is used in TokenService

---

## 🎯 Success Criteria (End of Day 2)

✅ Users can open `/landing/login`  
✅ Login form submits to backend  
✅ JWT token stored in sessionStorage  
✅ Bearer token injected on API requests  
✅ 401 responses trigger token refresh  
✅ No TypeScript errors  
✅ Build succeeds  

**If all ✅, you're ready for signup/password recovery pages!**

---

**Created**: May 29, 2026  
**Duration**: 2 days (critical foundation)  
**Next Milestone**: Landing pages + email verification (Days 3-5)
