import { getDatabaseConnection } from "../db.js";
import { createCompanyTable } from "./001_create_company_table.js";
import { createFinancialTables } from "./002_create_financial_entry_table.js";
import { createUsersTable } from "./003_create_users_table.js";
import { createSettingsTable } from "./004_create_settings_table.js";
import { createCustomersTable } from "./005_create_customers_table.js";
import { addAvatarToUsers } from "./006_add_avatar_to_users.js";
import { createTransactionsTable } from "./007_create_transactions_table.js";
<<<<<<< HEAD
import { addNormalizedNameToCustomers } from "./008_add_normalized_name_to_customers.js";
=======
>>>>>>> afc0fc1f8bab21bc04b67ba4cd14a39707bb7fb5

export function initDb() {
  // Get the shared database connection
  const db = getDatabaseConnection();

  // Run migrations
  createCompanyTable(db);
  createFinancialTables(db);
  createUsersTable(db);
  createSettingsTable(db);
  createCustomersTable(db);
  addAvatarToUsers(db);
  createTransactionsTable(db);
<<<<<<< HEAD
  addNormalizedNameToCustomers(db);
=======
>>>>>>> afc0fc1f8bab21bc04b67ba4cd14a39707bb7fb5
  console.log("Migrations complete.");
}
