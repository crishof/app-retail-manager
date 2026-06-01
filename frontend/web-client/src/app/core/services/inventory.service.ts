import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface InventoryItem {
  id?: string;
  productId: string;
  description: string;
  expectedQuantity: number;
  zonaACount: number;
  zonaBCount: number;
  zonaCCount: number;
  totalPhysicalCount?: number;
  discrepancy?: number;
}

export interface InventorySession {
  id?: string;
  branchId: string;
  depositId: string;
  description: string;
  status: string; // DRAFT, IN_PROGRESS, COMPLETED, CONFIRMED
  startDate?: string;
  endDate?: string;
  startedBy?: string;
  confirmedBy?: string;
  items?: InventoryItem[];
}

export interface CreateInventorySessionRequest {
  branchId: string;
  depositId: string;
  description: string;
}

export interface UpdateInventorySessionRequest {
  description?: string;
}

export interface CreateInventoryItemRequest {
  productId: string;
  description: string;
  expectedQuantity: number;
  zonaACount: number;
  zonaBCount: number;
  zonaCCount: number;
}

export interface UpdateInventoryItemRequest {
  expectedQuantity?: number;
  zonaACount?: number;
  zonaBCount?: number;
  zonaCCount?: number;
}

/**
 * Service for Inventory API operations.
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/inventory`;

  // ==================== SESSION ENDPOINTS ====================

  /**
   * Create a new inventory session.
   */
  createSession(request: CreateInventorySessionRequest, tenantId: string): Observable<InventorySession> {
    return this.http.post<InventorySession>(`${this.apiUrl}/sessions`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory session by ID.
   */
  getSessionById(id: string, tenantId: string): Observable<InventorySession> {
    return this.http.get<InventorySession>(`${this.apiUrl}/sessions/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get all inventory sessions.
   */
  getAllSessions(tenantId: string): Observable<InventorySession[]> {
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory sessions by branch.
   */
  getSessionsByBranch(branchId: string, tenantId: string): Observable<InventorySession[]> {
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions/branch/${branchId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory sessions by deposit.
   */
  getSessionsByDeposit(depositId: string, tenantId: string): Observable<InventorySession[]> {
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions/deposit/${depositId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory sessions by status.
   */
  getSessionsByStatus(status: string, tenantId: string): Observable<InventorySession[]> {
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions/status/${status}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get active inventory sessions.
   */
  getActiveSessions(tenantId: string): Observable<InventorySession[]> {
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions/active`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory sessions by date range.
   */
  getSessionsByDateRange(startDate: string, endDate: string, tenantId: string): Observable<InventorySession[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<InventorySession[]>(`${this.apiUrl}/sessions/date-range`, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update an inventory session.
   */
  updateSession(id: string, request: UpdateInventorySessionRequest, tenantId: string): Observable<InventorySession> {
    return this.http.put<InventorySession>(`${this.apiUrl}/sessions/${id}`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Start an inventory count (DRAFT → IN_PROGRESS).
   */
  startSession(id: string, userId: string, tenantId: string): Observable<InventorySession> {
    const params = new HttpParams().set('userId', userId);
    return this.http.post<InventorySession>(`${this.apiUrl}/sessions/${id}/start`, {}, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Complete the inventory count (IN_PROGRESS → COMPLETED).
   */
  completeSession(id: string, tenantId: string): Observable<InventorySession> {
    return this.http.post<InventorySession>(`${this.apiUrl}/sessions/${id}/complete`, {}, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Confirm the inventory session (COMPLETED → CONFIRMED).
   */
  confirmSession(id: string, userId: string, tenantId: string): Observable<InventorySession> {
    const params = new HttpParams().set('userId', userId);
    return this.http.post<InventorySession>(`${this.apiUrl}/sessions/${id}/confirm`, {}, {
      params,
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Delete an inventory session.
   */
  deleteSession(id: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  // ==================== ITEM ENDPOINTS ====================

  /**
   * Add item to inventory session.
   */
  addItem(sessionId: string, request: CreateInventoryItemRequest, tenantId: string): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/sessions/${sessionId}/items`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get inventory item by ID.
   */
  getItemById(id: string, tenantId: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/items/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get items by session.
   */
  getItemsBySession(sessionId: string, tenantId: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/sessions/${sessionId}/items`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Get items with discrepancies in a session.
   */
  getDiscrepanciesBySession(sessionId: string, tenantId: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/sessions/${sessionId}/discrepancies`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Update inventory item.
   */
  updateItem(id: string, request: UpdateInventoryItemRequest, tenantId: string): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/items/${id}`, request, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }

  /**
   * Delete inventory item.
   */
  deleteItem(id: string, tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    });
  }
}
