import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconTrendingUp,
  IconBuildings,
  IconCreditCard,
  IconUsers,
} from "@tabler/icons-react";

import { NavUser } from "@/components/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

import logoImage from "@/assets/logo.png";

const data = {
  user: {
    name: "Sobhy Shaaban",
    email: "dr.sobhy@example.com",
    avatar: "/assets/avatar.png",
  },
  navMain: [
    {
      title: "الديون",
      url: "/debts",
      icon: IconCreditCard,
    },
    {
      title: "العملاء",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "التقارير المالية",
      url: "/reports",
      icon: IconTrendingUp,
    },
    {
      title: "الشركات",
      url: "/companies",
      icon: IconBuildings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  return (
    <Sidebar side="right" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <img src={logoImage} alt="Logo" className="w-5 h-5" />
                <span className="text-base font-semibold">دفتر المحاسبة</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
