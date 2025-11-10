import { getDatabaseConnection } from "../db.js";
import { createCompanyTable } from "./001_create_company_table.js";

export function initDb() {
  // Get the shared database connection
  const db = getDatabaseConnection();

  // Run migrations
  createCompanyTable(db);
  console.log("Migrations complete.");
}
