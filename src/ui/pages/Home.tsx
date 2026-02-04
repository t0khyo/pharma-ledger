import { useState, useEffect } from "react";
import {
  IconCreditCard,
  IconUsers,
  IconTrendingUp,
  IconBuildings,
  IconEye,
  IconEyeOff,
  IconLoader,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { DashboardStats } from "src/shared/types/transaction.types";
import { toast } from "sonner";
import { formatNumber, formatCurrency } from "@/utils/formatters";

export default function Home() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [showSensitive, setShowSensitive] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const result = await window.api.transactions.getDashboardStats();
      if (result.success) {
        setStats(result.data || null);
      } else {
        toast.error("فشل تحميل البيانات");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "الديون غير المسددة",
      value: stats ? formatCurrency(stats.unpaidDebts) : "-",
      icon: IconCreditCard,
      color: "text-red-500",
      adminOnly: true,
      sensitive: true,
    },
    {
      title: "عدد العملاء",
      value: stats ? formatNumber(stats.totalCustomers) : "-",
      icon: IconUsers,
      color: "text-blue-500",
      adminOnly: false,
    },
    {
      title: "إيرادات الشهر",
      value: stats ? formatCurrency(stats.monthlyIncome) : "-",
      icon: IconTrendingUp,
      color: "text-green-500",
      adminOnly: true,
      sensitive: true,
    },
    {
      title: "عدد الشركات",
      value: stats ? formatNumber(stats.totalCompanies) : "-",
      icon: IconBuildings,
      color: "text-purple-500",
      adminOnly: false,
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

            {hasRole("admin") && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSensitive(!showSensitive)}
                title={showSensitive ? "إخفاء القيم" : "إظهار القيم"}
                className="h-8 w-8 rounded-lg"
              >
                {showSensitive ? (
                  <IconEyeOff className="h-3.5 w-3.5" />
                ) : (
                  <IconEye className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid with Enhanced Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
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

      {/* Main Content Grid */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Donut Chart Section - Takes 1 column */}
        {hasRole("admin") && stats && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">التوزيع المالي</CardTitle>
              <CardDescription className="text-xs">نسبة الديون والمدفوعات</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {(() => {
                const total = stats.monthlyIncome + stats.unpaidDebts;
                const paidPercentage = total > 0 ? (stats.monthlyIncome / total) * 100 : 0;
                const debtPercentage = total > 0 ? (stats.unpaidDebts / total) * 100 : 0;
                
                // SVG donut chart calculations
                const size = 180;
                const strokeWidth = 24;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const gapDegrees = 0; // Larger gap between segments
                const gapPercentage = (gapDegrees / 360) * 100;
                
                return (
                  <div className="flex flex-col items-center gap-6">
                    {/* Chart Container */}
                    <div className="relative w-full flex justify-center">
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size} className="transform -rotate-90">
                          {/* Background circle */}
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-muted/20"
                          />
                          
                          {/* Green segment (payments) - no glow */}
                          {paidPercentage > 0 && (
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              fill="none"
                              stroke="#27c68b"
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${((paidPercentage - gapPercentage) / 100) * circumference} ${circumference}`}
                              strokeDashoffset={0}
                              strokeLinecap="butt"
                              className="transition-all duration-500"
                            />
                          )}
                          
                          {/* Pink segment (debts) - no glow */}
                          {debtPercentage > 0 && (
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              fill="none"
                              stroke="#ee6875"
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${((debtPercentage - gapPercentage) / 100) * circumference} ${circumference}`}
                              strokeDashoffset={-((paidPercentage + gapPercentage) / 100) * circumference}
                              strokeLinecap="butt"
                              className="transition-all duration-500"
                            />
                          )}
                        </svg>
                        {/* Center text - Total */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
                          <p className="text-xl font-bold">
                            {showSensitive ? formatCurrency(total) : '***'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend - Bottom */}
                    <div className="w-full grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#27c68b' }}></div>
                          <span className="text-xs text-muted-foreground">تسديدات</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#27c68b' }}>
                          {showSensitive ? formatCurrency(stats.monthlyIncome) : '***'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(paidPercentage)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ee6875' }}></div>
                          <span className="text-xs text-muted-foreground">ديون</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#ee6875' }}>
                          {showSensitive ? formatCurrency(stats.unpaidDebts) : '***'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(debtPercentage)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Recent Activities - Takes 2 columns */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">النشاط الأخير</CardTitle>
                <CardDescription className="text-xs">آخر 5 عمليات</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/debts")}
                className="text-xs h-7"
              >
                عرض الكل ←
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-1.5">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1 rounded-md ${activity.type === 'debt' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                      {activity.type === 'debt' ? (
                        <IconCreditCard className="h-3 w-3 text-red-500" />
                      ) : (
                        <IconTrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{activity.customer_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {activity.type === 'debt' ? (
                            activity.items && activity.items.length > 0 
                            ? activity.items.map((i: any) => i.product_name).join('، ')
                            : (activity.notes || 'بدون تفاصيل')
                        ) : (
                            // Payment type - show payment method and notes
                            (() => {
                              const methodText = activity.payment_method === 'cash' ? 'نقداً' :
                                               activity.payment_method === 'instapay' ? 'إنستا باي' :
                                               activity.payment_method === 'e-wallet' ? 'محفظة إلكترونية' :
                                               activity.payment_method || '';
                              
                              if (methodText && activity.notes) {
                                return `${methodText} - ${activity.notes}`;
                              } else if (methodText) {
                                return methodText;
                              } else if (activity.notes) {
                                return activity.notes;
                              } else {
                                return 'دفع';
                              }
                            })()
                        )}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-bold ${activity.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground dir-ltr">
                        {format(new Date(activity.date), "dd/MM hh:mm", { locale: ar })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <IconLoader className="h-5 w-5 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">لا توجد عمليات</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-all rounded-lg group" 
              onClick={() => navigate("/debts")}
            >
              <div className="p-1.5 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <IconCreditCard className="h-4 w-4" />
              </div>
              <span className="font-medium text-xs">الديون</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all rounded-lg group" 
              onClick={() => navigate("/customers")}
            >
              <div className="p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <IconUsers className="h-4 w-4" />
              </div>
              <span className="font-medium text-xs">العملاء</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-1.5 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 hover:border-green-300 dark:hover:border-green-800 transition-all rounded-lg group" 
              onClick={() => navigate("/reports")}
            >
              <div className="p-1.5 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <IconTrendingUp className="h-4 w-4" />
              </div>
              <span className="font-medium text-xs">التقارير</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col gap-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 hover:border-purple-300 dark:hover:border-purple-800 transition-all rounded-lg group"
              onClick={() => navigate("/companies")}
            >
              <div className="p-1.5 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <IconBuildings className="h-4 w-4" />
              </div>
              <span className="font-medium text-xs">الشركات</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview - Compact */}
      {hasRole("admin") && stats && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ملخص مالي</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الإيرادات</p>
                <p className="text-lg font-bold text-green-600">
                  {showSensitive ? formatCurrency(stats.monthlyIncome) : '******'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الديون</p>
                <p className="text-lg font-bold text-red-600">
                  {showSensitive ? formatCurrency(stats.unpaidDebts) : '******'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">العملاء</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatNumber(stats.totalCustomers)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الشركات</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(stats.totalCompanies)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
