"use client";

import * as React from "react";
import {
  Settings,
  SunMoon,
  Binary,
  Building2,
  Package,
  BarChart3,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";

import { NavMain } from "./_components/nav-main";
import { NavProjects } from "./_components/nav-projects";
import { NavUser } from "./_components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/app/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";

// This is sample data, make sure to conditionally set the user data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Vendas",
      url: "/vendas",
      icon: BarChart3,
      isActive: false,
      items: [],
    },
    {
      title: "Produtos",
      url: "/produtos",
      icon: Package,
      isActive: false,
      items: [],
    },
    {
      title: "Integrações",
      url: "/dashboard",
      icon: Building2,
      isActive: false,
      items: [],
    },
    {
      title: "Códigos",
      url: "/codigos",
      icon: Binary,
      isActive: false,
      items: [],
    },  {
      title: "Combos",
      url: "/combos",
      icon: ShoppingBag,
      isActive: false,
      items: [],
    },
    {
      title: "Claro/Escuro",
      url: "/tema",
      icon: SunMoon,
      isActive: false,
      items: [],
    },
  
    {
      title: "Configurações",
      url: "/dashboard",
      icon: Settings,
      isActive: false,
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser(); // Use the hook inside the component

  // Ensure that the user data is available
  const userData = user
    ? {
        name: user.fullName || "",
        email: user.emailAddresses?.[0]?.emailAddress,
        avatar: user.imageUrl,
      }
    : {
        name: "",
        email: "",
        avatar: "",
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
