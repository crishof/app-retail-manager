import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthStore, User } from './auth.store';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

// API Request/Response interfaces
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

interface SignupResponse {
  message: string;
  userId?: string;
}

interface VerifyEmailRequest {
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
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private store = inject(AuthStore);

  private apiUrl = environment.authUrl;
  private baseUrl = environment.apiUrl;

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

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
    
    if (token && !this.tokenService.isTokenExpired()) {
      // Token exists and valid - fetch current user
      this.getCurrentUser().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          // Token invalid - clear state
          this.tokenService.clearAccessToken();
          this.store.clear();
          this.isLoggedInSubject.next(false);
        }
      });
    } else if (token && this.tokenService.isTokenExpired()) {
      // Token expired - try to refresh
      this.refreshToken().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          this.tokenService.clearAccessToken();
          this.store.clear();
          this.isLoggedInSubject.next(false);
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

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        // Store token
        this.tokenService.setAccessToken(response.accessToken);
        
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
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
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
    return this.http.post<void>(`${this.apiUrl}/logout-all`, {}).pipe(
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

    const registrationUrl = `${this.baseUrl}/registration/signup`;

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
   * @param code - 6-digit verification code
   * @returns Observable with AuthResponse
   */
  verifyEmail(code: string): Observable<AuthResponse> {
    this.store.setIsLoading(true);
    this.store.clearError();

    const request: VerifyEmailRequest = { code };
    const verificationUrl = `${this.baseUrl}/registration/verify-email`;

    return this.http.post<AuthResponse>(verificationUrl, request).pipe(
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
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
    const url = `${this.baseUrl}/registration/resend-verification`;
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
   * Uses refresh token (sent via HttpOnly cookie)
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        this.tokenService.setAccessToken(response.accessToken);
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
    this.tokenService.clearAccessToken();
    this.store.clear();
    this.isLoggedInSubject.next(false);
  }
}
