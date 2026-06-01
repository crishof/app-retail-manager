import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { finalize, shareReplay } from "rxjs/operators";
import { ICompany, ICompanyRequest } from "../model/company.model";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class CompanyService {
  private readonly _http = inject(HttpClient);
  private readonly _urlBase = `${environment.gatewayUrl}/api/v1/companies`;
  private companiesInFlight$: Observable<ICompany[]> | null = null;

  getCompanies(): Observable<ICompany[]> {
    if (this.companiesInFlight$) {
      return this.companiesInFlight$;
    }

    this.companiesInFlight$ = this._http.get<ICompany[]>(this._urlBase).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => {
        this.companiesInFlight$ = null;
      }),
    );

    return this.companiesInFlight$;
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
