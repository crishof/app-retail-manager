export interface ICompany {
  id: string;
  name: string;
  cuit: string;
  legalName: string;
  ivaStatus: string;
  startOfActivities?: string;
  grossIncomeNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICompanyRequest {
  name: string;
  cuit: string;
  legalName: string;
  ivaStatus: string;
  startOfActivities?: string;
  grossIncomeNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  active: boolean;
}
