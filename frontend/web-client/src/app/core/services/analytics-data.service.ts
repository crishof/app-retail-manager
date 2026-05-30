import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, shareReplay, catchError, of, map } from 'rxjs';
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
  private readonly apiUrl = `${environment.apiUrl}`;

  // Cache maps for tenant-aware caching
  private caches = new Map<string, Observable<any>>();
  private lastRefresh = new Map<string, number>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get sales trends data for a given date range
   * Aggregates from /api/v1/sales endpoint
   */
  getSalesTrends(startDate: string, endDate: string): Observable<SalesTrendData[]> {
    const cacheKey = `sales-trends-${startDate}-${endDate}-${this.getTenantId()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.caches.get(cacheKey)!;
    }

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregateSalesTrends(sales, startDate, endDate)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregateRevenueByCategory(sales, startDate, endDate)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregateTopProducts(sales, startDate, endDate, limit)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregatePaymentStatus(sales, startDate, endDate)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/products`)
      .pipe(
        map(products => this.aggregateInventoryAlerts(products, startDate, endDate)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregateCashFlow(sales, startDate, endDate)),
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

    const request$ = this.http.get<any[]>(`${this.apiUrl}/sales`)
      .pipe(
        map(sales => this.aggregateSalesByPaymentMethod(sales, startDate, endDate)),
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

  // ============ Aggregation Methods ============

  private aggregateSalesTrends(sales: any[], startDate: string, endDate: string): SalesTrendData[] {
    const data: SalesTrendData[] = [];
    const dateMap = new Map<string, { sales: number; orders: number }>();

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate) {
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { sales: 0, orders: 0 });
        }
        const entry = dateMap.get(dateStr)!;
        entry.sales += sale.total || sale.amount || 0;
        entry.orders += 1;
      }
    });

    // Fill missing dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = dateMap.get(dateStr) || { sales: 0, orders: 0 };
      data.push({
        date: dateStr,
        sales: entry.sales,
        orders: entry.orders
      });
    }

    return data;
  }

  private aggregateRevenueByCategory(sales: any[], startDate: string, endDate: string): RevenueByCategoryData[] {
    const categoryMap = new Map<string, number>();
    let totalRevenue = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate && sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const category = item.category || item.productCategory || 'Uncategorized';
          const itemRevenue = item.total || item.price * (item.quantity || 1);
          categoryMap.set(category, (categoryMap.get(category) || 0) + itemRevenue);
          totalRevenue += itemRevenue;
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
    }));
  }

  private aggregateTopProducts(sales: any[], startDate: string, endDate: string, limit: number): TopProductData[] {
    const productMap = new Map<string, { name: string; sales: number; revenue: number }>();

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate && sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productId = item.productId || item.id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              name: item.productName || item.name || 'Unknown',
              sales: 0,
              revenue: 0
            });
          }
          const product = productMap.get(productId)!;
          product.sales += item.quantity || 1;
          product.revenue += item.total || item.price * (item.quantity || 1);
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private aggregatePaymentStatus(sales: any[], startDate: string, endDate: string): PaymentStatusData[] {
    const statusMap = { PAID: 0, PENDING: 0, OVERDUE: 0 };

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate) {
        const status = this.mapSaleStatus(sale.status);
        statusMap[status as keyof typeof statusMap] = (statusMap[status as keyof typeof statusMap] || 0) + 1;
      }
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private aggregateInventoryAlerts(products: any[], startDate: string, endDate: string): InventoryAlertData[] {
    const data: InventoryAlertData[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (30 - i));
      const dateStr = date.toISOString().split('T')[0];

      const lowStock = products.filter(p => {
        const qty = p.quantity || p.stock || 0;
        const minQty = p.minQuantity || p.minimumStock || 10;
        return qty > 0 && qty <= minQty;
      }).length;

      const outOfStock = products.filter(p => (p.quantity || p.stock || 0) === 0).length;

      data.push({
        date: dateStr,
        lowStock,
        outOfStock
      });
    }

    return data;
  }

  private aggregateCashFlow(sales: any[], startDate: string, endDate: string): CashFlowData[] {
    const data: CashFlowData[] = [];
    const dateMap = new Map<string, { inflow: number; outflow: number }>();

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate) {
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { inflow: 0, outflow: 0 });
        }
        const entry = dateMap.get(dateStr)!;
        const amount = sale.total || sale.amount || 0;
        if (sale.type === 'PURCHASE' || sale.type === 'EXPENSE') {
          entry.outflow += amount;
        } else {
          entry.inflow += amount;
        }
      }
    });

    // Fill missing dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const entry = dateMap.get(dateStr) || { inflow: 0, outflow: 0 };
      data.push({
        date: dateStr,
        inflow: entry.inflow,
        outflow: entry.outflow
      });
    }

    return data;
  }

  private aggregateSalesByPaymentMethod(sales: any[], startDate: string, endDate: string): SalesByPaymentMethodData[] {
    const methodMap = new Map<string, number>();
    let totalAmount = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date || new Date());
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (dateStr >= startDate && dateStr <= endDate) {
        const method = sale.paymentMethod || sale.method || 'Cash';
        const amount = sale.total || sale.amount || 0;
        methodMap.set(method, (methodMap.get(method) || 0) + amount);
        totalAmount += amount;
      }
    });

    return Array.from(methodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
    }));
  }

  private mapSaleStatus(status?: string): string {
    if (!status) return 'PENDING';
    const lower = status.toLowerCase();
    if (lower.includes('paid') || lower.includes('completed')) return 'PAID';
    if (lower.includes('overdue')) return 'OVERDUE';
    return 'PENDING';
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

  // ============ Mock Data ============

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
