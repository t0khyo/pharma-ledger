
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
  
  const defaultUsers = [
    {
      username: "sobhy",
      password: "010medo2012soso2015",
      full_name: "Sobhy Shaaban",
      role: "admin"
    },
    {
      username: "t0khyo",
      password: "abdelrahman",
      full_name: "Abdelrahman Eltokhy",
      role: "admin"
    },
    {
      username: "employee",
      password: "secret",
      full_name: "Employee 2",
      role: "employee"
    },
    {
      username: "10",
      password: "10",
      full_name: "موظف 1",
      role: "employee"
    }
  ];


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
