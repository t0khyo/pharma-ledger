export type TransactionType = 'debt' | 'payment';
export type PaymentMethod = 'cash' | 'e-wallet' | 'instapay' | 'bank_transfer';

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_name: string;
  quantity?: number;
  price?: number;
}

export interface Transaction {
  id: number;
  customer_id: number;
  customer_name?: string; // For display purposes
  type: TransactionType;
  amount: number;
  date: string;
  payment_method?: PaymentMethod;
  notes?: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface CreateTransactionInput {
  customer_id: number;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  payment_method?: PaymentMethod;
  notes?: string;
  items?: { product_name: string; quantity?: number; price?: number }[];
}

export interface TransactionStats {
  totalDebts: number;
  totalPayments: number;
  unpaidDebts: number;
  netBalance: number;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  query?: string; // Search by customer name
}

export interface DashboardStats {
    unpaidDebts: number;
    totalCustomers: number;
    monthlyIncome: number;
    totalCompanies: number;
    recentTransactions: Transaction[];
}
