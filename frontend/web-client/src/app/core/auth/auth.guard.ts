import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * AuthGuard - Protects routes from unauthorized access
 * 
 * Usage in routes:
 * { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 * 
 * Behavior:
 * - If user is authenticated: allow access
 * - If user is not authenticated: redirect to login with return URL
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Store return URL so we can redirect after login
  router.navigate(['/landing/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * NoAuthGuard - Prevents authenticated users from accessing auth pages
 * Redirects logged-in users to dashboard
 * 
 * Usage in routes:
 * { path: 'landing/login', component: LoginComponent, canActivate: [noAuthGuard] }
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // User is already logged in, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};

/**
 * RoleGuard - Protects routes based on user role
 * 
 * Usage in routes:
 * { 
 *   path: 'admin', 
 *   component: AdminComponent, 
 *   canActivate: [roleGuard],
 *   data: { roles: ['ADMIN'] }
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/landing/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as string[];
  
  if (!allowedRoles) {
    // No role restriction defined
    return true;
  }

  // Check if user's role is in allowed roles
  const userRole = (authService as any).store.userRole?.();
  
  if (allowedRoles.includes(userRole)) {
    return true;
  }

  // User doesn't have required role
  console.warn(`User role '${userRole}' not in allowed roles:`, allowedRoles);
  router.navigate(['/']);
  return false;
};
