import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

/**
 * User model - Represents authenticated user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  tenantId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  createdAt: string;
}

/**
 * AuthStore - Centralized authentication state using Angular Signals
 * 
 * Benefits:
 * - No subscription management needed (auto cleanup)
 * - Reactive updates automatically
 * - Computed values cached and invalidated only when dependencies change
 * - Better performance than RxJS BehaviorSubject for this use case
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Private signals - only modified through explicit methods
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal(false);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly isInitializedSignal = signal(false);

  // Public readonly signals - components subscribe via .asReadonly()
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isInitialized = this.isInitializedSignal.asReadonly();

  // Computed values - automatically reactive, cached until dependencies change
  readonly userRole = computed(() => this.currentUserSignal()?.role);
  
  readonly canAdminister = computed(() => 
    this.currentUserSignal()?.role === 'ADMIN'
  );

  readonly userDisplayName = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest';
  });

  readonly userEmail = computed(() => 
    this.currentUserSignal()?.email || ''
  );

  readonly isVerified = computed(() => 
    this.currentUserSignal()?.status === 'ACTIVE'
  );

  readonly tenantId = computed(() => 
    this.currentUserSignal()?.tenantId || null
  );

  readonly hasError = computed(() => 
    this.errorSignal() !== null
  );

  // State mutations - explicit methods for clarity
  
  /**
   * Set current user and mark as authenticated
   */
  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(!!user);
    this.errorSignal.set(null);
  }

  /**
   * Set loading state
   */
  setIsLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
  }

  /**
   * Set error message
   */
  setError(error: string | null): void {
    this.errorSignal.set(error);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Mark store as initialized
   * Used to prevent unnecessary API calls on app startup
   */
  setInitialized(initialized: boolean): void {
    this.isInitializedSignal.set(initialized);
  }

  /**
   * Clear all auth state
   * Called on logout or session expiration
   */
  clear(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.errorSignal.set(null);
    this.isLoadingSignal.set(false);
  }

  /**
   * Completely reset store (including initialized flag)
   */
  reset(): void {
    this.clear();
    this.isInitializedSignal.set(false);
  }
}
