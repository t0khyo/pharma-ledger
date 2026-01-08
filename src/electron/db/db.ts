// src/electron/db/db.ts
import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";

import { isDev } from "../util.js";

let db: Database.Database | null = null;

export function getDatabasePath(): string {
  // Get database path
  // In dev: use userData folder
  // In prod: use installation directory (next to executable)
  return isDev()
    ? path.join(app.getPath("userData"), "app.db")
    : path.join(path.dirname(app.getPath("exe")), "app.db");
}

export function getDatabaseConnection(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();

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
