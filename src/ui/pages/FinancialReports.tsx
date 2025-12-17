import { useState, useEffect } from "react";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { SummaryCards } from "@/components/financial/SummaryCards";
import { FinancialTable } from "@/components/financial/FinancialTable";
import { companyService } from "@/services/company.service";
import { financialService } from "@/services/financial.service";
import type { Company } from "src/shared/types/company.types";
import type {
  DailyFinancialRow,
  MonthSummary,
} from "src/shared/types/financial.types";
import { toast } from "sonner";

export default function FinancialReports() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [financialData, setFinancialData] = useState<DailyFinancialRow[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate custom month range (8th to 9th of next month)
  const getDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 8);
    const end = new Date(year, month + 1, 9);

    // Format as YYYY-MM-DD using local date to avoid timezone issues
    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      start,
      end,
      startISO: formatLocalDate(start),
      endISO: formatLocalDate(end),
    };
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companyService.getAll();
        setCompanies(data);
      } catch (error) {
        toast.error("فشل في تحميل الشركات");
        console.error(error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch financial data when month changes
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      try {
        const range = getDateRange(selectedDate);

        // Fetch entries
        const entries = await financialService.getEntriesForDateRange(
          range.startISO,
          range.endISO
        );
        setFinancialData(entries);

        // Fetch summary
        const summaryData = await financialService.getMonthSummary(
          range.startISO,
          range.endISO
        );
        setSummary(summaryData);
      } catch (error) {
        toast.error("فشل في تحميل البيانات المالية");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [selectedDate]);

  // Handle cell update
  const handleCellUpdate = async (
    date: string,
    field: string,
    value: number
  ) => {
    try {
      // Get existing data for this date
      const existingRow = financialData.find((row) => row.date === date);

      // Build the expenses array
      const expenses: Array<{ company_id: string; amount: number }> = [];

      if (field === "income") {
        // Update income, keep existing expenses
        companies.forEach((company) => {
          const amount = existingRow?.expenses[company.company_id] || 0;
          if (amount > 0) {
            expenses.push({ company_id: company.company_id, amount });
          }
        });
      } else {
        // Update expense for a specific company
        companies.forEach((company) => {
          let amount = existingRow?.expenses[company.company_id] || 0;
          if (company.company_id === field) {
            amount = value;
          }
          if (amount > 0) {
            expenses.push({ company_id: company.company_id, amount });
          }
        });
      }

      // Upsert entry
      const updatedRow = await financialService.upsertEntry({
        date,
        income: field === "income" ? value : existingRow?.income || 0,
        expenses,
      });

      // Update local state
      setFinancialData((prev) => {
        const index = prev.findIndex((row) => row.date === date);
        if (index >= 0) {
          const newData = [...prev];
          newData[index] = updatedRow;
          return newData;
        } else {
          return [...prev, updatedRow].sort((a, b) =>
            a.date.localeCompare(b.date)
          );
        }
      });

      // Recalculate summary
      const range = getDateRange(selectedDate);
      const summaryData = await financialService.getMonthSummary(
        range.startISO,
        range.endISO
      );
      setSummary(summaryData);

      toast.success("تم حفظ البيانات");
    } catch (error) {
      toast.error("فشل في حفظ البيانات");
      console.error(error);
    }
  };

  const dateRange = getDateRange(selectedDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التقارير المالية</h1>
        <p className="text-muted-foreground">
          سجل يومي للإيرادات والمصروفات مع الشركات
        </p>
      </div>

      <MonthSelector
        selectedDate={selectedDate}
        onMonthChange={setSelectedDate}
      />

      <SummaryCards summary={summary} loading={loading} />

      <FinancialTable
        dateRange={dateRange}
        companies={companies}
        data={financialData}
        onCellUpdate={handleCellUpdate}
        loading={loading}
      />
    </div>
  );
}
