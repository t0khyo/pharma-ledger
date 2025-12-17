import type {
  DailyFinancialRow,
  MonthSummary,
  UpsertDailyEntryDTO,
} from "src/shared/types/financial.types";

export class FinancialService {
  async getEntriesForDateRange(
    startDate: string,
    endDate: string
  ): Promise<DailyFinancialRow[]> {
    const response = await window.api.financial.getEntriesForDateRange(
      startDate,
      endDate
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to get financial entries");
    }

    return response.data!;
  }

  async upsertEntry(data: UpsertDailyEntryDTO): Promise<DailyFinancialRow> {
    const response = await window.api.financial.upsertEntry(data);

    if (!response.success) {
      throw new Error(response.error || "Failed to save financial entry");
    }

    return response.data!;
  }

  async getMonthSummary(
    startDate: string,
    endDate: string
  ): Promise<MonthSummary> {
    const response = await window.api.financial.getMonthSummary(
      startDate,
      endDate
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to get month summary");
    }

    return response.data!;
  }

  async deleteEntry(date: string): Promise<void> {
    const response = await window.api.financial.deleteEntry(date);

    if (!response.success) {
      throw new Error(response.error || "Failed to delete entry");
    }
  }
}

export const financialService = new FinancialService();
