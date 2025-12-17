import { contextBridge, ipcRenderer } from "electron";
import { CreateCompanyDTO, Company } from "../shared/types/company.types.js";
import { ApiResponse } from "../shared/types/electron.js";
import {
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
} from "../shared/types/financial.types.js";

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

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("api", {
  company: companyApi,
  financial: financialApi,
});
