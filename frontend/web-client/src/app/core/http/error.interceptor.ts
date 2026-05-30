import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { catchError, throwError } from 'rxjs';

/**
 * ErrorInterceptor - Global HTTP error handling
 * 
 * Responsibilities:
 * 1. Transform HTTP error responses to user-friendly messages
 * 2. Store error in AuthStore for display to user
 * 3. Log errors for debugging
 * 4. Provide consistent error handling across the application
 * 
 * Error handling strategy:
 * - 400: Validation errors (show to user)
 * - 403: Permission denied (show specific message)
 * - 404: Resource not found (show specific message)
 * - 409: Conflict (usually duplicate entry)
 * - 422: Validation error (show to user)
 * - 500+: Server error (generic message, log details)
 * - 0: Network error (show to user)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'An unexpected error occurred. Please try again.';
      let logMessage = `HTTP Error ${error.status}: ${error.statusText}`;

      // Determine user-friendly message based on status code
      switch (error.status) {
        case 0:
          // Network error (CORS, no internet, etc.)
          userMessage = 'Unable to connect to server. Please check your internet connection.';
          logMessage = 'Network error or CORS issue';
          break;

        case 400:
          // Bad request / validation error
          userMessage = error.error?.message || 'Invalid request. Please check your input.';
          logMessage = `Validation error: ${error.error?.message || 'Unknown'}`;
          break;

        case 401:
          // Unauthorized - handled by AuthInterceptor
          // This shouldn't appear to user unless refresh also fails
          userMessage = 'Your session has expired. Please log in again.';
          logMessage = 'Unauthorized - session expired';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          userMessage = 'You do not have permission to perform this action.';
          logMessage = 'Forbidden - insufficient permissions';
          break;

        case 404:
          // Not found
          userMessage = 'The requested resource was not found.';
          logMessage = `Resource not found: ${req.url}`;
          break;

        case 409:
          // Conflict - usually duplicate entry or state conflict
          userMessage = error.error?.message || 'This item already exists or operation cannot be completed.';
          logMessage = `Conflict: ${error.error?.message || 'Unknown'}`;
          break;

        case 422:
          // Unprocessable entity - validation error from backend
          userMessage = error.error?.message || 'Please check your input and try again.';
          logMessage = `Validation error: ${error.error?.message || 'Unknown'}`;
          break;

        case 500:
          // Internal server error
          userMessage = 'Server error. Please try again later.';
          logMessage = 'Internal server error - check backend logs';
          break;

        case 502:
        case 503:
        case 504:
          // Gateway error or service unavailable
          userMessage = 'Server is temporarily unavailable. Please try again later.';
          logMessage = `Server unavailable (${error.status})`;
          break;

        default:
          // Other errors
          if (error.status >= 500) {
            userMessage = 'Server error. Please try again later.';
            logMessage = `Server error (${error.status}): ${error.statusText}`;
          } else if (error.status >= 400) {
            userMessage = error.error?.message || 'Request failed. Please try again.';
            logMessage = `Client error (${error.status}): ${error.statusText}`;
          }
      }

      // Log error for debugging (only in development or for critical errors)
      console.error(logMessage, {
        status: error.status,
        message: error.error?.message,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // Store error message for display to user
      store.setError(userMessage);

      // Return error with user message added
      return throwError(() => ({
        ...error,
        userMessage,
        logMessage
      }));
    })
  );
};
