import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconTrendingUp,
  IconBuildings,
  IconCreditCard,
  IconUsers,
  IconHome,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

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

const navItems = [
  {
    title: "الرئيسية",
    url: "/",
    icon: IconHome,
    roles: ["admin", "employee"],
  },
  {
    title: "الديون",
    url: "/debts",
    icon: IconCreditCard,
    roles: ["admin", "employee"],
  },
  {
    title: "العملاء",
    url: "/customers",
    icon: IconUsers,
    roles: ["admin", "employee"],
  },
  {
    title: "التقارير المالية",
    url: "/reports",
    icon: IconTrendingUp,
    roles: ["admin"], // Only admins can access
  },
  {
    title: "الشركات",
    url: "/companies",
    icon: IconBuildings,
    roles: ["admin", "employee"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

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
              {visibleNavItems.map((item) => (
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

        <NavUser
          user={{
            name: user?.full_name || "Guest",
            email: user?.role === "admin" ? "مسؤول" : "موظف",
            avatar: user?.avatar_path || "/assets/avatar.png",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
