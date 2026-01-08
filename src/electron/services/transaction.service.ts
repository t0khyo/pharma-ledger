import { getDatabaseConnection } from "../db/db.js";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from "../../shared/types/transaction.types.js";

export class TransactionService {
  /**
   * Add a new debt or payment transaction
   */
  static addTransaction(input: CreateTransactionInput): Transaction {
    const db = getDatabaseConnection();
    
    const transaction = db.transaction(() => {
      // Insert transaction
      const stmt = db.prepare(`
        INSERT INTO transactions (customer_id, type, amount, date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        input.customer_id,
        input.type,
        input.amount,
        input.date,
        input.payment_method || null,
        input.notes || null
      );
      
      const transactionId = result.lastInsertRowid as number;

      // Insert items if present
      if (input.items && input.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO transaction_items (transaction_id, product_name, quantity, price)
          VALUES (?, ?, ?, ?)
        `);

        for (const item of input.items) {
          itemStmt.run(
            transactionId,
            item.product_name,
            item.quantity || 1,
            item.price || null
          );
        }
      }

      return this.getTransactionById(transactionId);
    })();
    
    if (!transaction) throw new Error("Failed to create transaction");
    return transaction;
  }

  /**
   * Get transaction by ID with items
   */
  static getTransactionById(id: number): Transaction | undefined {
    const db = getDatabaseConnection();
    
    const transaction = db
      .prepare(`
        SELECT t.*, c.name as customer_name 
        FROM transactions t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.id = ?
      `)
      .get(id) as any;

    if (!transaction) return undefined;

    const items = db
      .prepare("SELECT * FROM transaction_items WHERE transaction_id = ?")
      .all(id) as any[];

    return {
      ...transaction,
      items,
    };
  }

  /**
   * Get all transactions with optional filtering
   */
  static getTransactions(filters: TransactionFilters): Transaction[] {
    const db = getDatabaseConnection();
    let query = `
      SELECT t.*, c.name as customer_name 
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters.customerId) {
      query += " AND t.customer_id = ?";
      params.push(filters.customerId);
    }

    if (filters.startDate) {
      query += " AND date(t.date) >= date(?)";
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += " AND date(t.date) <= date(?)";
      params.push(filters.endDate);
    }

    if (filters.query) {
      query += " AND c.name LIKE ?";
      params.push(`%${filters.query}%`);
    }

    query += " ORDER BY t.date DESC, t.created_at DESC";

    const transactions = db.prepare(query).all(...params) as any[];

    // Ideally we should batch load items or load on demand, 
    // but for now let's load minimal item info (e.g. concatenated string) or just keep it simple.
    // The requirement says "products(comma seperated)" for the table.
    // Let's attach items for all loaded transactions.
    
    // Optimization: Get all item strings for these transactions
    if (transactions.length > 0) {
      const ids = transactions.map(t => t.id).join(",");
      const items = db.prepare(`SELECT * FROM transaction_items WHERE transaction_id IN (${ids})`).all() as any[];
      
      return transactions.map(t => ({
        ...t,
        items: items.filter(i => i.transaction_id === t.id)
      }));
    }

    return [];
  }

  /**
   * Delete transaction
   */
  static deleteTransaction(id: number): boolean {
    const db = getDatabaseConnection();
    // Soft delete
    const result = db.prepare("UPDATE transactions SET is_deleted = 1 WHERE id = ?").run(id);
    return result.changes > 0;
  }

  /**
   * Get stats
   */
  static getStats(filters: TransactionFilters): TransactionStats {
    const db = getDatabaseConnection();
    
    let query = `
      SELECT 
        SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END) as totalDebts,
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as totalPayments
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters.customerId) {
        query += " AND t.customer_id = ?";
        params.push(filters.customerId);
    }
  
    if (filters.startDate) {
        query += " AND date(t.date) >= date(?)";
        params.push(filters.startDate);
    }
  
    if (filters.endDate) {
        query += " AND date(t.date) <= date(?)";
        params.push(filters.endDate);
    }
  
    if (filters.query) {
        query += " AND c.name LIKE ?";
        params.push(`%${filters.query}%`);
    }

    const result = db.prepare(query).get(...params) as any;
    
    // Calculate total unpaid debts (sum of negative balances only)
    let unpaidDebtsQuery = `
        SELECT 
            SUM(CASE 
                WHEN balance < 0 THEN ABS(balance) 
                ELSE 0 
            END) as unpaidDebts
        FROM (
            SELECT 
                SUM(CASE 
                    WHEN t.type = 'payment' THEN t.amount 
                    WHEN t.type = 'debt' THEN -t.amount 
                    ELSE 0 
                END) as balance
            FROM transactions t
            WHERE t.is_deleted = 0
    `;

    // Apply same filters to the subquery
    if (filters.customerId) {
        unpaidDebtsQuery += " AND t.customer_id = ?";
    }
    if (filters.startDate) {
        unpaidDebtsQuery += " AND date(t.date) >= date(?)";
    }
    if (filters.endDate) {
        unpaidDebtsQuery += " AND date(t.date) <= date(?)";
    }
    // Note: 'query' (customer name search) is trickier in subquery if we filter transactions first, 
    // but usually balance is per customer. 
    // If we filter by customer name, we should join customers in subquery.
    if (filters.query) {
         unpaidDebtsQuery += ` 
            AND t.customer_id IN (SELECT id FROM customers WHERE name LIKE ?)
         `;
    }

    unpaidDebtsQuery += " GROUP BY t.customer_id) as customer_balances";

    // Reuse params for the subquery
    const unpaidResult = db.prepare(unpaidDebtsQuery).get(...params) as any;

    const totalDebts = result.totalDebts || 0;
    const totalPayments = result.totalPayments || 0;
    const unpaidDebts = unpaidResult?.unpaidDebts || 0;

    return {
      totalDebts,
      totalPayments,
      unpaidDebts,
      netBalance: totalPayments - totalDebts
    };
  }

  /**
   * Get dashboard stats
   */
  static getDashboardStats(): any {
    const db = getDatabaseConnection();

    // 1. Unpaid Debts (Sum of negative customer balances)
    let unpaidDebtsQuery = `
        SELECT 
            SUM(CASE 
                WHEN balance < 0 THEN ABS(balance) 
                ELSE 0 
            END) as unpaidDebts
        FROM (
            SELECT 
                SUM(CASE 
                    WHEN t.type = 'payment' THEN t.amount 
                    WHEN t.type = 'debt' THEN -t.amount 
                    ELSE 0 
                END) as balance
            FROM transactions t
            WHERE t.is_deleted = 0
            GROUP BY t.customer_id
        ) as customer_balances
    `;
    const unpaidResult = db.prepare(unpaidDebtsQuery).get() as any;
    const unpaidDebts = unpaidResult?.unpaidDebts || 0;

    // 2. Total Customers
    const customersResult = db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
    const totalCustomers = customersResult.count || 0;

    // 3. Monthly Income (Payments in current month)
    const incomeResult = db.prepare(`
        SELECT SUM(amount) as total 
        FROM transactions 
        WHERE type = 'payment' 
        AND is_deleted = 0 
        AND date(date) >= date('now', 'start of month')
    `).get() as { total: number };
    const monthlyIncome = incomeResult.total || 0;

    // 4. Total Companies
    const companiesResult = db.prepare("SELECT COUNT(*) as count FROM company").get() as { count: number };
    const totalCompanies = companiesResult.count || 0;

    // 5. Recent Transactions
    const recentQuery = `
      SELECT t.*, c.name as customer_name 
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.is_deleted = 0
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 5
    `;
    const recent = db.prepare(recentQuery).all() as any[];

    // Fetch items for these transactions
    if (recent.length > 0) {
        const ids = recent.map(t => t.id).join(",");
        const items = db.prepare(`SELECT * FROM transaction_items WHERE transaction_id IN (${ids})`).all() as any[];
        
        recent.forEach(t => {
            t.items = items.filter(i => i.transaction_id === t.id);
        });
    }

    return {
        unpaidDebts,
        totalCustomers,
        monthlyIncome,
        totalCompanies,
        recentTransactions: recent
    };
  }
}
