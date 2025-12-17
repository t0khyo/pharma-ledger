import { ipcMain } from "electron";
import { FinancialService } from "../services/financial.service.js";
import { getDatabaseConnection } from "../db/db.js";
import { UpsertDailyEntryDTO } from "../../shared/types/financial.types.js";

export const registerFinancialHandlers = () => {
  const db = getDatabaseConnection();
  const financialService = new FinancialService(db);

  // Get entries for a date range
  ipcMain.handle(
    "financial:getEntriesForDateRange",
    async (event, startDate: string, endDate: string) => {
      try {
        const entries = financialService.getEntriesForDateRange(
          startDate,
          endDate
        );
        return { success: true, data: entries };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Upsert a daily entry
  ipcMain.handle(
    "financial:upsertEntry",
    async (event, data: UpsertDailyEntryDTO) => {
      try {
        const entry = financialService.upsertEntry(data);
        return { success: true, data: entry };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Get monthly summary
  ipcMain.handle(
    "financial:getMonthSummary",
    async (event, startDate: string, endDate: string) => {
      try {
        const summary = financialService.getMonthSummary(startDate, endDate);
        return { success: true, data: summary };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Delete entry
  ipcMain.handle("financial:deleteEntry", async (event, date: string) => {
    try {
      const success = financialService.deleteEntry(date);
      return { success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
};
