import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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

  // Calculate custom month range (9th to 8th of next month)
  const getDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 9);
    const end = new Date(year, month + 1, 8);

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

  // Handle row update
  const handleRowUpdate = async (
    date: string,
    updatedData: { income: number; expenses: Record<string, number> }
  ) => {
    try {
      // Build the expenses array for API
      const expenses: Array<{ company_id: string; amount: number }> = [];
      Object.entries(updatedData.expenses).forEach(([companyId, amount]) => {
        if (amount > 0) {
          expenses.push({ company_id: companyId, amount });
        }
      });

      // Upsert entry with all data
      const updatedRow = await financialService.upsertEntry({
        date,
        income: updatedData.income,
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

      toast.success("تم حفظ البيانات بنجاح");
    } catch (error) {
      toast.error("فشل في حفظ البيانات");
      console.error(error);
    }
  };

  const dateRange = getDateRange(selectedDate);

  const handleExport = () => {
    const { start, end } = dateRange;

    // Helper to format date consistent with how it is stored
    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const excelData = [];
    const current = new Date(start);

    // Loop through every day in the range
    while (current <= end) {
      const dateStr = formatLocalDate(current);
      const row = financialData.find((r) => r.date === dateStr);

      const rowData: Record<string, string | number> = {
        التاريخ: dateStr,
        "الإيراد اليومي": row?.income || 0,
      };

      // Add expense columns for each company
      companies.forEach((company) => {
        rowData[company.company_name] = row?.expenses[company.company_id] || 0;
      });

      rowData["إجمالي المصروفات"] = row?.totalExpenses || 0;
      rowData["صافي الربح"] = row?.netProfit || 0;

      excelData.push(rowData);

      // Next day
      current.setDate(current.getDate() + 1);
    }

    // Calculate totals row
    const totalRow: Record<string, string | number> = {
      التاريخ: "الإجمالي",
      "الإيراد اليومي": summary?.totalIncome || 0,
    };

    companies.forEach((company) => {
      // Sum up expenses for this company from the loaded data
      // Note: We use financialData (actual data) for the sum, which is correct
      // because missing days have 0 expenses anyway.
      const totalCompanyExpense = financialData.reduce(
        (sum, r) => sum + (r.expenses[company.company_id] || 0),
        0
      );
      totalRow[company.company_name] = totalCompanyExpense;
    });

    totalRow["إجمالي المصروفات"] = summary?.totalExpenses || 0;
    totalRow["صافي الربح"] = summary?.netProfit || 0;

    excelData.push(totalRow);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const wscols = [
      { wch: 15 }, // Date
      { wch: 15 }, // Income
      ...companies.map(() => ({ wch: 20 })), // Companies
      { wch: 20 }, // Total Expenses
      { wch: 20 }, // Net Profit
    ];
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");

    // Generate filename
    const { startISO, endISO } = dateRange;
    const fileName = `Financial_Report_${startISO}_to_${endISO}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

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

      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      <FinancialTable
        dateRange={dateRange}
        companies={companies}
        data={financialData}
        onRowUpdate={handleRowUpdate}
        loading={loading}
      />
    </div>
  );
}
