import { Database } from "better-sqlite3";

export function addTransactionCompositeIndex(db: Database) {
  console.log("Running migration: 009_add_transaction_composite_index");

  // Add the composite index to speed up the balance calculation joins
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_customer_deleted 
    ON transactions(customer_id, is_deleted);
  `);

  console.log("Migration complete: 009_add_transaction_composite_index");
}
