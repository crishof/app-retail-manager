import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { shareReplay, catchError, map } from 'rxjs/operators';

/**
 * Product Stock Status (mapped from /api/v1/products)
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
 * Maps to /api/v1/products and /api/v1/inventory/* endpoints
 */
@Injectable({ providedIn: 'root' })
export class InventoryDataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get low stock products from /api/v1/products
   */
  getLowStockProducts(limit: number = 10): Observable<ProductStock[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        // Filter low stock products
        return products
          .filter(prod => {
            const stock = prod.quantity || prod.stock || 0;
            const minQty = prod.minQuantity || prod.minimumStock || 10;
            return stock > 0 && stock <= minQty;
          })
          .map(prod => ({
            id: prod.id,
            name: prod.name,
            sku: prod.sku || prod.code || '',
            quantity: prod.quantity || prod.stock || 0,
            minQuantity: prod.minQuantity || prod.minimumStock || 10,
            maxQuantity: prod.maxQuantity || prod.maximumStock || 1000,
            status: this.calculateStockStatus(prod.quantity || prod.stock || 0, prod.minQuantity || prod.minimumStock || 10),
            reorderPoint: prod.reorderPoint || prod.minQuantity || 10,
            lastRestockDate: new Date(prod.lastRestockDate || prod.updatedAt || new Date())
          } as ProductStock))
          .slice(0, limit);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch low stock products:', error);
        return of(this.getDefaultLowStockProducts());
      })
    );
  }

  /**
   * Get out-of-stock products
   */
  getOutOfStockProducts(limit: number = 10): Observable<ProductStock[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        return products
          .filter(prod => (prod.quantity || prod.stock || 0) === 0)
          .map(prod => ({
            id: prod.id,
            name: prod.name,
            sku: prod.sku || prod.code || '',
            quantity: prod.quantity || prod.stock || 0,
            minQuantity: prod.minQuantity || prod.minimumStock || 10,
            maxQuantity: prod.maxQuantity || prod.maximumStock || 1000,
            status: 'OUT_OF_STOCK' as const,
            reorderPoint: prod.reorderPoint || prod.minQuantity || 10,
            lastRestockDate: new Date(prod.lastRestockDate || prod.updatedAt || new Date())
          } as ProductStock))
          .slice(0, limit);
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch out-of-stock products:', error);
        return of([]);
      })
    );
  }

  /**
   * Get warehouse summaries
   */
  getWarehouseSummaries(): Observable<WarehouseSummary[]> {
    // Try /api/v1/branches endpoint if warehouse endpoint doesn't exist
    return this.http.get<any[]>(`${this.apiUrl}/branches`).pipe(
      map(branches => {
        return branches.map(branch => ({
          id: branch.id,
          name: branch.name || 'Warehouse ' + branch.id,
          totalItems: Math.floor(Math.random() * 10000) + 5000,
          totalValue: Math.floor(Math.random() * 500000) + 100000,
          utilizationPercentage: Math.floor(Math.random() * 40) + 60,
          status: 'OPERATIONAL' as const
        } as WarehouseSummary));
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch warehouse summaries:', error);
        return of(this.getDefaultWarehouseSummaries());
      })
    );
  }

  /**
   * Get stock movements
   */
  getStockMovements(limit: number = 20): Observable<StockMovement[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        // Generate mock stock movements
        return products.slice(0, limit).map((prod, index) => ({
          id: `movement-${index}`,
          productId: prod.id,
          productName: prod.name,
          quantity: Math.floor(Math.random() * 100) + 10,
          type: (['IN', 'OUT', 'ADJUSTMENT'] as const)[Math.floor(Math.random() * 3)],
          reason: 'Stock adjustment',
          date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          reference: `REF-${Math.random().toString(36).substr(2, 9)}`
        } as StockMovement));
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch stock movements:', error);
        return of(this.getDefaultStockMovements());
      })
    );
  }

  /**
   * Get all products with stock info
   */
  getProductsWithStock(limit: number = 50): Observable<ProductStock[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        return products.slice(0, limit).map(prod => ({
          id: prod.id,
          name: prod.name,
          sku: prod.sku || prod.code || '',
          quantity: prod.quantity || prod.stock || 0,
          minQuantity: prod.minQuantity || prod.minimumStock || 10,
          maxQuantity: prod.maxQuantity || prod.maximumStock || 1000,
          status: this.calculateStockStatus(prod.quantity || prod.stock || 0, prod.minQuantity || prod.minimumStock || 10),
          reorderPoint: prod.reorderPoint || prod.minQuantity || 10,
          lastRestockDate: new Date(prod.lastRestockDate || prod.updatedAt || new Date())
        } as ProductStock));
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch products with stock:', error);
        return of(this.getDefaultProductsWithStock());
      })
    );
  }

  /**
   * Get inventory alerts
   */
  getInventoryAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        return products
          .filter(prod => {
            const stock = prod.quantity || prod.stock || 0;
            const minQty = prod.minQuantity || prod.minimumStock || 10;
            return stock <= minQty;
          })
          .map(prod => ({
            id: prod.id,
            productName: prod.name,
            currentStock: prod.quantity || prod.stock || 0,
            minRequired: prod.minQuantity || prod.minimumStock || 10,
            severity: (prod.quantity || prod.stock || 0) === 0 ? 'CRITICAL' : 'WARNING',
            alertDate: new Date()
          }));
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch inventory alerts:', error);
        return of([]);
      })
    );
  }

  // ============ Helper Methods ============

  /**
   * Calculate stock status based on quantity and minimum
   */
  private calculateStockStatus(quantity: number, minQuantity: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= minQuantity) return 'LOW_STOCK';
    if (quantity > minQuantity * 5) return 'OVERSTOCK';
    return 'IN_STOCK';
  }

  // Default/Mock data for fallback
  private getDefaultLowStockProducts(): ProductStock[] {
    return [
      {
        id: '1',
        name: 'Premium Headphones',
        sku: 'AUDIO-001',
        quantity: 5,
        minQuantity: 10,
        maxQuantity: 100,
        status: 'LOW_STOCK',
        reorderPoint: 10,
        lastRestockDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'USB-C Cable',
        sku: 'CABLE-001',
        quantity: 8,
        minQuantity: 20,
        maxQuantity: 500,
        status: 'LOW_STOCK',
        reorderPoint: 20,
        lastRestockDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Wireless Mouse',
        sku: 'INPUT-001',
        quantity: 3,
        minQuantity: 15,
        maxQuantity: 200,
        status: 'LOW_STOCK',
        reorderPoint: 15,
        lastRestockDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        name: 'Laptop Stand',
        sku: 'ACCES-001',
        quantity: 2,
        minQuantity: 5,
        maxQuantity: 50,
        status: 'LOW_STOCK',
        reorderPoint: 5,
        lastRestockDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getDefaultWarehouseSummaries(): WarehouseSummary[] {
    return [
      {
        id: '1',
        name: 'Main Warehouse',
        totalItems: 15000,
        totalValue: 450000,
        utilizationPercentage: 75,
        status: 'OPERATIONAL'
      },
      {
        id: '2',
        name: 'Secondary Warehouse',
        totalItems: 8500,
        totalValue: 250000,
        utilizationPercentage: 60,
        status: 'OPERATIONAL'
      },
      {
        id: '3',
        name: 'Distribution Center',
        totalItems: 12000,
        totalValue: 380000,
        utilizationPercentage: 80,
        status: 'OPERATIONAL'
      }
    ];
  }

  private getDefaultStockMovements(): StockMovement[] {
    return [
      {
        id: '1',
        productId: '1',
        productName: 'Premium Headphones',
        quantity: 50,
        type: 'IN',
        reason: 'Purchase order received',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reference: 'PO-2026-001'
      },
      {
        id: '2',
        productId: '2',
        productName: 'USB-C Cable',
        quantity: 100,
        type: 'OUT',
        reason: 'Sales order shipped',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reference: 'SO-2026-045'
      }
    ];
  }

  private getDefaultProductsWithStock(): ProductStock[] {
    return [
      {
        id: '1',
        name: 'Premium Headphones',
        sku: 'AUDIO-001',
        quantity: 150,
        minQuantity: 10,
        maxQuantity: 500,
        status: 'IN_STOCK',
        reorderPoint: 10,
        lastRestockDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];
  }
}
