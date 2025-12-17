// Financial Entry - represents one day's income
export interface FinancialEntry {
  entry_id: string;
  entry_date: string; // ISO date string YYYY-MM-DD
  income: number;
  created_at: string;
  updated_at: string;
}

// Expense Entry - represents one company's expense for a specific day
export interface ExpenseEntry {
  expense_id: string;
  entry_id: string;
  company_id: string;
  amount: number;
  created_at: string;
}

// Combined daily row for display in the table
export interface DailyFinancialRow {
  date: string; // ISO date string YYYY-MM-DD
  income: number;
  expenses: Record<string, number>; // company_id -> amount
  totalExpenses: number;
  netProfit: number;
}

// Monthly summary statistics
export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  startDate: string;
  endDate: string;
}

// DTO for upserting a daily entry
export interface UpsertDailyEntryDTO {
  date: string; // ISO date string YYYY-MM-DD
  income: number;
  expenses: Array<{
    company_id: string;
    amount: number;
  }>;
}

// Response type for getting entries with expenses
export interface FinancialEntryWithExpenses {
  entry: FinancialEntry;
  expenses: ExpenseEntry[];
}
