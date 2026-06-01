import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PurchaseInvoiceItem {
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

export interface PurchaseInvoice {
  id?: string;
  supplierId: string;
  branchId: string;
  locationId?: string;
  number: string;
  supplierInvoiceNumber: string;
  documentType: string;
  issueDate: string;
  dueDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  remainingAmount: number;
  retentionPercentage: number;
  retentionAmount: number;
  paymentMethod?: string;
  observations?: string;
  items: PurchaseInvoiceItem[];
}

export interface CreatePurchaseInvoiceRequest {
  supplierId: string;
  branchId: string;
  locationId?: string;
  number: string;
  supplierInvoiceNumber: string;
  documentType: string;
  issueDate: string;
  dueDate: string;
  totalPrice: number;
  retentionPercentage?: number;
  paymentMethod?: string;
  observations?: string;
  items: PurchaseInvoiceItem[];
}

export interface UpdatePurchaseInvoiceRequest {
  dueDate?: string;
  retentionPercentage?: number;
  paymentMethod?: string;
  observations?: string;
}

/**
 * Service for Purchase Invoice API operations.
 */
@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/purchase-invoices`;

  /**
   * Create a new purchase invoice.
   */
  create(request: CreatePurchaseInvoiceRequest, tenantId: string): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(this.apiUrl, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get purchase invoice by ID.
   */
  getById(id: string, tenantId: string): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get all purchase invoices.
   */
  getAll(tenantId: string): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(this.apiUrl, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get purchase invoices by supplier.
   */
  getBySupplierId(supplierId: string, tenantId: string): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/supplier/${supplierId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get purchase invoice by supplier invoice number.
   */
  getBySupplierNumber(supplierNumber: string, tenantId: string): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/supplier-number/${supplierNumber}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get all unpaid purchase invoices.
   */
  getUnpaid(tenantId: string): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/unpaid`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get unpaid invoices from supplier.
   */
  getUnpaidBySupplierId(supplierId: string, tenantId: string): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/supplier/${supplierId}/unpaid`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get invoices by date range.
   */
  getByDateRange(startDate: string, endDate: string, tenantId: string): Observable<PurchaseInvoice[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/date-range`, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get invoices with withholding taxes.
   */
  getWithWithholding(tenantId: string): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/with-withholding`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update a purchase invoice.
   */
  update(id: string, request: UpdatePurchaseInvoiceRequest, tenantId: string): Observable<PurchaseInvoice> {
    return this.http.put<PurchaseInvoice>(`${this.apiUrl}/${id}`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update retention percentage.
   */
  updateRetention(id: string, percentage: number, tenantId: string): Observable<PurchaseInvoice> {
    const params = new HttpParams().set('percentage', percentage.toString());
    return this.http.put<PurchaseInvoice>(`${this.apiUrl}/${id}/retention`, {}, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Cancel a purchase invoice.
   */
  cancel(id: string, tenantId: string): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(`${this.apiUrl}/${id}/cancel`, {}, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Delete a purchase invoice.
   */
  delete(id: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }
}
