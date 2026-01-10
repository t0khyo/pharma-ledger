-- 001_create_company_table
CREATE TABLE IF NOT EXISTS company (
  company_id TEXT PRIMARY KEY,
  company_name VARCHAR(100) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 002_create_financial_entry_table
CREATE TABLE IF NOT EXISTS financial_entry (
  entry_id TEXT PRIMARY KEY,
  entry_date DATE UNIQUE NOT NULL,
  income DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_financial_entry_date 
ON financial_entry(entry_date);

CREATE INDEX IF NOT EXISTS idx_expense_entry_entry_id 
ON expense_entry(entry_id);

CREATE INDEX IF NOT EXISTS idx_expense_entry_company_id 
ON expense_entry(company_id);

-- 003_create_users_table (and 006_add_avatar_to_users)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
  avatar_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 004_create_settings_table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_enabled', 'false');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_email_recipient', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_email_sender', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_smtp_host', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_smtp_port', '587');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_smtp_user', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_smtp_pass', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_backup_sent_at', '');

-- 005_create_customers_table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  normalized_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_normalized_name 
ON customers(normalized_name);

-- 007_create_transactions_table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('debt', 'payment')),
  amount REAL NOT NULL,
  date DATETIME NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash', 'e-wallet', 'instapay')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price REAL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
