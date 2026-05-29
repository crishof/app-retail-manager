import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, catchError, of } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

export interface SalesTrendData {
  date: string;
  sales: number;
  orders: number;
}

export interface RevenueByCategoryData {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopProductData {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
}

export interface PaymentStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface InventoryAlertData {
  date: string;
  lowStock: number;
  outOfStock: number;
}

export interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
}

export interface SalesByPaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly apiUrl = '/api/v1/analytics';

  // Cache maps for tenant-aware caching
  private caches = new Map<string, Observable<any>>();
  private lastRefresh = new Map<string, number>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get sales trends data for a given date range
   */
  getSalesTrends(startDate: string, endDate: string): Observable<SalesTrendData[]> {
    const cacheKey = `sales-trends-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<SalesTrendData[]>(`${this.apiUrl}/sales-trends`, { params })
      .pipe(
        catchError(() => this.getMockSalesTrends()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get revenue by category for a given date range
   */
  getRevenueByCategory(startDate: string, endDate: string): Observable<RevenueByCategoryData[]> {
    const cacheKey = `revenue-category-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<RevenueByCategoryData[]>(`${this.apiUrl}/revenue-by-category`, { params })
      .pipe(
        catchError(() => this.getMockRevenueByCategory()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get top products for a given date range
   */
  getTopProducts(startDate: string, endDate: string, limit: number = 10): Observable<TopProductData[]> {
    const cacheKey = `top-products-${startDate}-${endDate}-${limit}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('limit', limit.toString());

    const request$ = this.http.get<TopProductData[]>(`${this.apiUrl}/top-products`, { params })
      .pipe(
        catchError(() => this.getMockTopProducts()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get payment status distribution
   */
  getPaymentStatus(startDate: string, endDate: string): Observable<PaymentStatusData[]> {
    const cacheKey = `payment-status-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<PaymentStatusData[]>(`${this.apiUrl}/payment-status`, { params })
      .pipe(
        catchError(() => this.getMockPaymentStatus()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get inventory alerts data
   */
  getInventoryAlerts(startDate: string, endDate: string): Observable<InventoryAlertData[]> {
    const cacheKey = `inventory-alerts-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<InventoryAlertData[]>(`${this.apiUrl}/inventory-alerts`, { params })
      .pipe(
        catchError(() => this.getMockInventoryAlerts()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get cash flow data
   */
  getCashFlow(startDate: string, endDate: string): Observable<CashFlowData[]> {
    const cacheKey = `cash-flow-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<CashFlowData[]>(`${this.apiUrl}/cash-flow`, { params })
      .pipe(
        catchError(() => this.getMockCashFlow()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Get sales by payment method
   */
  getSalesByPaymentMethod(startDate: string, endDate: string): Observable<SalesByPaymentMethodData[]> {
    const cacheKey = `sales-payment-method-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    const request$ = this.http.get<SalesByPaymentMethodData[]>(`${this.apiUrl}/sales-by-payment-method`, { params })
      .pipe(
        catchError(() => this.getMockSalesByPaymentMethod()),
        shareReplay(1)
      );

    this.caches.set(cacheKey, request$);
    this.lastRefresh.set(cacheKey, Date.now());
    return request$;
  }

  /**
   * Refresh all cached data for current tenant
   */
  refreshAllData(): void {
    const tenantId = this.getTenantId();
    Array.from(this.caches.keys()).forEach(key => {
      if (key.includes(tenantId)) {
        this.caches.delete(key);
        this.lastRefresh.delete(key);
      }
    });
  }

  /**
   * Clear cache for a specific dataset
   */
  clearCache(cacheKey: string): void {
    this.caches.delete(cacheKey);
    this.lastRefresh.delete(cacheKey);
  }

  /**
   * Get current tenant ID for isolation
   */
  private getTenantId(): string {
    return this.authStore.tenantId() || 'default';
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const lastTime = this.lastRefresh.get(cacheKey);
    if (!lastTime) return false;
    return Date.now() - lastTime < this.TTL;
  }

  // Mock data generators for fallback
  private getMockSalesTrends(): Observable<SalesTrendData[]> {
    const data: SalesTrendData[] = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 100) + 20
      });
    }
    return of(data);
  }

  private getMockRevenueByCategory(): Observable<RevenueByCategoryData[]> {
    return of([
      { category: 'Electronics', revenue: 150000, percentage: 35 },
      { category: 'Clothing', revenue: 120000, percentage: 28 },
      { category: 'Food & Beverage', revenue: 95000, percentage: 22 },
      { category: 'Home & Garden', revenue: 55000, percentage: 12 },
      { category: 'Others', revenue: 10000, percentage: 3 }
    ]);
  }

  private getMockTopProducts(): Observable<TopProductData[]> {
    return of([
      { productId: '1', productName: 'Premium Headphones', sales: 450, revenue: 45000 },
      { productId: '2', productName: 'Laptop Stand', sales: 380, revenue: 30400 },
      { productId: '3', productName: 'USB-C Cable', sales: 720, revenue: 7200 },
      { productId: '4', productName: 'Wireless Mouse', sales: 650, revenue: 19500 },
      { productId: '5', productName: 'Monitor', sales: 280, revenue: 56000 }
    ]);
  }

  private getMockPaymentStatus(): Observable<PaymentStatusData[]> {
    return of([
      { status: 'PAID', count: 450, percentage: 65 },
      { status: 'PENDING', count: 180, percentage: 26 },
      { status: 'OVERDUE', count: 65, percentage: 9 }
    ]);
  }

  private getMockInventoryAlerts(): Observable<InventoryAlertData[]> {
    const data: InventoryAlertData[] = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lowStock: Math.floor(Math.random() * 20) + 5,
        outOfStock: Math.floor(Math.random() * 10)
      });
    }
    return of(data);
  }

  private getMockCashFlow(): Observable<CashFlowData[]> {
    const data: CashFlowData[] = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        inflow: Math.floor(Math.random() * 50000) + 30000,
        outflow: Math.floor(Math.random() * 40000) + 15000
      });
    }
    return of(data);
  }

  private getMockSalesByPaymentMethod(): Observable<SalesByPaymentMethodData[]> {
    return of([
      { method: 'Credit Card', amount: 200000, percentage: 45 },
      { method: 'Bank Transfer', amount: 150000, percentage: 34 },
      { method: 'Cash', amount: 75000, percentage: 17 },
      { method: 'Digital Wallet', amount: 15000, percentage: 4 }
    ]);
  }
}
