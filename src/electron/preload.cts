import { contextBridge, ipcRenderer } from "electron";
import { CreateCompanyDTO, Company } from "../shared/types/company.types.js";
import { ApiResponse } from "../shared/types/electron.js";
import {
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
} from "../shared/types/financial.types.js";
import { User, LoginCredentials } from "../shared/types/user.types.js";

const companyApi = {
  create: (data: CreateCompanyDTO): Promise<ApiResponse<Company>> =>
    ipcRenderer.invoke("company:create", data),

  getAll: (): Promise<ApiResponse<Company[]>> =>
    ipcRenderer.invoke("company:getAll"),

  getById: (id: string): Promise<ApiResponse<Company>> =>
    ipcRenderer.invoke("company:getById", id),

  update: (
    id: string,
    data: Partial<CreateCompanyDTO>
  ): Promise<ApiResponse<Company>> =>
    ipcRenderer.invoke("company:update", id, data),

  delete: (id: string): Promise<ApiResponse<void>> =>
    ipcRenderer.invoke("company:delete", id),
};

const financialApi = {
  getEntriesForDateRange: (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<DailyFinancialRow[]>> =>
    ipcRenderer.invoke("financial:getEntriesForDateRange", startDate, endDate),

  upsertEntry: (
    data: UpsertDailyEntryDTO
  ): Promise<ApiResponse<DailyFinancialRow>> =>
    ipcRenderer.invoke("financial:upsertEntry", data),

  getMonthSummary: (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<MonthSummary>> =>
    ipcRenderer.invoke("financial:getMonthSummary", startDate, endDate),

  deleteEntry: (date: string): Promise<ApiResponse<void>> =>
    ipcRenderer.invoke("financial:deleteEntry", date),
};

const settingsApi = {
  get: (): Promise<any> => ipcRenderer.invoke("settings:get"),
  save: (settings: any): Promise<any> => ipcRenderer.invoke("settings:save", settings),
  testEmail: (settings: any): Promise<any> => ipcRenderer.invoke("settings:test-email", settings),
};

const authApi = {
  login: (credentials: LoginCredentials): Promise<ApiResponse<User>> =>
    ipcRenderer.invoke("auth:login", credentials),

  logout: (): Promise<ApiResponse<void>> =>
    ipcRenderer.invoke("auth:logout"),

  getCurrentUser: (): Promise<ApiResponse<User | null>> =>
    ipcRenderer.invoke("auth:getCurrentUser"),

  updatePassword: (userId: string, password: string): Promise<ApiResponse<void>> =>
    ipcRenderer.invoke("auth:updatePassword", { userId, password }),

  updateProfile: (userId: string, data: { full_name: string }): Promise<ApiResponse<void>> =>
    ipcRenderer.invoke("auth:updateProfile", { userId, data }),

  uploadAvatar: (userId: string, base64Data: string): Promise<ApiResponse<string>> =>
    ipcRenderer.invoke("auth:uploadAvatar", { userId, base64Data }),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("api", {
  company: companyApi,
  financial: financialApi,
  auth: authApi,
  settings: settingsApi,
  customers: {
    getAll: (search?: string) => ipcRenderer.invoke("customers:get-all", search),
    add: (customer: any) => ipcRenderer.invoke("customers:add", customer),
    update: (id: number, customer: any) => ipcRenderer.invoke("customers:update", { id, customer }),
    delete: (id: number) => ipcRenderer.invoke("customers:delete", id),
  },
  transactions: {
    add: (input: any) => ipcRenderer.invoke("transaction:add", input),
    getAll: (filters: any) => ipcRenderer.invoke("transaction:getAll", filters),
    delete: (id: number) => ipcRenderer.invoke("transaction:delete", id),
    getStats: (filters: any) => ipcRenderer.invoke("transaction:getStats", filters),
    getDashboardStats: () => ipcRenderer.invoke("dashboard:getStats"),
  },
});
