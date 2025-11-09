import { ipcMain } from 'electron';
import { CompanyService } from '../services/company.service.js';
import { getDatabaseConnection } from '../db/db.js';
import { CreateCompanyDTO } from '../../shared/types/company.types.js';

export const registerCompanyHandlers = () => {
  const db = getDatabaseConnection();
  const companyService = new CompanyService(db);
  
  // Listen for 'company:create' messages from renderer
  ipcMain.handle('company:create', async (event, data: CreateCompanyDTO) => {
    try {
      const company = companyService.create(data);
      return { success: true, data: company };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
};