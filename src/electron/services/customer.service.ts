import { getDatabaseConnection } from "../db/db.js";
import type { Customer, CustomerInput } from "../../shared/types/customer.types.js";

export class CustomerService {
  static getAll(search?: string): Customer[] {
    const db = getDatabaseConnection();
    let query = "SELECT * FROM customers ORDER BY created_at DESC";
    let params: any[] = [];

    if (search) {
      query = "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY created_at DESC";
      params = [`%${search}%`, `%${search}%`];
    }

    return db.prepare(query).all(...params) as Customer[];
  }

  static add(customer: CustomerInput): Customer {
    const db = getDatabaseConnection();
    const result = db
      .prepare(
        "INSERT INTO customers (name, phone, notes) VALUES (?, ?, ?)"
      )
      .run(customer.name, customer.phone, customer.notes);

    return {
      id: Number(result.lastInsertRowid),
      ...customer,
    };
  }

  static update(id: number, customer: CustomerInput): boolean {
    const db = getDatabaseConnection();
    const result = db
      .prepare(
        "UPDATE customers SET name = ?, phone = ?, notes = ? WHERE id = ?"
      )
      .run(customer.name, customer.phone, customer.notes, id);

    return result.changes > 0;
  }

  static delete(id: number): boolean {
    const db = getDatabaseConnection();
    const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
