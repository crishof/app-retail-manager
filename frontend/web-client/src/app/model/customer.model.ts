export interface ICustomer {
  id?: string;
  name: string;
  lastname: string;
  dni?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  deleted?: boolean;
}
