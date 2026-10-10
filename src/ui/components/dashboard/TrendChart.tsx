import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import type { DailyTrend } from "src/shared/types/transaction.types";
import { formatCurrency } from "@/utils/formatters";
import { useSensitive } from "@/contexts/SensitiveContext";

interface TrendChartProps {
  data: DailyTrend[];
  loading?: boolean;
}

export function TrendChart({ data, loading }: TrendChartProps) {
  const { showSensitive } = useSensitive();

  // Format data for chart
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      displayDate: format(parseISO(item.date), "d MMM", { locale: ar }),
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="border-border/50 h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</div>
      </Card>
    );
  }



  return (
    <Card className="border-border/50 h-[300px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">مؤشر الأرباح والمصروفات</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-4 px-2" style={{ direction: 'ltr' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickFormatter={(value) => showSensitive ? `${value}` : '***'}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background text-foreground border border-border rounded-lg shadow-lg p-3 text-sm" style={{ direction: 'rtl' }}>
                      <p className="font-medium mb-2">{label}</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-muted-foreground">الإيرادات:</span>
                          <span className="font-bold text-green-500">
                            {showSensitive ? formatCurrency(payload[0].value as number) : '******'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-muted-foreground">المصروفات:</span>
                          <span className="font-bold text-red-500">
                            {showSensitive ? formatCurrency(payload[1].value as number) : '******'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorIncome)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorExpense)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

