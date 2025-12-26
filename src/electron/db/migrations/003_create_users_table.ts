import fs from "fs";
import path from "path";
import type { Database } from "better-sqlite3";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export function createUsersTable(db: Database) {
  console.log("Running migration: 003_create_users_table");

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Seed default users
  const checkUser = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = ?");
  
  let defaultUsers: Array<{
    username: string;
    password: string;
    full_name: string;
    role: string;
  }> = [];

  try {
    // Try to find the file in the project root
    // In Electron development, process.cwd() is usually the project root
    // In production, it might vary, but for this migration script which runs on startup
    // we'll look relative to the app execution.
    // NOTE: For safety in production, one might want to bundle default users or handle this differently.
    const usersPath = path.resolve(process.cwd(), 'initial_users.json');
    
    if (fs.existsSync(usersPath)) {
      console.log(`Loading default users from: ${usersPath}`);
      const fileContent = fs.readFileSync(usersPath, 'utf-8');
      defaultUsers = JSON.parse(fileContent);
    } else {
      console.log('initial_users.json not found in root, skipping default user seeding.');
    }
  } catch (error) {
    console.error('Error loading initial_users.json:', error);
  }


  const insertUser = db.prepare(`
    INSERT INTO users (user_id, username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const user of defaultUsers) {
    const exists = checkUser.get(user.username) as { count: number };
    
    if (exists.count === 0) {
      const passwordHash = bcrypt.hashSync(user.password, 10);
      const userId = uuidv4();
      
      insertUser.run(
        userId,
        user.username,
        passwordHash,
        user.full_name,
        user.role
      );
      
      console.log(`Created default user: ${user.username} (${user.role})`);
    }
  }

  console.log("Migration complete: 003_create_users_table");
}
