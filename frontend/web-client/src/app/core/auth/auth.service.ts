import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthStore, User } from './auth.store';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

// API Request/Response interfaces
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

interface BackendAuthResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: User['status'];
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface BackendAuthMeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: User['status'];
  tenantId: number;
}

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SignupResponse {
  message: string;
  userId?: string;
}

interface VerifyEmailRequest {
  email: string;
  code: string;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetResponse {
  message: string;
}

interface PasswordChangeRequest {
  token: string;
  password: string;
}

/**
 * AuthService - Handles authentication operations
 * 
 * Responsibilities:
 * - User login/logout
 * - User registration and email verification
 * - Password recovery and reset
 * - Token refresh
 * - Session management
 * 
 * Integration:
 * - Uses AuthStore for state management
 * - Uses TokenService for JWT management
 * - Communicates with backend via HTTP
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly store = inject(AuthStore);

  private readonly apiUrl = environment.authUrl;
  private readonly baseUrl = environment.apiUrl;

  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private readonly authHttpOptions = { withCredentials: true };

  constructor() {
    // Check if user already logged in from previous session
    this.checkExistingSession();
  }

  /**
   * Check if valid session exists on app startup
   * Prevents forcing users to login again unnecessarily
   */
  private checkExistingSession(): void {
    const token = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    
    if (token && !this.tokenService.isTokenExpired()) {
      // Token exists and valid - fetch current user
      this.getCurrentUser().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          if (this.store.currentUser()) {
            this.isLoggedInSubject.next(true);
            return;
          }

          // Token invalid - clear state
          this.tokenService.clearAccessToken();
          this.store.clear();
          this.isLoggedInSubject.next(false);
        }
      });
    } else if (token && this.tokenService.isTokenExpired()) {
      if (!refreshToken) {
        this.handleSessionExpired();
        return;
      }

      // Token expired - try to refresh
      this.refreshToken().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          this.handleSessionExpired();
        }
      });
    }
  }

  /**
   * User login
   * 
   * @param email - User email
   * @param password - User password
   * @returns Observable with AuthResponse
   */
  login(email: string, password: string): Observable<AuthResponse> {
    this.store.setIsLoading(true);
    this.store.clearError();

    const request: LoginRequest = { email, password };

    return this.http.post<BackendAuthResponse>(`${this.apiUrl}/login`, request, this.authHttpOptions).pipe(
      map((response) => this.mapAuthResponse(response)),
      tap(response => {
        // Store token
        this.tokenService.setAccessToken(response.accessToken);
        if (response.refreshToken) {
          this.tokenService.setRefreshToken(response.refreshToken);
        }
        
        // Update state
        this.store.setCurrentUser(response.user);
        this.store.setIsLoading(false);
        
        // Emit login event
        this.isLoggedInSubject.next(true);
      }),
      catchError(error => {
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.store.setError(message);
        this.store.setIsLoading(false);
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
   * User logout
   * Clears all auth state and tokens
   */
  logout(): Observable<void> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.clearAuthState();
      return of(void 0);
    }

    return this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken }, this.authHttpOptions).pipe(
      tap(() => {
        this.clearAuthState();
      }),
      catchError(error => {
        // Clear state even if logout endpoint fails
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout from all devices
   */
  logoutAll(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout-all`, {}, this.authHttpOptions).pipe(
      tap(() => {
        this.clearAuthState();
      }),
      catchError(error => {
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * User signup / registration
   * 
   * @param data - Registration data
   * @returns Observable with signup response
   */
  signup(data: SignupRequest): Observable<SignupResponse> {
    this.store.setIsLoading(true);
    this.store.clearError();

    const registrationUrl = `${this.apiUrl}/registration/signup`;

    return this.http.post<SignupResponse>(registrationUrl, data).pipe(
      tap(() => {
        this.store.setIsLoading(false);
      }),
      catchError(error => {
        const message = error.error?.message || 'Signup failed. Please try again.';
        this.store.setError(message);
        this.store.setIsLoading(false);
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
    * Verify email with code sent to user
    * 
    * @param email - User email address
    * @param code - 6-digit verification code
    * @returns Observable with AuthResponse
    */
  verifyEmail(email: string, code: string): Observable<AuthResponse> {
    this.store.setIsLoading(true);
    this.store.clearError();

    const request: VerifyEmailRequest = { email, code };
    const verificationUrl = `${this.apiUrl}/registration/verify-email`;

    return this.http.post<BackendAuthResponse>(verificationUrl, request).pipe(
      map((response) => this.mapAuthResponse(response)),
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
        if (response.refreshToken) {
          this.tokenService.setRefreshToken(response.refreshToken);
        }
        this.store.setCurrentUser(response.user);
        this.store.setIsLoading(false);
        this.isLoggedInSubject.next(true);
      }),
      catchError(error => {
        const message = error.error?.message || 'Verification failed. Please check your code.';
        this.store.setError(message);
        this.store.setIsLoading(false);
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
   * Resend verification email
   * 
   * @param email - User email to send verification to
   */
  resendVerification(email: string): Observable<SignupResponse> {
    const url = `${this.apiUrl}/registration/resend-verification`;
    return this.http.post<SignupResponse>(url, { email }).pipe(
      catchError(error => {
        const message = error.error?.message || 'Failed to resend verification email.';
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
   * Request password reset
   * Sends reset link to user's email
   * 
   * @param email - User email
   */
  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    const request: PasswordResetRequest = { email };
    return this.http.post<PasswordResetResponse>(
      `${this.apiUrl}/password/forgot`,
      request
    ).pipe(
      catchError(error => {
        const message = error.error?.message || 'Failed to send reset email.';
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
   * Reset password with token
   * Called after user clicks reset link and enters new password
   * 
   * @param token - Reset token from email link
   * @param password - New password
   */
  resetPassword(token: string, password: string): Observable<PasswordResetResponse> {
    const request: PasswordChangeRequest = { token, password };
    return this.http.post<PasswordResetResponse>(
      `${this.apiUrl}/password/reset`,
      request
    ).pipe(
      catchError(error => {
        const message = error.error?.message || 'Failed to reset password.';
        return throwError(() => ({ ...error, userMessage: message }));
      })
    );
  }

  /**
   * Refresh access token
   * Called when current token is near expiration
    * Uses refresh token sent in request body (backend DTO contract)
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      this.clearAuthState();
      return throwError(() => new Error('Refresh token not available'));
    }

    return this.http.post<BackendAuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }, this.authHttpOptions).pipe(
      map((response) => this.mapAuthResponse(response)),
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
        if (response.refreshToken) {
          this.tokenService.setRefreshToken(response.refreshToken);
        }
        this.store.setCurrentUser(response.user);
      }),
      catchError(error => {
        // Refresh failed - force logout
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user profile
   * Used to validate session and get user details
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<BackendAuthMeResponse>(`${this.apiUrl}/me`).pipe(
      map((response) => this.mapMeResponse(response)),
      tap(user => {
        this.store.setCurrentUser(user);
      }),
      catchError(error => {
        this.store.clear();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is logged in
   * Considers both token existence and expiration
   */
  isLoggedIn(): boolean {
    const token = this.tokenService.getAccessToken();
    return !!(token && !this.tokenService.isTokenExpired());
  }

  /**
   * Check if token will expire soon
   */
  isTokenExpiringSoon(minutesThreshold: number = 2): boolean {
    return this.tokenService.isTokenExpiringSoon(minutesThreshold);
  }

  /**
   * Get time until token expiration
   */
  getTimeUntilExpiration(): number {
    return this.tokenService.getTimeUntilExpiration();
  }

  /**
   * Clear all authentication state
   * Called on logout and session expiration
   */
  private clearAuthState(): void {
    this.tokenService.clearTokens();
    this.store.clear();
    this.isLoggedInSubject.next(false);
  }

  /**
   * Force local session cleanup when backend refresh/logout cannot be completed
   */
  handleSessionExpired(): void {
    this.clearAuthState();
  }

  private mapAuthResponse(response: BackendAuthResponse): AuthResponse {
    if (!response.firstName || !response.lastName || !response.email || !response.role) {
      throw new Error('Invalid auth DTO: missing required user fields');
    }

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: {
        id: response.userId,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        status: response.status,
        tenantId: this.getTenantIdFromToken(),
        createdAt: new Date().toISOString(),
      },
    };
  }

  private mapMeResponse(response: BackendAuthMeResponse): User {
    if (!response.firstName || !response.lastName || !response.email || !response.role) {
      throw new Error('Invalid /me DTO: missing required user fields');
    }

    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      status: response.status,
      tenantId: String(response.tenantId),
      createdAt: new Date().toISOString(),
    };
  }

  private getTenantIdFromToken(): string {
    const payload = this.tokenService.getTokenPayload();
    return payload?.tenantId || '';
  }
}
