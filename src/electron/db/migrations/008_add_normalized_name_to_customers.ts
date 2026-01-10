import { Database } from "better-sqlite3";

// Arabic normalization function
function normalizeArabicName(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "") // Remove tashkeel
    .trim()
    .toLowerCase(); // For English consistency if mixed
}

export function addNormalizedNameToCustomers(db: Database) {
  console.log("Running migration: 008_add_normalized_name_to_customers");

  // 1. Add the column
  try {
    db.exec(`ALTER TABLE customers ADD COLUMN normalized_name TEXT;`);
  } catch (error: any) {
    if (!error.message.includes("duplicate column name")) {
      throw error;
    }
  }

  // 2. Populate normalized_name for existing customers
  const customers = db.prepare("SELECT id, name FROM customers").all() as { id: number, name: string }[];
  
  const updateStmt = db.prepare("UPDATE customers SET normalized_name = ? WHERE id = ?");

  db.transaction(() => {
    for (const customer of customers) {
        const normalized = normalizeArabicName(customer.name);
        updateStmt.run(normalized, customer.id);
    }
  })();

  // 3. Create UNIQUE index
  // We use a unique index on normalized_name to enforce uniqueness
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_normalized_name 
    ON customers(normalized_name);
  `);

  console.log("Migration complete: 008_add_normalized_name_to_customers");
}
