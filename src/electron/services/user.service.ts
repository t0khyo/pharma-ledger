import { getDatabaseConnection } from "../db/db.js";
import bcrypt from "bcryptjs";
import type { User } from "../../shared/types/user.types.js";
import path from "path";
import fs from "fs";
import { app } from "electron";

interface UserRow {
  user_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "employee";
  avatar_path: string | null;
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
      avatar_path: user.avatar_path || undefined,
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
      avatar_path: user.avatar_path || undefined,
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
      avatar_path: user.avatar_path || undefined,
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

  /**
   * Update user avatar
   */
  static updateAvatar(userId: string, base64Data: string): string {
    const db = getDatabaseConnection();
    
    // Save image to userdata
    const userDataPath = app.getPath("userData");
    const avatarsDir = path.join(userDataPath, "avatars");
    
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // Remove header if present (data:image/png;base64,)
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    
    // Use timestamp to prevent caching issues on the frontend
    const filename = `${userId}_${Date.now()}.png`;
    const filePath = path.join(avatarsDir, filename);
    
    fs.writeFileSync(filePath, buffer);

    // Update DB with the new file path
    db.prepare("UPDATE users SET avatar_path = ? WHERE user_id = ?")
      .run(filePath, userId);

    return filePath;
  }
}
