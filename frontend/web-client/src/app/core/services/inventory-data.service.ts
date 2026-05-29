import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { shareReplay, catchError, map } from 'rxjs/operators';

/**
 * Product Stock Status
 */
export interface ProductStock {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  reorderPoint: number;
  lastRestockDate: Date;
}

/**
 * Warehouse Summary
 */
export interface WarehouseSummary {
  id: string;
  name: string;
  totalItems: number;
  totalValue: number;
  utilizationPercentage: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'CLOSED';
}

/**
 * Stock Movement
 */
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: string;
  date: Date;
  reference: string;
}

/**
 * InventoryDataService - Manages inventory and stock data
 * 
 * Responsibilities:
 * - Track product stock levels
 * - Monitor low stock alerts
 * - Get warehouse summaries
 * - Track stock movements
 */
@Injectable({ providedIn: 'root' })
export class InventoryDataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get low stock products
   */
  getLowStockProducts(limit: number = 10): Observable<ProductStock[]> {
    const params = new HttpParams().set('limit', limit).set('status', 'LOW_STOCK');

    return this.http.get<ProductStock[]>(
      `${this.apiUrl}/inventory/low-stock`,
      { params }
    ).pipe(
      map(products => products.map(prod => ({
        ...prod,
        lastRestockDate: new Date(prod.lastRestockDate)
      }))),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch low stock products:', error);
        return of(this.getDefaultLowStockProducts());
      })
    );
  }

  /**
   * Get out of stock products
   */
  getOutOfStockProducts(limit: number = 10): Observable<ProductStock[]> {
    const params = new HttpParams().set('limit', limit).set('status', 'OUT_OF_STOCK');

    return this.http.get<ProductStock[]>(
      `${this.apiUrl}/inventory/out-of-stock`,
      { params }
    ).pipe(
      map(products => products.map(prod => ({
        ...prod,
        lastRestockDate: new Date(prod.lastRestockDate)
      }))),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch out of stock products:', error);
        return of([]);
      })
    );
  }

  /**
   * Get warehouse summaries
   */
  getWarehouses(): Observable<WarehouseSummary[]> {
    return this.http.get<WarehouseSummary[]>(
      `${this.apiUrl}/inventory/warehouses`
    ).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch warehouses:', error);
        return of(this.getDefaultWarehouses());
      })
    );
  }

  /**
   * Get total inventory value
   */
  getTotalInventoryValue(): Observable<{
    total: number;
    bySku: number;
    change: number;
  }> {
    return this.http.get<{
      total: number;
      bySku: number;
      change: number;
    }>(`${this.apiUrl}/dashboard/inventory-value`).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch inventory value:', error);
        return of({
          total: 0,
          bySku: 0,
          change: 0
        });
      })
    );
  }

  /**
   * Get recent stock movements
   */
  getRecentMovements(limit: number = 10): Observable<StockMovement[]> {
    const params = new HttpParams().set('limit', limit).set('sort', '-date');

    return this.http.get<StockMovement[]>(
      `${this.apiUrl}/inventory/movements`,
      { params }
    ).pipe(
      map(movements => movements.map(mov => ({
        ...mov,
        date: new Date(mov.date)
      }))),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch stock movements:', error);
        return of(this.getDefaultMovements());
      })
    );
  }

  /**
   * Get inventory alerts
   */
  getInventoryAlerts(): Observable<{
    lowStockCount: number;
    outOfStockCount: number;
    overstockCount: number;
    totalAlerts: number;
  }> {
    return this.http.get<{
      lowStockCount: number;
      outOfStockCount: number;
      overstockCount: number;
      totalAlerts: number;
    }>(`${this.apiUrl}/dashboard/inventory-alerts`).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch inventory alerts:', error);
        return of({
          lowStockCount: 0,
          outOfStockCount: 0,
          overstockCount: 0,
          totalAlerts: 0
        });
      })
    );
  }

  // Default/Mock data

  private getDefaultLowStockProducts(): ProductStock[] {
    return [
      {
        id: '1',
        name: 'Laptop Pro 15',
        sku: 'LAPTOP-001',
        quantity: 3,
        minQuantity: 5,
        maxQuantity: 50,
        status: 'LOW_STOCK',
        reorderPoint: 10,
        lastRestockDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'USB-C Cable',
        sku: 'CABLE-USB-C',
        quantity: 12,
        minQuantity: 20,
        maxQuantity: 200,
        status: 'LOW_STOCK',
        reorderPoint: 50,
        lastRestockDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Wireless Mouse',
        sku: 'MOUSE-001',
        quantity: 8,
        minQuantity: 10,
        maxQuantity: 100,
        status: 'LOW_STOCK',
        reorderPoint: 25,
        lastRestockDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getDefaultWarehouses(): WarehouseSummary[] {
    return [
      {
        id: '1',
        name: 'Main Warehouse',
        totalItems: 5000,
        totalValue: 250000,
        utilizationPercentage: 65,
        status: 'OPERATIONAL'
      },
      {
        id: '2',
        name: 'Secondary Warehouse',
        totalItems: 2500,
        totalValue: 125000,
        utilizationPercentage: 45,
        status: 'OPERATIONAL'
      },
      {
        id: '3',
        name: 'Distribution Center',
        totalItems: 3200,
        totalValue: 160000,
        utilizationPercentage: 55,
        status: 'OPERATIONAL'
      }
    ];
  }

  private getDefaultMovements(): StockMovement[] {
    const today = new Date();
    return [
      {
        id: '1',
        productId: '1',
        productName: 'Laptop Pro 15',
        quantity: 10,
        type: 'IN',
        reason: 'Purchase Order',
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        reference: 'PO-2026-001'
      },
      {
        id: '2',
        productId: '2',
        productName: 'USB-C Cable',
        quantity: 50,
        type: 'OUT',
        reason: 'Sales Order',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        reference: 'SO-2026-045'
      }
    ];
  }
}
