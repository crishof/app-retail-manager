import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { IBranch, IBranchRequest } from "../model/branch.model";
import { ILocationRequest } from "../model/location.model";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class BranchService {
  private readonly _http = inject(HttpClient);
  private readonly _urlBase = `${environment.gatewayUrl}/api/v1/branches`;

  getBranches(): Observable<IBranch[]> {
    return this._http.get<IBranch[]>(this._urlBase);
  }

  getBranch(id: string): Observable<IBranch> {
    return this._http.get<IBranch>(`${this._urlBase}/${id}`);
  }

  getBranchesByCompany(companyId: string): Observable<IBranch[]> {
    return this._http.get<IBranch[]>(`${environment.gatewayUrl}/api/v1/companies/${companyId}/branches`);
  }

  createBranch(request: IBranchRequest): Observable<IBranch> {
    return this._http.post<IBranch>(this._urlBase, request);
  }

  createBranchForCompany(companyId: string, request: IBranchRequest): Observable<IBranch> {
    return this._http.post<IBranch>(`${environment.gatewayUrl}/api/v1/companies/${companyId}/branches`, request);
  }

  updateBranch(id: string, request: IBranchRequest): Observable<IBranch> {
    return this._http.patch<IBranch>(`${this._urlBase}/${id}`, request);
  }

  deleteBranch(id: string): Observable<void> {
    return this._http.delete<void>(`${this._urlBase}/${id}`);
  }

  createLocation(branchId: string, request: ILocationRequest): Observable<IBranch> {
    return this._http.post<IBranch>(`${this._urlBase}/${branchId}/locations`, request);
  }

  updateLocation(branchId: string, locationId: string, request: ILocationRequest): Observable<IBranch> {
    return this._http.patch<IBranch>(`${this._urlBase}/${branchId}/locations/${locationId}`, request);
  }

  deleteLocation(branchId: string, locationId: string): Observable<IBranch> {
    return this._http.delete<IBranch>(`${this._urlBase}/${branchId}/locations/${locationId}`);
  }
}
