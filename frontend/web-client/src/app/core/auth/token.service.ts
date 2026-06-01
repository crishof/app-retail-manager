import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  uid: string;
  email: string;
  role: string;
  tenantId: string;
  status: string;
  exp: number;
  iat: number;
  sub: string;
}

/**
 * TokenService - Handles JWT token storage and expiration
 * 
 * Security considerations:
 * - Uses sessionStorage for access tokens (cleared on tab close)
 * - Uses sessionStorage for refresh token required by backend DTO contract
 * - Platform detection for SSR safety (no localStorage on server)
 * - Token expiration checking
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Store access token in sessionStorage
   */
  setAccessToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }
  }

  /**
   * Retrieve access token from sessionStorage
   */
  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove access token from sessionStorage
   */
  clearAccessToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    }
  }

  /**
   * Store refresh token in sessionStorage
   */
  setRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  /**
   * Retrieve refresh token from sessionStorage
   */
  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove refresh token from sessionStorage
   */
  clearRefreshToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Remove all auth tokens from sessionStorage
   */
  clearTokens(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const decoded: TokenPayload = jwtDecode(token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded: TokenPayload = jwtDecode(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get decoded token payload
   */
  getTokenPayload(): TokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 2 minutes)
   */
  isTokenExpiringSoon(minutesThreshold: number = 2): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;

    const now = new Date();
    const expiringTime = new Date(expiration.getTime() - minutesThreshold * 60 * 1000);
    return now >= expiringTime;
  }

  /**
   * Get time until token expiration in milliseconds
   */
  getTimeUntilExpiration(): number {
    const expiration = this.getTokenExpiration();
    if (!expiration) return 0;

    const now = new Date();
    const timeUntilExpiration = expiration.getTime() - now.getTime();
    return Math.max(0, timeUntilExpiration);
  }
}
