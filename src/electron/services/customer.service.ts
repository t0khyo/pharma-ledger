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
  static getAll(options: { search?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC', lateOnly?: boolean, lateDays?: number, limit?: number, offset?: number } = {}): { data: Customer[], total: number } {
    const { search, sortBy = 'created_at', sortOrder = 'DESC', lateOnly, lateDays = 21, limit, offset } = options;
    const db = getDatabaseConnection();
    
    // Whitelist allowed columns to prevent SQL injection
    const allowedSortColumns = ['name', 'balance', 'created_at', 'days_since_activity', 'phone'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    let baseQuery = `
      SELECT c.*, 
        COALESCE(SUM(CASE 
          WHEN t.type = 'payment' THEN t.amount 
          WHEN t.type = 'debt' THEN -t.amount 
          ELSE 0 END), 0) as balance,
        MAX(t.date) as last_activity_date,
        CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(t.date), c.created_at)) AS INTEGER) as days_since_activity
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.is_deleted = 0
    `;
    let params: any[] = [];
    let whereConditions: string[] = [];

    if (search) {
      // Normalize the search term as well
      const normalizedSearch = normalizeArabicName(search);
      whereConditions.push("(c.normalized_name LIKE ? OR c.phone LIKE ?)");
      params.push(`%${normalizedSearch}%`, `%${search}%`);
    }

    if (whereConditions.length > 0) {
      baseQuery += " WHERE " + whereConditions.join(" AND ");
    }

    baseQuery += " GROUP BY c.id";
    
    // Add HAVING clause for late filter
    if (lateOnly) {
      baseQuery += ` HAVING balance < 0 AND days_since_activity >= ${lateDays}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery})`;
    const countResult = db.prepare(countQuery).get(...params) as { count: number };
    const total = countResult.count;

    // Special handling for aggregate columns
    let query = baseQuery;
    const sortClause = (validSortBy === 'balance' || validSortBy === 'days_since_activity') 
      ? validSortBy 
      : `c.${validSortBy}`;
    
    if (validSortBy === "phone") {
      query += ` ORDER BY NULLIF(c.phone, '') IS NULL, c.phone ${validSortOrder}`;
    } else {
      query += ` ORDER BY ${sortClause} ${validSortOrder}`;
    }

    if (limit !== undefined) {
      query += " LIMIT ?";
      params.push(limit);
    }
    if (offset !== undefined) {
      query += " OFFSET ?";
      params.push(offset);
    }

    const data = db.prepare(query).all(...params) as Customer[];
    return { data, total };
  }

  static getStats(options: { search?: string, lateOnly?: boolean, lateDays?: number } = {}): { totalCustomers: number, totalDebts: number, totalBalances: number, netBalance: number } {
    const db = getDatabaseConnection();
    const { search, lateOnly, lateDays = 21 } = options;

    let baseQuery = `
      SELECT c.*, 
        COALESCE(SUM(CASE 
          WHEN t.type = 'payment' THEN t.amount 
          WHEN t.type = 'debt' THEN -t.amount 
          ELSE 0 END), 0) as balance,
        CAST(JULIANDAY('now') - JULIANDAY(COALESCE(MAX(t.date), c.created_at)) AS INTEGER) as days_since_activity
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.is_deleted = 0
    `;
    let params: any[] = [];
    let whereConditions: string[] = [];

    if (search) {
      const normalizedSearch = normalizeArabicName(search);
      whereConditions.push("(c.normalized_name LIKE ? OR c.phone LIKE ?)");
      params.push(`%${normalizedSearch}%`, `%${search}%`);
    }

    if (whereConditions.length > 0) {
      baseQuery += " WHERE " + whereConditions.join(" AND ");
    }

    baseQuery += " GROUP BY c.id";
    
    if (lateOnly) {
      baseQuery += ` HAVING balance < 0 AND days_since_activity >= ${lateDays}`;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as totalCustomers,
        COALESCE(SUM(CASE WHEN balance < 0 THEN -balance ELSE 0 END), 0) as totalDebts,
        COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as totalBalances,
        COALESCE(SUM(balance), 0) as netBalance
      FROM (${baseQuery})
    `;

    return db.prepare(statsQuery).get(...params) as { totalCustomers: number, totalDebts: number, totalBalances: number, netBalance: number };
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
