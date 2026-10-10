import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCash,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { MonthSummary } from "src/shared/types/financial.types";

interface SummaryCardsProps {
  summary: MonthSummary | null;
  loading?: boolean;
  showValues?: boolean;
}

export function SummaryCards({
  summary,
  loading,
  showValues = false,
}: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">جاري التحميل...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: "إجمالي الإيرادات",
      description: "مجموع الدخل اليومي والأموال التي تم تحصيلها خلال هذه الفترة",
      value: summary.totalIncome,
      icon: IconCash,
      color: "text-blue-500",
    },
    {
      title: "إجمالي المصروفات",
      description: "مجموع المدفوعات للشركات والمصروفات التشغيلية الأخرى",
      value: summary.totalExpenses,
      icon: IconTrendingDown,
      color: "text-red-500",
    },
    {
      title: "صافي الربح",
      description: "الفرق بين إجمالي الإيرادات وإجمالي المصروفات (الإيرادات - المصروفات)",
      value: summary.netProfit,
      icon: IconTrendingUp,
      color: summary.netProfit >= 0 ? "text-green-500" : "text-red-500",
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-1 text-sm font-medium">
                {card.title}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      <IconInfoCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    <p className="max-w-[200px] text-center text-sm">{card.description}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {!showValues ? (
                  <span className="blur-md select-none bg-muted/50 rounded px-2">
                    ******
                  </span>
                ) : (
                  <>{formatCurrency(card.value)} ج.م</>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
