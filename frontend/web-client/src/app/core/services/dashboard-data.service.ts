import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { map, shareReplay, tap, switchMap, catchError } from 'rxjs/operators';

/**
 * Dashboard Metrics Model
 */
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  lastUpdated: Date;
}

/**
 * Sales Summary by Period
 */
export interface SalesSummary {
  period: string;
  revenue: number;
  orders: number;
  average: number;
}

/**
 * Top Products
 */
export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  trend: number;
}

/**
 * DashboardDataService - Aggregates and caches dashboard metrics
 * 
 * Responsibilities:
 * - Fetch dashboard metrics from backend
 * - Cache data with configurable TTL
 * - Provide real-time updates via refresh strategy
 * - Transform and aggregate data for display
 * 
 * Caching Strategy:
 * - First request: fetch from API
 * - Subsequent requests within TTL: return cached
 * - After TTL: auto-refresh in background
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache management
  private metricsCache$ = new BehaviorSubject<DashboardMetrics | null>(null);
  private lastUpdateTime = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Shared observables to prevent duplicate requests
  private metricsRequest$: Observable<DashboardMetrics> | null = null;
  private salesSummaryRequest$: Observable<SalesSummary[]> | null = null;
  private topProductsRequest$: Observable<TopProduct[]> | null = null;

  /**
   * Get dashboard metrics with caching
   * Auto-refreshes after cache TTL
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    const now = Date.now();
    const isCacheValid = now - this.lastUpdateTime < this.CACHE_TTL;

    if (isCacheValid && this.metricsRequest$) {
      return this.metricsRequest$;
    }

    // Fetch fresh data
    this.metricsRequest$ = this.http.get<DashboardMetrics>(
      `${this.apiUrl}/dashboard/metrics`
    ).pipe(
      tap(metrics => {
        this.lastUpdateTime = Date.now();
        this.metricsCache$.next(metrics);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch dashboard metrics:', error);
        // Return cached data if available, otherwise empty
        const cached = this.metricsCache$.value;
        return cached ? of(cached) : of(this.getDefaultMetrics());
      })
    );

    return this.metricsRequest$;
  }

  /**
   * Get sales summary by time period
   */
  getSalesSummary(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Observable<SalesSummary[]> {
    const params = new HttpParams().set('period', period);

    this.salesSummaryRequest$ = this.http.get<SalesSummary[]>(
      `${this.apiUrl}/dashboard/sales-summary`,
      { params }
    ).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch sales summary:', error);
        return of(this.getDefaultSalesSummary(period));
      })
    );

    return this.salesSummaryRequest$;
  }

  /**
   * Get top selling products
   */
  getTopProducts(limit: number = 5): Observable<TopProduct[]> {
    const params = new HttpParams().set('limit', limit);

    this.topProductsRequest$ = this.http.get<TopProduct[]>(
      `${this.apiUrl}/dashboard/top-products`,
      { params }
    ).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch top products:', error);
        return of(this.getDefaultTopProducts());
      })
    );

    return this.topProductsRequest$;
  }

  /**
   * Force refresh all cached data
   */
  refreshAllMetrics(): void {
    this.lastUpdateTime = 0;
    this.metricsRequest$ = null;
    this.salesSummaryRequest$ = null;
    this.topProductsRequest$ = null;
  }

  /**
   * Refresh specific metric
   */
  refreshMetrics(): Observable<DashboardMetrics> {
    this.lastUpdateTime = 0;
    this.metricsRequest$ = null;
    return this.getDashboardMetrics();
  }

  /**
   * Get cached metrics without triggering new request
   */
  getCachedMetrics(): DashboardMetrics | null {
    return this.metricsCache$.value;
  }

  /**
   * Setup auto-refresh at specified interval
   */
  setupAutoRefresh(intervalMs: number = 30000): Observable<DashboardMetrics> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.refreshMetrics())
    );
  }

  // Default/Mock data for fallback

  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      revenueChange: 0,
      ordersChange: 0,
      customersChange: 0,
      productsChange: 0,
      lastUpdated: new Date()
    };
  }

  private getDefaultSalesSummary(period: string): SalesSummary[] {
    const today = new Date();
    const data: SalesSummary[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      if (period === 'week') {
        date.setDate(date.getDate() - i);
      } else if (period === 'month') {
        date.setDate(date.getDate() - (i * 4));
      }

      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.random() * 10000,
        orders: Math.floor(Math.random() * 50),
        average: Math.random() * 500
      });
    }

    return data;
  }

  private getDefaultTopProducts(): TopProduct[] {
    return [
      {
        id: '1',
        name: 'Product 1',
        revenue: 5000,
        unitsSold: 150,
        trend: 12
      },
      {
        id: '2',
        name: 'Product 2',
        revenue: 4500,
        unitsSold: 120,
        trend: 8
      },
      {
        id: '3',
        name: 'Product 3',
        revenue: 3800,
        unitsSold: 95,
        trend: -5
      }
    ];
  }
}
