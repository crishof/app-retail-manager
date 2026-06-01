import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface QuoteItem {
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

export interface Quote {
  id?: string;
  customerId: string;
  branchId: string;
  locationId?: string;
  number: string;
  documentType: string;
  issueDate: string;
  expirationDate: string;
  totalPrice: number;
  status: string;
  saleId?: string;
  observations?: string;
  items: QuoteItem[];
}

export interface CreateQuoteRequest {
  customerId: string;
  branchId: string;
  locationId?: string;
  number: string;
  documentType: string;
  issueDate: string;
  expirationDate: string;
  totalPrice: number;
  observations?: string;
  items: QuoteItem[];
}

export interface UpdateQuoteRequest {
  expirationDate?: string;
  observations?: string;
}

/**
 * Service for Quote API operations.
 */
@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/quotes`;

  /**
   * Create a new quote.
   */
  create(request: CreateQuoteRequest, tenantId: string): Observable<Quote> {
    return this.http.post<Quote>(this.apiUrl, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get quote by ID.
   */
  getById(id: string, tenantId: string): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get all quotes.
   */
  getAll(tenantId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(this.apiUrl, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get quotes by customer.
   */
  getByCustomerId(customerId: string, tenantId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get quotes by status.
   */
  getByStatus(status: string, tenantId: string): Observable<Quote[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<Quote[]>(`${this.apiUrl}/status`, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get active quotes (not expired, not converted).
   */
  getActive(tenantId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/active`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get expired quotes.
   */
  getExpired(tenantId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.apiUrl}/expired`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get quotes by date range.
   */
  getByDateRange(startDate: string, endDate: string, tenantId: string): Observable<Quote[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Quote[]>(`${this.apiUrl}/date-range`, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update a quote.
   */
  update(id: string, request: UpdateQuoteRequest, tenantId: string): Observable<Quote> {
    return this.http.put<Quote>(`${this.apiUrl}/${id}`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Convert quote to sale.
   */
  convertToSale(id: string, tenantId: string): Observable<Quote> {
    return this.http.post<Quote>(`${this.apiUrl}/${id}/convert-to-sale`, {}, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Reject a quote.
   */
  reject(id: string, tenantId: string): Observable<Quote> {
    return this.http.post<Quote>(`${this.apiUrl}/${id}/reject`, {}, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Delete a quote.
   */
  delete(id: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }
}
