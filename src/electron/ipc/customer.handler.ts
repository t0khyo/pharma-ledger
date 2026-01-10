import { ipcMain } from "electron";
import { CustomerService } from "../services/customer.service.js";
import type { CustomerInput } from "../../shared/types/customer.types.js";
import type { ApiResponse } from "../../shared/types/electron.js";

export function registerCustomerHandlers() {
<<<<<<< HEAD
  ipcMain.handle("customers:get-all", async (_event, options: { search?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC' } = {}) => {
    try {
      const { search, sortBy, sortOrder } = options;
      const customers = CustomerService.getAll(search, sortBy, sortOrder);
=======
  ipcMain.handle("customers:get-all", async (_event, search?: string) => {
    try {
      const customers = CustomerService.getAll(search);
>>>>>>> afc0fc1f8bab21bc04b67ba4cd14a39707bb7fb5
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
<<<<<<< HEAD
    } catch (error: any) {
      console.error("Error adding customer:", error);
      return { success: false, error: error.message || "فشل في إضافة العميل" };
=======
    } catch (error) {
      console.error("Error adding customer:", error);
      return { success: false, error: "فشل في إضافة العميل" };
>>>>>>> afc0fc1f8bab21bc04b67ba4cd14a39707bb7fb5
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
<<<<<<< HEAD
    } catch (error: any) {
      console.error("Error updating customer:", error);
      return { success: false, error: error.message || "فشل في تحديث بيانات العميل" };
=======
    } catch (error) {
      console.error("Error updating customer:", error);
      return { success: false, error: "فشل في تحديث بيانات العميل" };
>>>>>>> afc0fc1f8bab21bc04b67ba4cd14a39707bb7fb5
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
