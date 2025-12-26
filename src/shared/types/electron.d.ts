import { ApiResponse, CreateCompanyDTO, Company } from "../../shared/types/api";
import {
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
} from "./financial.types";
import { User, LoginCredentials } from "./user.types";

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
}

export interface ElectronApi {
  company: CompanyApi;
  financial: FinancialApi;
  auth: AuthApi;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
