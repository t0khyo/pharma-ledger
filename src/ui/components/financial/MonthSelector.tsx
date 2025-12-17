import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
}

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function MonthSelector({
  selectedDate,
  onMonthChange,
}: MonthSelectorProps) {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Calculate custom month range (8th to 9th of next month)
  const startDate = new Date(currentYear, currentMonth, 8);
  const endDate = new Date(currentYear, currentMonth + 1, 9);

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    onMonthChange(newDate);
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="flex items-center justify-between bg-card border rounded-lg p-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            من {formatDate(startDate)} إلى {formatDate(endDate)}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        الشهر المحاسبي: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} يوم
      </div>
    </div>
  );
}
