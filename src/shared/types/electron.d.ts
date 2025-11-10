import { ApiResponse, CreateCompanyDTO, Company } from "../../shared/types/api";

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

export interface ElectronApi {
  company: CompanyApi;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
