// User role types
export type UserRole = "admin" | "employee";

// User entity (without password)
export interface User {
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
