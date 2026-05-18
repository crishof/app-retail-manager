import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ICompany, ICompanyRequest } from "../model/company.model";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CompanyService {
  private readonly _http = inject(HttpClient);
  private readonly _urlBase = `${environment.gatewayUrl}/api/v1/companies`;

  getCompanies(): Observable<ICompany[]> {
    return this._http.get<ICompany[]>(this._urlBase);
  }

  getCompany(id: string): Observable<ICompany> {
    return this._http.get<ICompany>(`${this._urlBase}/${id}`);
  }

  createCompany(request: ICompanyRequest): Observable<ICompany> {
    return this._http.post<ICompany>(this._urlBase, request);
  }

  updateCompany(id: string, request: ICompanyRequest): Observable<ICompany> {
    return this._http.patch<ICompany>(`${this._urlBase}/${id}`, request);
  }

  deleteCompany(id: string): Observable<void> {
    return this._http.delete<void>(`${this._urlBase}/${id}`);
  }
}
