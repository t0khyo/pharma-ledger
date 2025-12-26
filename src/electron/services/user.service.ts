import { getDatabaseConnection } from "../db/db.js";
import bcrypt from "bcryptjs";
import type { User } from "../../shared/types/user.types.js";

interface UserRow {
  user_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "employee";
  created_at: string;
}

export class UserService {
  /**
   * Authenticate a user with username and password
   */
  static authenticate(username: string, password: string): User | null {
    const db = getDatabaseConnection();

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as UserRow | undefined;

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    return {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Get user by ID
   */
  static getUserById(userId: string): User | null {
    const db = getDatabaseConnection();

    const user = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId) as UserRow | undefined;

    if (!user) {
      return null;
    }

    return {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Get user by username
   */
  static getUserByUsername(username: string): User | null {
    const db = getDatabaseConnection();

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as UserRow | undefined;

    if (!user) {
      return null;
    }

    return {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };
  }
}
