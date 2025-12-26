import type { LoginCredentials, User } from "src/shared/types/user.types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await window.api.auth.login(credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || "فشل تسجيل الدخول");
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    const response = await window.api.auth.logout();
    
    if (!response.success) {
      throw new Error(response.error || "فشل تسجيل الخروج");
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await window.api.auth.getCurrentUser();
    
    if (!response.success) {
      return null;
    }
    
    return response.data || null;
  },
};
