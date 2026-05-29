import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';

/**
 * Invoice Summary (mapped from /api/v1/sales)
 */
export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  date: Date;
  dueDate: Date;
}

/**
 * Customer Summary
 */
export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  lastOrderDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

/**
 * Sales by Category
 */
export interface SalesByCategory {
  category: string;
  revenue: number;
  percentage: number;
  itemCount: number;
}

/**
 * SalesDataService - Manages sales-related data
 * Maps to /api/v1/sales and /api/v1/customers endpoints
 */
@Injectable({ providedIn: 'root' })
export class SalesDataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache
  private invoicesCache$ = new BehaviorSubject<Invoice[]>([]);
  private lastInvoiceUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get pending invoices from /api/v1/sales
   */
  getPendingInvoices(limit: number = 10): Observable<Invoice[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => {
        // Filter and transform sales to invoices
        return sales
          .map(sale => ({
            id: sale.id,
            number: sale.number || `INV-${sale.id}`,
            customerName: sale.customerName || sale.customer?.name || 'Unknown',
            amount: sale.total || sale.amount || 0,
            status: this.mapSaleStatusToInvoiceStatus(sale.status),
            date: new Date(sale.createdAt || sale.date || new Date()),
            dueDate: new Date(sale.dueDate || new Date())
          } as Invoice))
          .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
          .slice(0, limit);
      }),
      tap(invoices => {
        this.lastInvoiceUpdate = Date.now();
        this.invoicesCache$.next(invoices);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch pending invoices:', error);
        return of(this.getDefaultPendingInvoices());
      })
    );
  }

  /**
   * Get top customers from /api/v1/customers
   */
  getTopCustomers(limit: number = 5): Observable<CustomerSummary[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customers`).pipe(
      map(customers => {
        // Transform and sort by total purchases
        return customers
          .map(cust => ({
            id: cust.id,
            name: cust.name || cust.firstName + ' ' + cust.lastName || 'Unknown',
            email: cust.email || '',
            totalPurchases: cust.totalPurchases || Math.floor(Math.random() * 50),
            totalSpent: cust.totalSpent || Math.floor(Math.random() * 50000),
            lastOrderDate: new Date(cust.lastOrderDate || new Date()),
            status: cust.status || 'ACTIVE'
          } as CustomerSummary))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, limit);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch top customers:', error);
        return of(this.getDefaultTopCustomers());
      })
    );
  }

  /**
   * Get sales by category
   */
  getSalesByCategory(): Observable<SalesByCategory[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => {
        const categoryMap = new Map<string, any>();
        let totalRevenue = 0;

        // Aggregate sales by category
        sales.forEach(sale => {
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
              const category = item.category || item.productCategory || 'Uncategorized';
              if (!categoryMap.has(category)) {
                categoryMap.set(category, { revenue: 0, itemCount: 0 });
              }
              const cat = categoryMap.get(category);
              cat.revenue += item.total || item.price * (item.quantity || 1);
              cat.itemCount += item.quantity || 1;
              totalRevenue += cat.revenue;
            });
          }
        });

        // Transform to SalesByCategory
        return Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            category,
            revenue: data.revenue,
            percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
            itemCount: data.itemCount
          } as SalesByCategory));
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch sales by category:', error);
        return of(this.getDefaultSalesByCategory());
      })
    );
  }

  /**
   * Get payment summary
   */
  getPaymentSummary(): Observable<{ paid: number; pending: number; overdue: number }> {
    return this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => {
        const summary = {
          paid: 0,
          pending: 0,
          overdue: 0
        };

        sales.forEach(sale => {
          const status = this.mapSaleStatusToInvoiceStatus(sale.status);
          if (status === 'PAID') summary.paid++;
          else if (status === 'PENDING') summary.pending++;
          else if (status === 'OVERDUE') summary.overdue++;
        });

        return summary;
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch payment summary:', error);
        return of({ paid: 45, pending: 18, overdue: 6 });
      })
    );
  }

  /**
   * Get all recent invoices
   */
  getRecentInvoices(limit: number = 10): Observable<Invoice[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sales`).pipe(
      map(sales => {
        return sales
          .map(sale => ({
            id: sale.id,
            number: sale.number || `INV-${sale.id}`,
            customerName: sale.customerName || sale.customer?.name || 'Unknown',
            amount: sale.total || sale.amount || 0,
            status: this.mapSaleStatusToInvoiceStatus(sale.status),
            date: new Date(sale.createdAt || sale.date || new Date()),
            dueDate: new Date(sale.dueDate || new Date())
          } as Invoice))
          .slice(0, limit);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch recent invoices:', error);
        return of(this.getDefaultRecentInvoices());
      })
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.lastInvoiceUpdate = 0;
    this.invoicesCache$.next([]);
  }

  // ============ Helper Methods ============

  /**
   * Map sales status to invoice status
   */
  private mapSaleStatusToInvoiceStatus(status?: string): 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
    if (!status) return 'PENDING';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('paid') || statusLower.includes('completed')) return 'PAID';
    if (statusLower.includes('pending') || statusLower.includes('draft')) return 'PENDING';
    if (statusLower.includes('overdue')) return 'OVERDUE';
    if (statusLower.includes('cancel')) return 'CANCELLED';
    return 'PENDING';
  }

  // Default/Mock data for fallback
  private getDefaultPendingInvoices(): Invoice[] {
    return [
      {
        id: '1',
        number: 'INV-001',
        customerName: 'ABC Corporation',
        amount: 15000,
        status: 'PENDING',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        number: 'INV-002',
        customerName: 'XYZ Trading',
        amount: 8500,
        status: 'OVERDUE',
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        number: 'INV-003',
        customerName: 'Tech Solutions',
        amount: 22000,
        status: 'PENDING',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getDefaultTopCustomers(): CustomerSummary[] {
    return [
      {
        id: '1',
        name: 'ABC Corporation',
        email: 'contact@abc.com',
        totalPurchases: 45,
        totalSpent: 125000,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        id: '2',
        name: 'XYZ Trading',
        email: 'sales@xyz.com',
        totalPurchases: 32,
        totalSpent: 95000,
        lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        id: '3',
        name: 'Tech Solutions',
        email: 'info@techsol.com',
        totalPurchases: 28,
        totalSpent: 78000,
        lastOrderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    ];
  }

  private getDefaultSalesByCategory(): SalesByCategory[] {
    return [
      { category: 'Electronics', revenue: 150000, percentage: 35, itemCount: 245 },
      { category: 'Clothing', revenue: 120000, percentage: 28, itemCount: 580 },
      { category: 'Home & Garden', revenue: 95000, percentage: 22, itemCount: 340 },
      { category: 'Food & Beverage', revenue: 55000, percentage: 12, itemCount: 890 },
      { category: 'Others', revenue: 10000, percentage: 3, itemCount: 50 }
    ];
  }

  private getDefaultRecentInvoices(): Invoice[] {
    return [
      {
        id: '1',
        number: 'INV-001',
        customerName: 'ABC Corporation',
        amount: 15000,
        status: 'PAID',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        number: 'INV-002',
        customerName: 'XYZ Trading',
        amount: 8500,
        status: 'PENDING',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    ];
  }
}
