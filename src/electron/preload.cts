import { contextBridge, ipcRenderer } from "electron";
import type {
  Company,
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../shared/types/company.types";

// Response wrapper type
interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define the API
const api = {
  company: {
    create: (data: CreateCompanyDTO): Promise<IpcResponse<Company>> =>
      ipcRenderer.invoke("company:create", data),

    getById: (id: string): Promise<IpcResponse<Company>> =>
      ipcRenderer.invoke("company:getById", id),

    getAll: (): Promise<IpcResponse<Company[]>> =>
      ipcRenderer.invoke("company:getAll"),

    update: (
      id: string,
      data: UpdateCompanyDTO
    ): Promise<IpcResponse<Company>> =>
      ipcRenderer.invoke("company:update", id, data),

    delete: (id: string): Promise<IpcResponse<{ deleted: boolean }>> =>
      ipcRenderer.invoke("company:delete", id),
  },
};

// Expose to renderer
contextBridge.exposeInMainWorld("api", api);

// TypeScript declaration for window.api
declare global {
  interface Window {
    api: typeof api;
  }
}
