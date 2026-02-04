import { ipcMain } from "electron";
import { CustomerService } from "../services/customer.service.js";
import type { CustomerInput } from "../../shared/types/customer.types.js";
import type { ApiResponse } from "../../shared/types/electron.js";

export function registerCustomerHandlers() {
  ipcMain.handle("customers:get-all", async (_event, options: { search?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC', lateOnly?: boolean, lateDays?: number } = {}) => {
    try {
      const { search, sortBy, sortOrder, lateOnly, lateDays } = options;
      const customers = CustomerService.getAll(search, sortBy, sortOrder, lateOnly, lateDays);
      return { success: true, data: customers };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return { success: false, error: "فشل في جلب العملاء" };
    }
  });

  ipcMain.handle("customers:add", async (_event, customer: CustomerInput) => {
    try {
      const newCustomer = CustomerService.add(customer);
      return { success: true, data: newCustomer };
    } catch (error: any) {
      console.error("Error adding customer:", error);
      return { success: false, error: error.message || "فشل في إضافة العميل" };
    }
  });

  ipcMain.handle("customers:update", async (_event, { id, customer }: { id: number, customer: CustomerInput }) => {
    try {
      const success = CustomerService.update(id, customer);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: "المستخدم غير موجود" };
      }
    } catch (error: any) {
      console.error("Error updating customer:", error);
      return { success: false, error: error.message || "فشل في تحديث بيانات العميل" };
    }
  });

  ipcMain.handle("customers:delete", async (_event, id: number) => {
    try {
      const success = CustomerService.delete(id);
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: "المستخدم غير موجود" };
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      return { success: false, error: "فشل في حذف العميل" };
    }
  });
}
