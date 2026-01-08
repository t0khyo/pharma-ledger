import { ipcMain } from "electron";
import { TransactionService } from "../services/transaction.service.js";
import type { CreateTransactionInput, TransactionFilters } from "../../shared/types/transaction.types.js";
import type { ApiResponse } from "../../shared/types/electron.js";

export function registerTransactionHandlers() {
  console.log("Registering transaction handlers...");

  ipcMain.handle(
    "transaction:add",
    async (_event, input: CreateTransactionInput): Promise<ApiResponse<any>> => {
      try {
        const transaction = TransactionService.addTransaction(input);
        return { success: true, data: transaction };
      } catch (error) {
        console.error("Add transaction error:", error);
        return { success: false, error: "فشل إضافة العملية" };
      }
    }
  );

  ipcMain.handle(
    "transaction:getAll",
    async (_event, filters: TransactionFilters): Promise<ApiResponse<any[]>> => {
      try {
        const transactions = TransactionService.getTransactions(filters);
        return { success: true, data: transactions };
      } catch (error) {
        console.error("Get transactions error:", error);
        return { success: false, error: "فشل جلب العمليات" };
      }
    }
  );

  ipcMain.handle(
    "transaction:delete",
    async (_event, id: number): Promise<ApiResponse<void>> => {
      try {
        const success = TransactionService.deleteTransaction(id);
        if (success) {
          return { success: true };
        } else {
          return { success: false, error: "فشل حذف العملية" };
        }
      } catch (error) {
        console.error("Delete transaction error:", error);
        return { success: false, error: "حدث خطأ أثناء حذف العملية" };
      }
    }
  );

  ipcMain.handle(
    "transaction:getStats",
    async (_event, filters: TransactionFilters): Promise<ApiResponse<any>> => {
      try {
        const stats = TransactionService.getStats(filters);
        return { success: true, data: stats };
      } catch (error) {
        console.error("Get transaction stats error:", error);
        return { success: false, error: "فشل جلب الإحصائيات" };
      }
    }
  );

  ipcMain.handle(
    "dashboard:getStats",
    async (_event): Promise<ApiResponse<any>> => {
      try {
        const stats = TransactionService.getDashboardStats();
        return { success: true, data: stats };
      } catch (error) {
        console.error("Get dashboard stats error:", error);
        return { success: false, error: "فشل جلب إحصائيات اللوحة الرئيسية" };
      }
    }
  );
  
  console.log("Transaction handlers registered");
}
