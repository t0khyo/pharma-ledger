"use client";

import * as React from "react";
import {
  IconTrendingUp,
  IconBuildings,
  IconInnerShadowTop,
  IconCreditCard,
  IconSearch,
  IconSettings,
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

const data = {
  user: {
    name: "Sobhy Shaaban",
    email: "dr.sobhy@example.com",
    avatar: "/assets/avatar.png",
  },
  navMain: [
    {
      title: "الديون",
      url: "#",
      icon: IconCreditCard,
    },
    {
      title: "العملاء",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "التقارير المالية",
      url: "#",
      icon: IconTrendingUp,
    },
    {
      title: "الشركات",
      url: "#",
      icon: IconBuildings,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="right" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img src="/assets/logo.png" alt="Logo" className="w-5 h-5" />
                <span className="text-base font-semibold">دفتر المحاسبة</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu></SidebarMenu>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
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
