import { getDatabaseConnection } from "../db/db.js";
import type { Customer, CustomerInput } from "../../shared/types/customer.types.js";

export class CustomerService {
  static getAll(search?: string): Customer[] {
    const db = getDatabaseConnection();
    let query = `
      SELECT c.*, 
        COALESCE(SUM(CASE 
          WHEN t.type = 'payment' THEN t.amount 
          WHEN t.type = 'debt' THEN -t.amount 
          ELSE 0 END), 0) as balance
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.is_deleted = 0
    `;
    let params: any[] = [];

    if (search) {
      query += " WHERE c.name LIKE ? OR c.phone LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " GROUP BY c.id ORDER BY c.created_at DESC";

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
