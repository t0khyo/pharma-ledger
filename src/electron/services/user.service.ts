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
  /**
   * Update user password
   */
  static updatePassword(userId: string, password: string): boolean {
    const db = getDatabaseConnection();
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = db
      .prepare("UPDATE users SET password_hash = ? WHERE user_id = ?")
      .run(hash, userId);

    return result.changes > 0;
  }

  /**
   * Update user profile details
   */
  static updateProfile(userId: string, data: { full_name: string }): boolean {
    const db = getDatabaseConnection();
    
    const result = db
      .prepare("UPDATE users SET full_name = ? WHERE user_id = ?")
      .run(data.full_name, userId);

    return result.changes > 0;
  }
}
