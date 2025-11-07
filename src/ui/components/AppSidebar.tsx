import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Building2,
  CreditCard,
  LogOut,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  {
    title: "الديون",
    url: "#",
    icon: CreditCard,
  },
  {
    title: "العملاء",
    url: "#",
    icon: Users,
  },
  {
    title: "التقارير المالية",
    url: "#",
    icon: TrendingUp,
  },
  {
    title: "الشركات",
    url: "#",
    icon: Building2,
  },
];

export function AppSidebar() {
  const handleLogout = () => {
    // Implement logout functionality here
    console.log("Logging out...");
  };

  return (
    <Sidebar side="right">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt=""
            className="h-10 w-10 object-contain m-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-sidebar-foreground">
              دفتر المحاسبة
            </h1>
            <h2 className="text-xs text-sidebar-foreground/60">
              د. صبحي شعبان
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="text-lg flex items-center gap-3"
                    >
                      <item.icon className="h-10 w-10" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#settings" className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>الإعدادات</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
