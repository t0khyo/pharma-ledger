import {
  IconCreditCard,
  IconUsers,
  IconTrendingUp,
  IconBuildings,
  IconArrowUpRight,
  IconArrowDownRight,
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

export default function Home() {
  const stats = [
    {
      title: "إجمالي الديون",
      value: "245,000 ج.م",
      change: "+12.5%",
      trend: "up",
      icon: IconCreditCard,
      color: "text-red-500",
    },
    {
      title: "عدد العملاء",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: IconUsers,
      color: "text-blue-500",
    },
    {
      title: "الإيرادات الشهرية",
      value: "89,500 ج.م",
      change: "-3.1%",
      trend: "down",
      icon: IconTrendingUp,
      color: "text-green-500",
    },
    {
      title: "عدد الشركات",
      value: "45",
      change: "+5.0%",
      trend: "up",
      icon: IconBuildings,
      color: "text-purple-500",
    },
  ];

  const recentActivities = [
    {
      customer: "أحمد محمد",
      action: "دفع جزئي",
      amount: "5,000 ج.م",
      time: "منذ ساعتين",
    },
    {
      customer: "فاطمة علي",
      action: "دين جديد",
      amount: "12,000 ج.م",
      time: "منذ 4 ساعات",
    },
    {
      customer: "محمد خالد",
      action: "سداد كامل",
      amount: "8,500 ج.م",
      time: "منذ يوم واحد",
    },
    {
      customer: "سارة حسن",
      action: "دفع جزئي",
      amount: "3,200 ج.م",
      time: "منذ يومين",
    },
  ];

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            مرحباً، د. صبحي شعبان
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة عامة على نشاط دفتر المحاسبة
          </p>
        </div>
        <Button>
          <IconTrendingUp className="ml-2 h-4 w-4" />
          تقرير جديد
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {stat.trend === "up" ? (
                  <IconArrowUpRight className="h-3 w-3 text-green-500 ml-1" />
                ) : (
                  <IconArrowDownRight className="h-3 w-3 text-red-500 ml-1" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="mr-1">من الشهر الماضي</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر المعاملات والتحديثات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{activity.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص سريع</CardTitle>
            <CardDescription>أهم المعلومات لهذا الشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm text-muted-foreground">
                  ديون متأخرة
                </span>
                <span className="text-sm font-bold text-red-500">23 عميل</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm text-muted-foreground">
                  معاملات اليوم
                </span>
                <span className="text-sm font-bold text-green-500">
                  15 معاملة
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm text-muted-foreground">
                  متوسط قيمة الدين
                </span>
                <span className="text-sm font-bold">6,850 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  معدل السداد
                </span>
                <span className="text-sm font-bold text-blue-500">87%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>العمليات الأكثر استخداماً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <IconCreditCard className="h-5 w-5" />
              <span className="text-sm">دين جديد</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <IconUsers className="h-5 w-5" />
              <span className="text-sm">عميل جديد</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <IconTrendingUp className="h-5 w-5" />
              <span className="text-sm">تقرير مالي</span>
            </Button>
            <Button
              onClick={() => companyService.getAll()}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <IconBuildings className="h-5 w-5" />
              <span className="text-sm">شركة جديدة</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
