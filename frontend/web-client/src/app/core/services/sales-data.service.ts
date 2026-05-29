import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';

/**
 * Invoice Summary
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
 * 
 * Responsibilities:
 * - Fetch invoice data
 * - Get customer summaries
 * - Aggregate sales by category
 * - Track payment status
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
   * Get recent invoices
   */
  getRecentInvoices(limit: number = 10): Observable<Invoice[]> {
    const params = new HttpParams().set('limit', limit).set('sort', '-date');

    return this.http.get<Invoice[]>(
      `${this.apiUrl}/invoices`,
      { params }
    ).pipe(
      map(invoices => invoices.map(inv => ({
        ...inv,
        date: new Date(inv.date),
        dueDate: new Date(inv.dueDate)
      }))),
      tap(invoices => {
        this.lastInvoiceUpdate = Date.now();
        this.invoicesCache$.next(invoices);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch invoices:', error);
        return of(this.getDefaultInvoices());
      })
    );
  }

  /**
   * Get pending invoices
   */
  getPendingInvoices(): Observable<Invoice[]> {
    return this.getRecentInvoices(100).pipe(
      map(invoices => invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE'))
    );
  }

  /**
   * Get customer summaries
   */
  getTopCustomers(limit: number = 10): Observable<CustomerSummary[]> {
    const params = new HttpParams().set('limit', limit).set('sort', '-totalSpent');

    return this.http.get<CustomerSummary[]>(
      `${this.apiUrl}/customers/top`,
      { params }
    ).pipe(
      map(customers => customers.map(cust => ({
        ...cust,
        lastOrderDate: new Date(cust.lastOrderDate)
      }))),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch top customers:', error);
        return of(this.getDefaultCustomers());
      })
    );
  }

  /**
   * Get sales by category
   */
  getSalesByCategory(): Observable<SalesByCategory[]> {
    return this.http.get<SalesByCategory[]>(
      `${this.apiUrl}/dashboard/sales-by-category`
    ).pipe(
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
  getPaymentSummary() {
    return this.http.get<{
      total: number;
      paid: number;
      pending: number;
      overdue: number;
    }>(`${this.apiUrl}/dashboard/payment-summary`).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch payment summary:', error);
        return of({
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0
        });
      })
    );
  }

  // Default/Mock data

  private getDefaultInvoices(): Invoice[] {
    const today = new Date();
    return [
      {
        id: '1',
        number: 'INV-001',
        customerName: 'Acme Corp',
        amount: 1500,
        status: 'PAID',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        number: 'INV-002',
        customerName: 'Tech Solutions',
        amount: 2300,
        status: 'PENDING',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        number: 'INV-003',
        customerName: 'Global Industries',
        amount: 890,
        status: 'OVERDUE',
        date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getDefaultCustomers(): CustomerSummary[] {
    return [
      {
        id: '1',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        totalPurchases: 45,
        totalSpent: 125000,
        lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        id: '2',
        name: 'Tech Solutions',
        email: 'info@techsol.com',
        totalPurchases: 28,
        totalSpent: 98500,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      },
      {
        id: '3',
        name: 'Global Industries',
        email: 'sales@global.com',
        totalPurchases: 15,
        totalSpent: 45000,
        lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'INACTIVE'
      }
    ];
  }

  private getDefaultSalesByCategory(): SalesByCategory[] {
    return [
      {
        category: 'Electronics',
        revenue: 125000,
        percentage: 35,
        itemCount: 450
      },
      {
        category: 'Clothing',
        revenue: 95000,
        percentage: 27,
        itemCount: 320
      },
      {
        category: 'Home & Garden',
        revenue: 85000,
        percentage: 24,
        itemCount: 180
      },
      {
        category: 'Sports',
        revenue: 50000,
        percentage: 14,
        itemCount: 95
      }
    ];
  }
}
