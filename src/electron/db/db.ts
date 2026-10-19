// src/electron/db/db.ts
import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import { utimesSync, existsSync } from "fs";

let db: Database.Database | null = null;

export function getDatabasePath(): string {
  return path.join(app.getPath("userData"), "app.db");
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

export function checkpointDatabase(): void {
  if (db) {
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
      const dbPath = getDatabasePath();
      const now = new Date();
      utimesSync(dbPath, now, now);
      console.log(`[Database] Checkpointed WAL to disk and updated last modified time for: ${dbPath}`);
    } catch (err) {
      console.error("[Database] Error checkpointing database:", err);
    }
  }
}

export function closeDatabaseConnection(): void {
  if (db) {
    checkpointDatabase();
    db.close();
    db = null;
    console.log("Database closed");
  }
}
