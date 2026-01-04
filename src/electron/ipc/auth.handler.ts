import { ipcMain } from "electron";
import { UserService } from "../services/user.service.js";
import type { LoginCredentials, User } from "../../shared/types/user.types.js";
import type { ApiResponse } from "../../shared/types/electron.js";

// In-memory session storage (cleared on app restart)
let currentUser: User | null = null;

export function registerAuthHandlers() {
  console.log("Registering auth handlers...");

  // Login handler
  ipcMain.handle(
    "auth:login",
    async (
      _event,
      credentials: LoginCredentials
    ): Promise<ApiResponse<User>> => {
      try {
        console.log(`Login attempt for user: ${credentials.username}`);

        const user = UserService.authenticate(
          credentials.username,
          credentials.password
        );

        if (!user) {
          return {
            success: false,
            error: "اسم المستخدم أو كلمة المرور غير صحيحة",
          };
        }

        // Store user in session
        currentUser = user;
        console.log(`User logged in: ${user.username} (${user.role})`);

        return {
          success: true,
          data: user,
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: "حدث خطأ أثناء تسجيل الدخول",
        };
      }
    }
  );

  // Logout handler
  ipcMain.handle("auth:logout", async (): Promise<ApiResponse<void>> => {
    try {
      console.log(`User logged out: ${currentUser?.username}`);
      currentUser = null;

      return {
        success: true,
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "حدث خطأ أثناء تسجيل الخروج",
      };
    }
  });

  // Get current user handler
  ipcMain.handle(
    "auth:getCurrentUser",
    async (): Promise<ApiResponse<User | null>> => {
      try {
        return {
          success: true,
          data: currentUser,
        };
      } catch (error) {
        console.error("Get current user error:", error);
        return {
          success: false,
          error: "حدث خطأ أثناء جلب بيانات المستخدم",
        };
      }
    }
  );

  // Update password handler
  ipcMain.handle(
    "auth:updatePassword",
    async (
      _event,
      { userId, password }: { userId: string; password: string }
    ): Promise<ApiResponse<void>> => {
      try {
        if (!currentUser) {
          return { success: false, error: "يجب تسجيل الدخول أولاً" };
        }

        const success = UserService.updatePassword(userId, password);
        if (success) {
          return { success: true };
        } else {
          return { success: false, error: "فشل تحديث كلمة المرور" };
        }
      } catch (error) {
        console.error("Update password error:", error);
        return {
          success: false,
          error: "حدث خطأ أثناء تحديث كلمة المرور",
        };
      }
    }
  );

  // Update profile handler
  ipcMain.handle(
    "auth:updateProfile",
    async (
      _event,
      { userId, data }: { userId: string; data: { full_name: string } }
    ): Promise<ApiResponse<void>> => {
      try {
        if (!currentUser) {
          return { success: false, error: "يجب تسجيل الدخول أولاً" };
        }

        // Security check
        if (currentUser.user_id !== userId && currentUser.role !== "admin") {
           return { success: false, error: "غير مصرح لك بتحديث بيانات مستخدم آخر" };
        }

        const success = UserService.updateProfile(userId, data);
        if (success) {
          // Update session if it's the current user
          if (currentUser.user_id === userId) {
            currentUser = { ...currentUser, ...data };
          }
          return { success: true };
        } else {
          return { success: false, error: "فشل تحديث البيانات" };
        }
      } catch (error: any) {
        console.error("Update profile error:", error);
        return {
          success: false,
          error: "حدث خطأ أثناء تحديث البيانات",
        };
      }
    }
  );

  console.log("Auth handlers registered");
}
