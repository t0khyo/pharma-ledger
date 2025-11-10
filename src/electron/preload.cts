import { contextBridge, ipcRenderer } from "electron";
import { CreateCompanyDTO, Company } from "../shared/types/company.types.js";
import { ApiResponse } from "../shared/types/electron.js";

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

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("api", {
  company: companyApi,
});
