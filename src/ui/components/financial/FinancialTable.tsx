import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import type { Company } from "src/shared/types/company.types";
import type { DailyFinancialRow } from "src/shared/types/financial.types";

interface FinancialTableProps {
  dateRange: { start: Date; end: Date };
  companies: Company[];
  data: DailyFinancialRow[];
  onRowUpdate: (date: string, updatedData: { income: number; expenses: Record<string, number> }) => void;
  loading?: boolean;
}

export function FinancialTable({
  dateRange,
  companies,
  data,
  onRowUpdate,
  loading,
}: FinancialTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [tempData, setTempData] = useState<{
    income: number;
    expenses: Record<string, number>;
  } | null>(null);

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

  const handleEditClick = (row: DailyFinancialRow) => {
    setEditingRow(row.date);
    setTempData({
      income: row.income,
      expenses: { ...row.expenses },
    });
  };

  const handleCancelClick = () => {
    setEditingRow(null);
    setTempData(null);
  };

  const handleSaveClick = (date: string) => {
    if (tempData) {
      onRowUpdate(date, tempData);
      setEditingRow(null);
      setTempData(null);
    }
  };

  const handleInputChange = (
    field: "income" | string,
    value: string
  ) => {
    if (!tempData) return;

    // Convert to number, allow empty string during typing
    const numValue = value === "" ? 0 : parseFloat(value);
    if (isNaN(numValue)) return; // Should be handled by input type, but safety check

    if (field === "income") {
      setTempData({ ...tempData, income: numValue });
    } else {
      setTempData({
        ...tempData,
        expenses: { ...tempData.expenses, [field]: numValue },
      });
    }
  };

  const renderEditableCell = (
    value: number,
    date: string,
    field: "income" | string
  ) => {
    const isEditing = editingRow === date;

    if (isEditing && tempData) {
      const currentValue = field === "income" 
        ? tempData.income 
        : tempData.expenses[field] || 0;

      return (
        <input
          type="number"
          min="0"
          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-right"
          value={currentValue || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          autoFocus={field === "income"}
        />
      );
    }

    return (
      <div className="px-2 py-1 min-h-[2rem] flex items-center justify-start cursor-default">
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
    <div className="border rounded-lg overflow-hidden relative">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-30 shadow-sm">
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
              <TableHead className="text-center font-bold w-24 sticky left-0 bg-background z-20">إجراءات</TableHead>
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

              const isEditing = editingRow === date;

              return (
                <TableRow 
                  key={date} 
                  className={`group transition-all duration-200 ${
                    isEditing 
                      ? "bg-background shadow-2xl ring-2 ring-primary z-20 relative" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <TableCell className="font-medium text-right">
                    {formatDate(date)}
                  </TableCell>
                  <TableCell className={`text-right ${isEditing ? "" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                    {renderEditableCell(
                      row.income,
                      date,
                      "income"
                    )}
                  </TableCell>
                  {companies.map((company, index) => (
                    <TableCell 
                      key={company.company_id} 
                      className={`text-right ${
                        !isEditing && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                      }`}
                    >
                      {renderEditableCell(
                        row.expenses[company.company_id] || 0,
                        date,
                        company.company_id
                      )}
                    </TableCell>
                  ))}
                  <TableCell className={`font-medium text-right ${isEditing ? "" : "bg-yellow-50 dark:bg-yellow-900/20"}`}>
                    {formatCurrency(row.totalExpenses)}
                  </TableCell>
                  <TableCell
                    className={`font-bold text-right ${
                      !isEditing ? "bg-green-50 dark:bg-green-900/20" : ""
                    } ${
                      row.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.netProfit)}
                  </TableCell>
                  <TableCell className={`text-center sticky left-0 z-10 transition-colors ${
                      isEditing ? "bg-background" : "bg-background/95 backdrop-blur-sm"
                  }`}>
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1 animate-in fade-in zoom-in duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => handleSaveClick(date)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={handleCancelClick}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => handleEditClick(row)}
                        disabled={editingRow !== null && editingRow !== date}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
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
