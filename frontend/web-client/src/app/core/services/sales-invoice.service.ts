import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface SalesInvoiceItem {
  id?: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: string;
  lineTotal?: number;
  taxAmount?: number;
  lineTotalWithTax?: number;
}

export interface SalesInvoice {
  id?: string;
  saleId?: string;
  customerId: string;
  branchId: string;
  locationId?: string;
  number: string;
  documentType: string;
  issueDate: string;
  dueDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  remainingAmount: number;
  paymentMethod?: string;
  observations?: string;
  items: SalesInvoiceItem[];
}

export interface CreateSalesInvoiceRequest {
  saleId?: string;
  customerId: string;
  branchId: string;
  locationId?: string;
  number: string;
  documentType: string;
  issueDate: string;
  dueDate: string;
  totalPrice: number;
  paymentMethod?: string;
  observations?: string;
  items: SalesInvoiceItem[];
}

/**
 * Service for Sales Invoice API operations.
 */
@Injectable({ providedIn: 'root' })
export class SalesInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/sales-invoices`;

  /**
   * Create a new sales invoice.
   */
  create(request: CreateSalesInvoiceRequest, tenantId: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(this.apiUrl, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get sales invoice by ID.
   */
  getById(id: string, tenantId: string): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get all sales invoices.
   */
  getAll(tenantId: string): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(this.apiUrl, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get sales invoices by customer.
   */
  getByCustomerId(customerId: string, tenantId: string): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get sales invoices by date range.
   */
  getByDateRange(startDate: string, endDate: string, tenantId: string): Observable<SalesInvoice[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/date-range`, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get unpaid invoices for customer.
   */
  getUnpaidByCustomerId(customerId: string, tenantId: string): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/customer/${customerId}/unpaid`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update a sales invoice.
   */
  update(id: string, request: Partial<SalesInvoice>, tenantId: string): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/${id}`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Record a payment for a sales invoice.
   */
  recordPayment(id: string, amount: number, tenantId: string): Observable<SalesInvoice> {
    const params = new HttpParams().set('amount', amount.toString());
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${id}/payments`, {}, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Cancel a sales invoice.
   */
  cancel(id: string, tenantId: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${id}/cancel`, {}, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Delete a sales invoice.
   */
  delete(id: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }
}
