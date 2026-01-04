import { getDatabaseConnection } from "../db.js";
import { createCompanyTable } from "./001_create_company_table.js";
import { createFinancialTables } from "./002_create_financial_entry_table.js";
import { createUsersTable } from "./003_create_users_table.js";
import { createSettingsTable } from "./004_create_settings_table.js";
import { createCustomersTable } from "./005_create_customers_table.js";

export function initDb() {
  // Get the shared database connection
  const db = getDatabaseConnection();

  // Run migrations
  createCompanyTable(db);
  createFinancialTables(db);
  createUsersTable(db);
  createSettingsTable(db);
  createCustomersTable(db);
  console.log("Migrations complete.");
}
