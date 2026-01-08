import { ipcMain } from "electron";
import { CustomerService } from "../services/customer.service.js";
import type { CustomerInput } from "../../shared/types/customer.types.js";
import type { ApiResponse } from "../../shared/types/electron.js";

export function registerCustomerHandlers() {
  ipcMain.handle("customers:get-all", async (_event, search?: string) => {
    try {
      const customers = CustomerService.getAll(search);
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
    } catch (error) {
      console.error("Error adding customer:", error);
      return { success: false, error: "فشل في إضافة العميل" };
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
    } catch (error) {
      console.error("Error updating customer:", error);
      return { success: false, error: "فشل في تحديث بيانات العميل" };
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
