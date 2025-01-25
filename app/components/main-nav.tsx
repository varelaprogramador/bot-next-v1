"use client";

import Link from "next/link";
import {
  BarChart3,
  Binary,
  Building2,
  FileText,
  Gift,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  SunMoon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    isActive: true,
  },
  {
    title: "Vendas",
    icon: BarChart3,
    href: "/vendas",
  },
  {
    title: "Produtos",
    icon: Package,
    href: "/produtos",
  },

  {
    title: "Integrações",
    icon: Building2,
    href: "/",
  },
  {
    title: "Codigos",
    icon: Binary,
    href: "/codigos",
  },
  {
    title: "Claro/Escuro",
    icon: SunMoon,
    href: "/tema",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/",
  },
];

export function MainNav() {
  return (
    <Sidebar className="shadow-md">
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold ">NEXT RECARGAS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-8 py-8 text-sm",
                    item.isActive && "text-blue-600"
                  )}
                >
                  <item.icon className="h-10 w-10" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
