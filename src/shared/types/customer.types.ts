export interface Customer {
  id: number;
  name: string;
  phone?: string;
  notes?: string;
  balance?: number;
  created_at?: string;
}

export interface CustomerInput {
  name: string;
  phone?: string;
  notes?: string;
}
