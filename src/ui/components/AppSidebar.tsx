import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconTrendingUp,
  IconBuildings,
  IconCreditCard,
  IconUsers,
  IconHome,
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

const navGroups = [
  {
    label: "نظرة عامة",
    items: [
      {
        title: "الرئيسية",
        url: "/",
        icon: IconHome,
        roles: ["admin", "employee"],
      },
    ],
  },
  {
    label: "حسابات العملاء",
    items: [
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
    ],
  },
  {
    label: "المالية والشركات",
    items: [
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
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user } = useAuth();

  // Match active route including subroutes (e.g. /customers/123)
  const isItemActive = (url: string) =>
    url === "/"
      ? location.pathname === "/"
      : location.pathname === url || location.pathname.startsWith(url + "/");

  return (
    <Sidebar side="right" collapsible="icon" {...props}>
      <SidebarHeader className="h-[var(--header-height)] justify-center p-2 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="دفتر المحاسبة"
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <img src={logoImage} alt="Logo" className="w-5 h-5 shrink-0" />
                <span className="text-base font-semibold truncate">دفتر المحاسبة</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-1">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(user?.role || "")
          );

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="px-2 py-0.5">
              <SidebarGroupLabel className="h-5 text-[10.5px] font-medium text-muted-foreground/70 px-1.5 mb-0.5 group-data-[collapsible=icon]:-mt-5">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isItemActive(item.url)}
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
          );
        })}
      </SidebarContent>
      <SidebarSeparator />
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
