import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ICustomerInvoice } from "../model/customer-invoice.model";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CustomerInvoiceService {
  private readonly _http = inject(HttpClient);
  private readonly _urlBase = `${environment.gatewayUrl}/api/v1/sales`;

  getAll(): Observable<ICustomerInvoice[]> {
    return this._http.get<ICustomerInvoice[]>(this._urlBase);
  }

  getByCustomerId(customerId: string): Observable<ICustomerInvoice[]> {
    return this._http.get<ICustomerInvoice[]>(`${this._urlBase}/customer/${customerId}`);
  }

  getByBranchId(branchId: string): Observable<ICustomerInvoice[]> {
    return this._http.get<ICustomerInvoice[]>(`${this._urlBase}/branch/${branchId}`);
  }

  saveInvoice(invoice: ICustomerInvoice): Observable<ICustomerInvoice> {
    return this._http.post<ICustomerInvoice>(this._urlBase, invoice);
  }
}
