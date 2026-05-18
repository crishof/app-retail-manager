import { ILocation } from './location.model';

export interface IBranch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  locality?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  pointOfSale: number;
  active: boolean;
  locations: ILocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IBranchRequest {
  companyId: string;
  code: string;
  name: string;
  address?: string;
  locality?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  pointOfSale: number;
  active: boolean;
}

