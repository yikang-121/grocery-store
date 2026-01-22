// Address type definition matching database schema
export interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal: string;
  isDefault: boolean;
  userId?: number;
}

