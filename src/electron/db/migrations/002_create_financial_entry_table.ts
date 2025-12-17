import { Database } from "better-sqlite3";

export function createFinancialTables(db: Database) {
  // Main financial entry table - one row per day
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_entry (
      entry_id TEXT PRIMARY KEY,
      entry_date DATE UNIQUE NOT NULL,
      income DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Expense entries - multiple rows per day (one per company)
  db.exec(`
    CREATE TABLE IF NOT EXISTS expense_entry (
      expense_id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      amount DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES financial_entry(entry_id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE,
      UNIQUE(entry_id, company_id)
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_financial_entry_date 
    ON financial_entry(entry_date);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expense_entry_entry_id 
    ON expense_entry(entry_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expense_entry_company_id 
    ON expense_entry(company_id);
  `);
}
