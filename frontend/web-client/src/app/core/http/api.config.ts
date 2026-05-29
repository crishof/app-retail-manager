import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * ApiConfig - Centralized API configuration
 * 
 * Provides:
 * - Base URLs for different environments
 * - API endpoint constants
 * - Helper methods for URL construction
 * 
 * Usage:
 * const config = inject(ApiConfig);
 * const url = config.getEndpoint('/products');
 */
@Injectable({ providedIn: 'root' })
export class ApiConfig {
  readonly baseUrl = environment.apiUrl;
  readonly authUrl = environment.authUrl;

  // Common endpoints
  readonly endpoints = {
    // Auth
    auth: {
      login: `${this.authUrl}/login`,
      logout: `${this.authUrl}/logout`,
      logoutAll: `${this.authUrl}/logout-all`,
      refresh: `${this.authUrl}/refresh`,
      me: `${this.authUrl}/me`,
    },
    registration: {
      signup: `${this.baseUrl}/registration/signup`,
      verify: `${this.baseUrl}/registration/verify-email`,
      resend: `${this.baseUrl}/registration/resend-verification`,
    },
    password: {
      forgot: `${this.authUrl}/password/forgot`,
      reset: `${this.authUrl}/password/reset`,
    },
    // Catalog
    products: `${this.baseUrl}/products`,
    brands: `${this.baseUrl}/brands`,
    categories: `${this.baseUrl}/categories`,
    // Sales
    customers: `${this.baseUrl}/customers`,
    invoices: `${this.baseUrl}/invoices`,
    vouchers: `${this.baseUrl}/vouchers`,
    // Supply
    suppliers: `${this.baseUrl}/suppliers`,
    supplierPriceLists: `${this.baseUrl}/supplier-price-lists`,
    // Inventory
    stock: `${this.baseUrl}/stock`,
    transactions: `${this.baseUrl}/transactions`,
    // Settings
    companies: `${this.baseUrl}/companies`,
    branches: `${this.baseUrl}/branches`,
    cash: `${this.baseUrl}/cash`,
  };

  /**
   * Get endpoint URL
   * Useful for dynamic endpoint construction
   */
  getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Get auth endpoint URL
   */
  getAuthEndpoint(path: string): string {
    return `${this.authUrl}${path}`;
  }
}
