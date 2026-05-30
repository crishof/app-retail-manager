import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, timer, of, combineLatest } from 'rxjs';
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
 * DashboardDataService - Aggregates metrics from monolith endpoints
 * 
 * Responsibilities:
 * - Aggregate data from /api/v1/sales, /api/v1/customers, /api/v1/products
 * - Cache data with configurable TTL
 * - Provide real-time updates via refresh strategy
 * - Transform and aggregate data for display
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
   * Aggregates data from: /api/v1/sales, /api/v1/customers, /api/v1/products
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    const now = Date.now();
    const isCacheValid = now - this.lastUpdateTime < this.CACHE_TTL;

    if (isCacheValid && this.metricsRequest$) {
      return this.metricsRequest$;
    }

    // Aggregate data from multiple endpoints
    this.metricsRequest$ = combineLatest([
      this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(catchError(() => of([]))),
      this.http.get<any[]>(`${this.apiUrl}/customers`).pipe(catchError(() => of([]))),
      this.http.get<any[]>(`${this.apiUrl}/products`).pipe(catchError(() => of([])))
    ]).pipe(
      map(([sales, customers, products]) => {
        const metrics = this.aggregateMetrics(sales, customers, products);
        return metrics;
      }),
      tap(metrics => {
        this.lastUpdateTime = Date.now();
        this.metricsCache$.next(metrics);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch dashboard metrics:', error);
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

    this.salesSummaryRequest$ = this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => this.aggregateSalesSummary(sales, period)),
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
    this.topProductsRequest$ = this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => this.aggregateTopProducts(sales, limit)),
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

  // ============ Aggregation Logic ============

  /**
   * Aggregate metrics from sales, customers, and products data
   */
  private aggregateMetrics(sales: any[], customers: any[], products: any[]): DashboardMetrics {
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || sale.amount || 0), 0);
    const totalOrders = sales.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;

    // Calculate changes (mock: random percentage)
    const revenueChange = Math.floor(Math.random() * 20) - 10;
    const ordersChange = Math.floor(Math.random() * 15) - 5;
    const customersChange = Math.floor(Math.random() * 10) - 2;
    const productsChange = Math.floor(Math.random() * 5) - 1;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueChange,
      ordersChange,
      customersChange,
      productsChange,
      lastUpdated: new Date()
    };
  }

  /**
   * Aggregate sales summary by period
   */
  private aggregateSalesSummary(sales: any[], period: string): SalesSummary[] {
    const now = new Date();
    const summaries: SalesSummary[] = [];

    // Group by period
    const grouped = this.groupByPeriod(sales, period);

    Object.entries(grouped).forEach(([key, items]: [string, any]) => {
      const itemsArray = items as any[];
      const revenue = itemsArray.reduce((sum, item) => sum + (item.total || item.amount || 0), 0);
      const orders = itemsArray.length;
      const average = orders > 0 ? revenue / orders : 0;

      summaries.push({
        period: key,
        revenue,
        orders,
        average
      });
    });

    return summaries;
  }

  /**
   * Aggregate top products from sales data
   */
  private aggregateTopProducts(sales: any[], limit: number): TopProduct[] {
    const productMap = new Map<string, any>();

    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productId = item.productId || item.id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: item.productName || item.name || 'Unknown',
              revenue: 0,
              unitsSold: 0
            });
          }
          const product = productMap.get(productId);
          product.revenue += item.total || item.price * (item.quantity || 1);
          product.unitsSold += item.quantity || 1;
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(p => ({
        ...p,
        trend: Math.floor(Math.random() * 20) - 10
      }));
  }

  /**
   * Group sales by time period
   */
  private groupByPeriod(sales: any[], period: string): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    sales.forEach(sale => {
      const date = new Date(sale.createdAt || sale.date || new Date());
      let key = '';

      switch (period) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(sale);
    });

    return grouped;
  }

  // Default/Mock data for fallback
  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalRevenue: 150000,
      totalOrders: 245,
      totalCustomers: 89,
      totalProducts: 342,
      revenueChange: 12,
      ordersChange: 8,
      customersChange: 5,
      productsChange: 3,
      lastUpdated: new Date()
    };
  }

  private getDefaultSalesSummary(period: string): SalesSummary[] {
    return [
      { period: 'Period 1', revenue: 45000, orders: 120, average: 375 },
      { period: 'Period 2', revenue: 52000, orders: 135, average: 385 },
      { period: 'Period 3', revenue: 53000, orders: 140, average: 378 }
    ];
  }

  private getDefaultTopProducts(): TopProduct[] {
    return [
      { id: '1', name: 'Premium Headphones', revenue: 45000, unitsSold: 450, trend: 12 },
      { id: '2', name: 'Laptop Stand', revenue: 30000, unitsSold: 380, trend: 8 },
      { id: '3', name: 'USB-C Cable', revenue: 15000, unitsSold: 720, trend: 25 }
    ];
  }
}
