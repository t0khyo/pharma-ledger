import Database from "better-sqlite3";
import { createCompanyTable } from "./001_create_company_table.js";

export let db: Database.Database;

export function initDb() {
  // Create or open database
  db = new Database("./app.db");
  console.log("Database connected!");

  // Run migrations
  createCompanyTable(db);
  console.log("Migrations complete.");
}
