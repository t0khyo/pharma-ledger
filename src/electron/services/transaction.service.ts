import { getDatabaseConnection } from "../db/db.js";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionStats,
  DailyTrend,
  SmartAlert,
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
  static getTransactions(filters: TransactionFilters): { data: Transaction[], total: number } {
    const db = getDatabaseConnection();
    let baseQuery = `
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.is_deleted = 0
    `;
    const params: any[] = [];

    if (filters.customerId) {
      baseQuery += " AND t.customer_id = ?";
      params.push(filters.customerId);
    }

    if (filters.startDate) {
      baseQuery += " AND date(t.date) >= date(?)";
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      baseQuery += " AND date(t.date) <= date(?)";
      params.push(filters.endDate);
    }

    if (filters.query) {
      baseQuery += " AND c.name LIKE ?";
      params.push(`%${filters.query}%`);
    }

    // Get total count
    const countResult = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`).get(...params) as { count: number };
    const total = countResult.count;

    // Build main query
    let query = `SELECT t.*, c.name as customer_name ${baseQuery}`;
    query += " ORDER BY t.date DESC, t.created_at DESC";

    if (filters.limit !== undefined) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }
    
    if (filters.offset !== undefined) {
      query += " OFFSET ?";
      params.push(filters.offset);
    }

    const transactions = db.prepare(query).all(...params) as any[];

    if (transactions.length > 0) {
      const ids = transactions.map(t => t.id).join(",");
      const items = db.prepare(`SELECT * FROM transaction_items WHERE transaction_id IN (${ids})`).all() as any[];
      
      const data = transactions.map(t => ({
        ...t,
        items: items.filter(i => i.transaction_id === t.id)
      }));
      return { data, total };
    }

    return { data: [], total };
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

    // 3. Current Month Income & Expenses
    const currentMonthResult = db.prepare(`
        SELECT 
            (SELECT COALESCE(SUM(income), 0) FROM financial_entry WHERE entry_date >= date('now', 'localtime', 'start of month')) as monthlyIncome,
            (SELECT COALESCE(SUM(e.amount), 0) FROM expense_entry e JOIN financial_entry f ON e.entry_id = f.entry_id WHERE f.entry_date >= date('now', 'localtime', 'start of month')) as monthlyExpenses
    `).get() as { monthlyIncome: number, monthlyExpenses: number };
    
    const monthlyIncome = currentMonthResult.monthlyIncome || 0;
    const monthlyExpenses = currentMonthResult.monthlyExpenses || 0;

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
        monthlyExpenses,
        recentTransactions: recent
    };
  }

  /**
   * Get financial trend (Income vs Expenses) for a specific date range
   */
  static getTrend(startDate: string, endDate: string): DailyTrend[] {
    const db = getDatabaseConnection();
    
    // Safety limit of 100 days to prevent infinite recursion if dates are wrong
    const query = `
      WITH RECURSIVE dates(date) AS (
        SELECT ?
        UNION ALL
        SELECT date(date, '+1 day')
        FROM dates
        WHERE date < ? AND CAST(JULIANDAY(date) - JULIANDAY(?) AS INTEGER) < 100
      )
      SELECT 
        d.date,
        COALESCE(MAX(f.income), 0) as income,
        COALESCE(SUM(e.amount), 0) as expenses
      FROM dates d
      LEFT JOIN financial_entry f ON f.entry_date = d.date
      LEFT JOIN expense_entry e ON e.entry_id = f.entry_id
      GROUP BY d.date
      ORDER BY d.date ASC;
    `;
    
    return db.prepare(query).all(startDate, endDate, startDate) as DailyTrend[];
  }

  /**
   * Get smart alerts for the dashboard
   */
  static getSmartAlerts(): SmartAlert[] {
    const db = getDatabaseConnection();
    const alerts: SmartAlert[] = [];

    // Alert 1 (Old debts) removed as requested.

    // Alert 2: High total debts (more than 10,000 EGP for example)
    const unpaidDebtsQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as unpaid_debts
        FROM transactions 
        WHERE is_deleted = 0
    `;
    const unpaidDebtsResult = db.prepare(unpaidDebtsQuery).get() as { unpaid_debts: number };
    if (unpaidDebtsResult && unpaidDebtsResult.unpaid_debts > 10000) {
      alerts.push({
        id: 'high-debts',
        type: 'destructive',
        message: `تنبيه: إجمالي الديون غير المسددة تجاوز 10,000 ج.م (${unpaidDebtsResult.unpaid_debts} ج.م)`,
        createdAt: new Date().toISOString(),
      });
    }

    // Alert 3: 0 Income today (if it's after 12 PM)
    const currentHour = new Date().getHours();
    if (currentHour >= 12) {
      const todayIncomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as income
        FROM transactions
        WHERE type = 'payment' AND is_deleted = 0 AND date(date) = date('now', 'localtime')
      `;
      const todayIncomeResult = db.prepare(todayIncomeQuery).get() as { income: number };
      if (todayIncomeResult && todayIncomeResult.income === 0) {
        alerts.push({
          id: 'no-income',
          type: 'default',
          message: 'لم يتم تسجيل أي إيرادات اليوم حتى الآن.',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }
}
