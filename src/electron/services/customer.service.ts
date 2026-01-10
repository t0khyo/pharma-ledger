import { getDatabaseConnection } from "../db/db.js";
import type { Customer, CustomerInput } from "../../shared/types/customer.types.js";

function normalizeArabicName(text: string): string {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "") // Remove tashkeel
    .trim()
    .toLowerCase(); // For English consistency
}

export class CustomerService {
  static getAll(search?: string, sortBy: string = 'created_at', sortOrder: 'ASC' | 'DESC' = 'DESC'): Customer[] {
    const db = getDatabaseConnection();
    
    // Whitelist allowed columns to prevent SQL injection
    const allowedSortColumns = ['name', 'balance', 'created_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

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
      // Normalize the search term as well
      const normalizedSearch = normalizeArabicName(search);
      query += " WHERE c.normalized_name LIKE ? OR c.phone LIKE ?";
      params.push(`%${normalizedSearch}%`, `%${search}%`);
    }

    // Special handling for balance since it's an aggregate
    const sortClause = validSortBy === 'balance' ? 'balance' : `c.${validSortBy}`;
    
    query += ` GROUP BY c.id ORDER BY ${sortClause} ${validSortOrder}`;

    return db.prepare(query).all(...params) as Customer[];
  }

  static add(customer: CustomerInput): Customer {
    const db = getDatabaseConnection();
    const trimmedName = customer.name.trim();
    const normalizedName = normalizeArabicName(trimmedName);
    
    try {
      const result = db
        .prepare(
          "INSERT INTO customers (name, phone, notes, normalized_name) VALUES (?, ?, ?, ?)"
        )
        .run(trimmedName, customer.phone, customer.notes, normalizedName);

      return {
        id: Number(result.lastInsertRowid),
        ...customer,
      };
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error("يوجد عميل مسجل بهذا الاسم بالفعل");
      }
      throw error;
    }
  }

  static update(id: number, customer: CustomerInput): boolean {
    const db = getDatabaseConnection();
    const trimmedName = customer.name.trim();
    const normalizedName = normalizeArabicName(trimmedName);

    try {
      const result = db
        .prepare(
          "UPDATE customers SET name = ?, phone = ?, notes = ?, normalized_name = ? WHERE id = ?"
        )
        .run(trimmedName, customer.phone, customer.notes, normalizedName, id);

      return result.changes > 0;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error("يوجد عميل مسجل بهذا الاسم بالفعل");
      }
      throw error;
    }
  }

  static delete(id: number): boolean {
    const db = getDatabaseConnection();
    const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
