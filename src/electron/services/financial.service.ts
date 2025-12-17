/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  FinancialEntry,
  ExpenseEntry,
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
  FinancialEntryWithExpenses,
} from "../../shared/types/financial.types.js";

export class FinancialService {
  constructor(private db: Database) {}

  /**
   * Get all financial entries with their expenses for a date range
   */
  getEntriesForDateRange(
    startDate: string,
    endDate: string
  ): DailyFinancialRow[] {
    // Get all entries in the date range
    const entriesStmt = this.db.prepare(`
      SELECT * FROM financial_entry
      WHERE entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date ASC
    `);
    const entries = entriesStmt.all(startDate, endDate) as FinancialEntry[];

    // Get all expenses for these entries
    const expensesStmt = this.db.prepare(`
      SELECT e.* 
      FROM expense_entry e
      INNER JOIN financial_entry f ON e.entry_id = f.entry_id
      WHERE f.entry_date >= ? AND f.entry_date <= ?
    `);
    const expenses = expensesStmt.all(startDate, endDate) as ExpenseEntry[];

    // Group expenses by entry_id
    const expensesByEntry = new Map<string, ExpenseEntry[]>();
    expenses.forEach((expense) => {
      if (!expensesByEntry.has(expense.entry_id)) {
        expensesByEntry.set(expense.entry_id, []);
      }
      expensesByEntry.get(expense.entry_id)!.push(expense);
    });

    // Convert to DailyFinancialRow format
    return entries.map((entry) => {
      const entryExpenses = expensesByEntry.get(entry.entry_id) || [];
      const expensesMap: Record<string, number> = {};
      let totalExpenses = 0;

      entryExpenses.forEach((exp) => {
        expensesMap[exp.company_id] = exp.amount;
        totalExpenses += exp.amount;
      });

      return {
        date: entry.entry_date,
        income: entry.income,
        expenses: expensesMap,
        totalExpenses,
        netProfit: entry.income - totalExpenses,
      };
    });
  }

  /**
   * Create or update a daily entry with income and expenses
   */
  upsertEntry(data: UpsertDailyEntryDTO): DailyFinancialRow {
    // Start a transaction
    const upsert = this.db.transaction(() => {
      // Check if entry exists
      let entry = this.getEntryByDate(data.date);

      if (entry) {
        // Update existing entry
        const updateStmt = this.db.prepare(`
          UPDATE financial_entry
          SET income = ?, updated_at = CURRENT_TIMESTAMP
          WHERE entry_id = ?
        `);
        updateStmt.run(data.income, entry.entry_id);

        // Delete existing expenses for this entry
        const deleteExpensesStmt = this.db.prepare(`
          DELETE FROM expense_entry WHERE entry_id = ?
        `);
        deleteExpensesStmt.run(entry.entry_id);
      } else {
        // Create new entry
        const entry_id = uuidv4();
        const insertStmt = this.db.prepare(`
          INSERT INTO financial_entry (entry_id, entry_date, income)
          VALUES (?, ?, ?)
        `);
        insertStmt.run(entry_id, data.date, data.income);
        entry = this.getEntryByDate(data.date)!;
      }

      // Insert new expenses
      if (data.expenses && data.expenses.length > 0) {
        const insertExpenseStmt = this.db.prepare(`
          INSERT INTO expense_entry (expense_id, entry_id, company_id, amount)
          VALUES (?, ?, ?, ?)
        `);

        data.expenses.forEach((expense) => {
          const expense_id = uuidv4();
          insertExpenseStmt.run(
            expense_id,
            entry.entry_id,
            expense.company_id,
            expense.amount
          );
        });
      }

      // Return the updated entry as DailyFinancialRow
      const result = this.getEntriesForDateRange(data.date, data.date);
      return result[0];
    });

    return upsert();
  }

  /**
   * Get entry by date
   */
  private getEntryByDate(date: string): FinancialEntry | null {
    const stmt = this.db.prepare(`
      SELECT * FROM financial_entry WHERE entry_date = ?
    `);
    return stmt.get(date) as FinancialEntry | null;
  }

  /**
   * Get monthly summary statistics
   */
  getMonthSummary(startDate: string, endDate: string): MonthSummary {
    const rows = this.getEntriesForDateRange(startDate, endDate);

    const totalIncome = rows.reduce((sum, row) => sum + row.income, 0);
    const totalExpenses = rows.reduce((sum, row) => sum + row.totalExpenses, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      startDate,
      endDate,
    };
  }

  /**
   * Delete entry by date
   */
  deleteEntry(date: string): boolean {
    const entry = this.getEntryByDate(date);
    if (!entry) return false;

    const stmt = this.db.prepare(`
      DELETE FROM financial_entry WHERE entry_id = ?
    `);
    const result = stmt.run(entry.entry_id);
    return result.changes > 0;
  }
}
