import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

/**
 * AuthInterceptor - Handles JWT token injection and 401 error handling
 * 
 * Responsibilities:
 * 1. Inject Bearer token on all requests (except login/signup/password routes)
 * 2. Catch 401 Unauthorized responses
 * 3. Attempt token refresh on 401
 * 4. Retry original request with new token
 * 5. Force logout if refresh fails
 * 
 * Security:
 * - Access token stored in sessionStorage (short-lived)
 * - Refresh token in HttpOnly cookie (automatic, server-only)
 * - Prevents multiple simultaneous refresh attempts
 * - Clears tokens on refresh failure
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Don't add token to auth-related requests
  const authExemptPaths = [
    '/auth/login',
    '/auth/logout',
    '/auth/registration/signup',
    '/auth/registration/verify-email',
    '/auth/registration/resend-verification',
    '/registration/signup',
    '/registration/verify-email',
    '/registration/resend-verification',
    '/password/forgot',
    '/password/reset'
  ];

  const isAuthRoute = authExemptPaths.some(path => req.url.includes(path));

  // Clone request and inject token if available and not auth route
  if (!isAuthRoute) {
    const token = tokenService.getAccessToken();
    if (token) {
      req = addToken(req, token);
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized (token expired or invalid)
      if (error.status === 401 && !isAuthRoute && !isRefreshing) {
        if (!tokenService.getRefreshToken()) {
          authService.handleSessionExpired();
          router.navigate(['/landing/login']);
          return throwError(() => ({
            ...error,
            userMessage: 'Your session has expired. Please log in again.',
          }));
        }

        isRefreshing = true;

        // Attempt to refresh token
        return authService.refreshToken().pipe(
          switchMap(response => {
            isRefreshing = false;
            
            // Store new token
            tokenService.setAccessToken(response.accessToken);

            // Retry original request with new token
            return next(addToken(req, response.accessToken));
          }),
          catchError((refreshError: HttpErrorResponse) => {
            isRefreshing = false;

            // Refresh failed - clear local session and redirect
            authService.handleSessionExpired();
            router.navigate(['/landing/login']);

            return throwError(() => ({
              ...refreshError,
              status: 401,
              userMessage: 'Your session has expired. Please log in again.',
            }));
          })
        );
      }

      return throwError(() => error);
    })
  );
};

/**
 * Helper function to add Bearer token to request headers
 */
function addToken(req: any, token: string): any {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
