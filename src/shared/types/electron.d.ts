import {
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
} from "./financial.types";
import { User, LoginCredentials } from "./user.types";
import { CreateCompanyDTO, Company } from "./company.types"; // Assuming company.types exists, or define here if needed. 
// Wait, CreateCompanyDTO was imported from api. Let's see if company.types exists. I'll stick to defining generic ApiResponse first.

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}



export interface CompanyApi {
  create: (data: CreateCompanyDTO) => Promise<ApiResponse<Company>>;
  getAll: () => Promise<ApiResponse<Company[]>>;
  getById: (id: string) => Promise<ApiResponse<Company>>;
  update: (
    id: string,
    data: Partial<CreateCompanyDTO>
  ) => Promise<ApiResponse<Company>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
}

export interface FinancialApi {
  getEntriesForDateRange: (
    startDate: string,
    endDate: string
  ) => Promise<ApiResponse<DailyFinancialRow[]>>;
  upsertEntry: (
    data: UpsertDailyEntryDTO
  ) => Promise<ApiResponse<DailyFinancialRow>>;
  getMonthSummary: (
    startDate: string,
    endDate: string
  ) => Promise<ApiResponse<MonthSummary>>;
  deleteEntry: (date: string) => Promise<ApiResponse<void>>;
}

export interface AuthApi {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<User>>;
  logout: () => Promise<ApiResponse<void>>;
  getCurrentUser: () => Promise<ApiResponse<User | null>>;
  updatePassword: (userId: string, password: string) => Promise<ApiResponse<void>>;
  updateProfile: (userId: string, data: { full_name: string }) => Promise<ApiResponse<void>>;
  uploadAvatar: (userId: string, base64Data: string) => Promise<ApiResponse<string>>;
}

import { EmailSettings, TestEmailSettings } from "./settings.types.js";
import { Customer, CustomerInput } from "./customer.types.js";
import { CreateTransactionInput, Transaction, TransactionFilters, TransactionStats, DashboardStats } from "./transaction.types.js";

export interface SettingsApi {
  get: () => Promise<EmailSettings>;
  save: (settings: EmailSettings) => Promise<ApiResponse<void>>;
  testEmail: (settings: TestEmailSettings) => Promise<ApiResponse<void>>;
}

export interface TransactionApi {
    add: (input: CreateTransactionInput) => Promise<ApiResponse<Transaction>>;
    getAll: (filters: TransactionFilters) => Promise<ApiResponse<Transaction[]>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    getStats: (filters: TransactionFilters) => Promise<ApiResponse<TransactionStats>>;
    getDashboardStats: () => Promise<ApiResponse<DashboardStats>>;
}

export interface CustomersApi {
  getAll: (search?: string) => Promise<ApiResponse<Customer[]>>;
  add: (customer: CustomerInput) => Promise<ApiResponse<Customer>>;
  update: (id: number, customer: CustomerInput) => Promise<ApiResponse<void>>;
  delete: (id: number) => Promise<ApiResponse<void>>;
}

export interface ElectronApi {
  company: CompanyApi;
  financial: FinancialApi;
  auth: AuthApi;
  settings: SettingsApi;
  customers: CustomersApi;
  transactions: TransactionApi;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
