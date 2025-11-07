import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Building2,
  CreditCard,
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
  {
    title: "الإعدادات",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
