import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "src/shared/types/company.types";
import type { DailyFinancialRow } from "src/shared/types/financial.types";

interface FinancialTableProps {
  dateRange: { start: Date; end: Date };
  companies: Company[];
  data: DailyFinancialRow[];
  onCellUpdate: (date: string, field: string, value: number) => void;
  loading?: boolean;
}

export function FinancialTable({
  dateRange,
  companies,
  data,
  onCellUpdate,
  loading,
}: FinancialTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Generate all dates in range
  const generateDateRange = () => {
    const dates: string[] = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (current <= end) {
      // Use local date format to avoid timezone issues
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const allDates = generateDateRange();

  // Create a map of data by date for quick lookup
  const dataByDate = new Map<string, DailyFinancialRow>();
  data.forEach((row) => {
    dataByDate.set(row.date, row);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat("en-US").format(amount)} ج.م`;
  };

  const handleCellClick = (cellId: string, currentValue: number) => {
    setEditingCell(cellId);
    setEditValue(currentValue.toString());
  };

  const handleCellBlur = (date: string, field: string) => {
    // Convert to number, default to 0 if empty or invalid
    let value = 0;
    if (editValue && editValue.trim() !== '') {
      const parsed = parseFloat(editValue);
      if (!isNaN(parsed) && parsed >= 0) {
        value = parsed;
      }
    }
    
    // Always save, even if 0 (to clear values)
    onCellUpdate(date, field, value);
    setEditingCell(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    date: string,
    field: string
  ) => {
    if (e.key === "Enter") {
      handleCellBlur(date, field);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const renderEditableCell = (
    cellId: string,
    value: number,
    date: string,
    field: string
  ) => {
    const isEditing = editingCell === cellId;

    if (isEditing) {
      return (
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-right"
          value={editValue}
          onChange={(e) => {
            // Only allow numbers and decimal point
            const val = e.target.value;
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              setEditValue(val);
            }
          }}
          onBlur={() => handleCellBlur(date, field)}
          onKeyDown={(e) => handleKeyDown(e, date, field)}
          autoFocus
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[2rem] flex items-center justify-start"
        onClick={() => handleCellClick(cellId, value)}
      >
        {value}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="text-right font-bold w-28">التاريخ</TableHead>
              <TableHead className="text-right font-bold w-32 bg-blue-100 dark:bg-blue-900/50">الإيرادات</TableHead>
              {companies.map((company, index) => (
                <TableHead
                  key={company.company_id}
                  className={`text-right font-bold w-32 ${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
                >
                  {company.company_name}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold w-32 bg-yellow-100 dark:bg-yellow-900/50">
                إجمالي المصروفات
              </TableHead>
              <TableHead className="text-right font-bold w-32 bg-green-100 dark:bg-green-900/50">
                صافي الربح
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allDates.map((date) => {
              const row = dataByDate.get(date) || {
                date,
                income: 0,
                expenses: {},
                totalExpenses: 0,
                netProfit: 0,
              };

              return (
                <TableRow key={date}>
                  <TableCell className="font-medium text-right">
                    {formatDate(date)}
                  </TableCell>
                  <TableCell className="text-right bg-blue-50 dark:bg-blue-900/20">
                    {renderEditableCell(
                      `${date}-income`,
                      row.income,
                      date,
                      "income"
                    )}
                  </TableCell>
                  {companies.map((company, index) => (
                    <TableCell 
                      key={company.company_id} 
                      className={`text-right ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                    >
                      {renderEditableCell(
                        `${date}-${company.company_id}`,
                        row.expenses[company.company_id] || 0,
                        date,
                        company.company_id
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="bg-yellow-50 dark:bg-yellow-900/20 font-medium text-right">
                    {formatCurrency(row.totalExpenses)}
                  </TableCell>
                  <TableCell
                    className={`font-bold text-right bg-green-50 dark:bg-green-900/20 ${
                      row.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.netProfit)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
