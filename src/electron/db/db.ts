// src/electron/db/db.ts
import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";

let db: Database.Database | null = null;

export function getDatabaseConnection(): Database.Database {
  if (db) {
    return db;
  }

  // Get database path in user data folder
  const dbPath = path.join(app.getPath("userData"), "app.db");

  // Create connection
  db = new Database(dbPath);

  // Enable optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  console.log(`Database connected: ${dbPath}`);

  return db;
}

export function closeDatabaseConnection(): void {
  if (db) {
    db.close();
    db = null;
    console.log("Database closed");
  }
}
