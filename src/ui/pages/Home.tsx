import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconCreditCard,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconBuildings,
  IconLoader,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/contexts/AuthContext";
import { useSensitive } from "@/contexts/SensitiveContext";
import { useNavigate } from "react-router-dom";
import { formatNumber, formatCurrency } from "@/utils/formatters";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { MonthSelector } from "@/components/financial/MonthSelector";

export default function Home() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { showSensitive } = useSensitive();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 9);
    const end = new Date(year, month + 1, 8);
    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    return { startISO: formatLocalDate(start), endISO: formatLocalDate(end) };
  };


  const range = getDateRange(selectedDate);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', range.startISO, range.endISO],
    queryFn: async () => {
      const res = await window.api.transactions.getDashboardStats();
      if (!res.success) throw new Error("Failed to fetch stats");
      return res.data;
    }
  });

  const { data: trends = [], isLoading: isTrendsLoading } = useQuery({
    queryKey: ['dashboardTrends', range.startISO, range.endISO],
    queryFn: async () => {
      const res = await window.api.transactions.getTrend(range.startISO, range.endISO);
      if (!res.success) throw new Error("Failed to fetch trends");
      return res.data || [];
    }
  });

  const loading = isStatsLoading || isTrendsLoading;
const statCards = [
    {
      title: "الديون غير المسددة",
      description: "مجموع المبالغ المستحقة على العملاء والتي لم يتم تسديدها بعد",
      value: stats ? formatCurrency(stats.unpaidDebts) : "-",
      icon: IconCreditCard,
      color: "text-red-500",
      adminOnly: true,
      sensitive: true,
    },
    {
      title: "عدد العملاء",
      description: "إجمالي عدد العملاء المسجلين في النظام",
      value: stats ? formatNumber(stats.totalCustomers) : "-",
      icon: IconUsers,
      color: "text-blue-500",
      adminOnly: false,
      sensitive: true,
    },
    {
      title: "إيرادات الشهر",
      description: "مجموع الدخل والأموال التي تم تحصيلها خلال الشهر الحالي",
      value: stats ? formatCurrency(stats.monthlyIncome) : "-",
      icon: IconTrendingUp,
      color: "text-green-500",
      adminOnly: true,
      sensitive: true,
    },
    {
      title: "مصروفات الشهر",
      description: "إجمالي المصروفات (الديون) المسجلة خلال الشهر الحالي",
      value: stats ? formatCurrency(stats.monthlyExpenses) : "-",
      icon: IconTrendingDown,
      color: "text-purple-500",
      adminOnly: true,
      sensitive: true,
    },
  ];

  const visibleStats = hasRole("admin")
    ? statCards
    : statCards.filter((s) => !s.adminOnly);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        <IconLoader className="h-8 w-8 animate-spin ml-2" />
        جاري تحميل لوحة التحكم...
      </div>
    );
  }

  const quickActionCards = (
    <>
      <Card 
        className="h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800 transition-all rounded-lg group" 
        onClick={() => navigate("/debts")}
      >
        <div className="p-2 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
          <IconCreditCard className="h-5 w-5 text-red-600" />
        </div>
        <span className="font-medium text-sm text-red-700 dark:text-red-400">الديون</span>
      </Card>
      
      <Card 
        className="h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-all rounded-lg group" 
        onClick={() => navigate("/customers")}
      >
        <div className="p-2 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
          <IconUsers className="h-5 w-5 text-blue-600" />
        </div>
        <span className="font-medium text-sm text-blue-700 dark:text-blue-400">العملاء</span>
      </Card>
      
      <Card 
        className="h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-800 transition-all rounded-lg group" 
        onClick={() => navigate("/reports")}
      >
        <div className="p-2 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
          <IconTrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <span className="font-medium text-sm text-green-700 dark:text-green-400">التقارير</span>
      </Card>
      
      <Card
        className="h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-800 transition-all rounded-lg group"
        onClick={() => navigate("/companies")}
      >
        <div className="p-2 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
          <IconBuildings className="h-5 w-5 text-purple-600" />
        </div>
        <span className="font-medium text-sm text-purple-700 dark:text-purple-400">الشركات</span>
      </Card>
    </>
  );

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                مرحباً، {user?.full_name || "بالكريم"} 👋
              </CardTitle>
              <CardDescription className="mt-1">
                نظرة عامة على نشاط دفتر المحاسبة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid with Enhanced Cards */}
      {hasRole("admin") && (
        <TooltipProvider>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {visibleStats.map((stat) => (
              <Card key={stat.title} className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
                  <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {stat.title}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <IconInfoCircle className="h-3.5 w-3.5 hover:text-foreground transition-colors" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        <p className="max-w-[200px] text-center text-sm">{stat.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <div className={`p-1 rounded-md bg-muted/50`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-xl font-bold">
                    {stat.sensitive && !showSensitive ? (
                      <span className="blur-md select-none bg-muted/50 rounded px-2 py-0.5 text-base">
                        ******
                      </span>
                    ) : (
                      stat.value
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* Charts Section */}
      {hasRole("admin") && (
        <div className="w-full space-y-3">
          <MonthSelector
            selectedDate={selectedDate}
            onMonthChange={setSelectedDate}
          />
          <TrendChart data={trends} loading={loading} />
        </div>
      )}

      {/* Bottom Grid */}
      <div className={`grid gap-3 lg:grid-cols-2`}>
        {/* Activity Timeline - Takes 1 column */}
        <div>
          <ActivityTimeline 
            transactions={stats?.recentTransactions || []} 
            loading={loading} 
          />
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid gap-3 grid-cols-2">
              {quickActionCards}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




