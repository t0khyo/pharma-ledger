import { Database } from "better-sqlite3";

export function createSettingsTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings if they don't exist
  const insert = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  
  insert.run("backup_enabled", "false");
  insert.run("backup_email_recipient", "");
  insert.run("backup_email_sender", "");
  insert.run("backup_smtp_host", "");
  insert.run("backup_smtp_port", "587");
  insert.run("backup_smtp_user", "");
  insert.run("backup_smtp_pass", "");
  insert.run("last_backup_sent_at", "");
}
