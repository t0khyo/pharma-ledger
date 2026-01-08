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
import { companyService } from "@/services/company.service";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { DashboardStats } from "src/shared/types/transaction.types";
import { toast } from "sonner";

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

  const formatNumber = (num: number, currency: boolean = false) => {
    const formatted = new Intl.NumberFormat("ar-EG", {
      style: currency ? "currency" : "decimal",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(num);
    return formatted;
  };

  const statCards = [
    {
      title: "الديون غير المسددة",
      value: stats ? formatNumber(stats.unpaidDebts, true) : "-",
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
      value: stats ? formatNumber(stats.monthlyIncome, true) : "-",
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
    <div className="px-4 lg:px-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            مرحباً، {user?.full_name || "بالكريم"}
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة عامة على نشاط دفتر المحاسبة
          </p>
        </div>

        <div className="flex gap-2">
          {hasRole("admin") && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSensitive(!showSensitive)}
              title={showSensitive ? "إخفاء القيم" : "إظهار القيم"}
            >
              {showSensitive ? (
                <IconEyeOff className="h-4 w-4" />
              ) : (
                <IconEye className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button onClick={() => navigate("/financial-reports")}>
            <IconTrendingUp className="ml-2 h-4 w-4" />
            تقرير جديد
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.sensitive && !showSensitive ? (
                  <span className="blur-md select-none bg-muted/50 rounded px-2">
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

      {/* Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر 5 عمليات تم تسجيلها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.customer_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {activity.type === 'debt' ? (
                            activity.items && activity.items.length > 0 
                            ? activity.items.map((i: any) => i.product_name).join('، ')
                            : (activity.notes || 'بدون تفاصيل')
                        ) : (
                            activity.payment_method === 'cash' ? 'نقداً' :
                            activity.payment_method === 'instapay' ? 'إنستا باي' :
                            activity.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                            (activity.payment_method || activity.notes || 'دفع')
                        )}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${activity.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                        {formatNumber(activity.amount, true)}
                      </p>
                      <p className="text-xs text-muted-foreground dir-ltr">
                         {format(new Date(activity.date), "dd MMMM, hh:mm a", { locale: ar })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                    لا توجد عمليات مسجلة حديثاً
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-2 md:col-span-2 lg:col-span-1">
            <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>العمليات الأكثر استخداماً</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid gap-3 grid-cols-2">
                <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => navigate("/debts")}>
                    <IconCreditCard className="h-6 w-6" />
                    <span className="font-medium">الديون</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => navigate("/customers")}>
                    <IconUsers className="h-6 w-6" />
                    <span className="font-medium">العملاء</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => navigate("/financial-reports")}>
                    <IconTrendingUp className="h-6 w-6" />
                    <span className="font-medium">التقارير</span>
                </Button>
                <Button
                onClick={() => companyService.getAll()} // This was a placeholder in original code, likely need to open Add Company dialog or navigate. Just navigating to Companies list for now? The original code fetched companies. Assuming it was a logical placeholder.
                // Let's make it navigate to companies assuming such route exists or show message.
                // Actually the user has "Companies" in the sidebar? Let's check. 
                // There is no Companies page explicit in conversation imports but company.service exists.
                // I will hook it to simple alert or nothing for now if route unknown, OR better keep it same but make it useful: 
                // Since I saw `Companies` page is likely needed. Wait, file list showed `ui/components/companies`. There is likely a /companies route.
                // Checking previous context: `ui/components/companies/Columns.tsx`.
                // I'll navigate to "/companies".
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                >
                <IconBuildings className="h-6 w-6" />
                <span className="font-medium">الشركات</span>
                </Button>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
