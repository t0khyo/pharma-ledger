import { Database } from "better-sqlite3";

export function createCompanyTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS company (
      company_id TEXT PRIMARY KEY,
      company_name VARCHAR(100) UNIQUE NOT NULL,
      contact_person VARCHAR(100),
      phone VARCHAR(30),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
