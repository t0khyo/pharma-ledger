import { ipcMain } from "electron";
import { CompanyService } from "../services/company.service.js";
import { getDatabaseConnection } from "../db/db.js";
import { CreateCompanyDTO } from "../../shared/types/company.types.js";

export const registerCompanyHandlers = () => {
  const db = getDatabaseConnection();
  const companyService = new CompanyService(db);

  // Listen for 'company:create' messages from renderer
  ipcMain.handle("company:create", async (event, data: CreateCompanyDTO) => {
    try {
      const company = companyService.create(data);
      return { success: true, data: company };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("company:getById", async (event, id: string) => {
    try {
      const company = await companyService.getById(id);
      return { success: true, data: company };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("company:getAll", async () => {
    try {
      const companies = await companyService.getAll();
      return { success: true, data: companies };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("company:update", async (event, id: string, data: Partial<CreateCompanyDTO>) => {
    try {
      const updatedCompany = await companyService.update(id, data);
      return { success: true, data: updatedCompany };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle("company:delete", async (event, id: string) => {
    try {
      await companyService.delete(id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
};
