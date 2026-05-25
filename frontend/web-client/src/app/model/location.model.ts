export type LocationType = 'SALES' | 'WAREHOUSE' | 'TRANSIT' | 'CONSIGNMENT';

export interface ILocation {
  id: string;
  code: string;
  name: string;
  address?: string;
  locationType: LocationType;
  active: boolean;
}

export interface ILocationRequest {
  code: string;
  name: string;
  address?: string;
  locationType: LocationType;
  active: boolean;
}
