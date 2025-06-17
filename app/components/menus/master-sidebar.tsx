"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Sidebar, SidebarFooter, SidebarHeader } from "@/app/components/ui/sidebar"
import {
  BarChart3,
  ShoppingBag,
  Package,
  Layers,
  MessageSquare,
  ImageIcon,
  Settings,
  LogOut,
  Code,
  PanelLeft,
  Palette,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { useTheme } from "next-themes"
import { Preloader } from "@/app/components/ui/preloader"

// Hook personalizado para evitar problemas de hidratação
const useThemeSwitch = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showPreloader, setShowPreloader] = useState(false)
  const [targetTheme, setTargetTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTargetTheme(newTheme)
    setShowPreloader(true)
  }

  const handlePreloaderComplete = () => {
    setTheme(targetTheme)
    setShowPreloader(false)
  }

  return {
    theme,
    mounted,
    showPreloader,
    handleThemeChange,
    handlePreloaderComplete
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { theme, mounted, showPreloader, handleThemeChange, handlePreloaderComplete } = useThemeSwitch()

  const routes = [
    {
      title: "Dashboard",
      href: "/",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Produtos",
      href: "/produtos",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Vendas",
      href: "/vendas",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Códigos",
      href: "/codigos",
      icon: <Code className="h-5 w-5" />,
    },
    {
      title: "Combos",
      href: "/combos",
      icon: <Layers className="h-5 w-5" />,
    },
    // {
    //   title: "Disparo TXT",
    //   href: "/disparo-telegram",
    //   icon: <MessageSquare className="h-5 w-5" />,
    // },
    {
      title: "Disparo Chat",
      href: "/disparo-chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Loja",
      href: "/loja",
      icon: <PanelLeft className="h-5 w-5" />,
    },
    {
      title: "Imagens",
      href: "/imagens",
      icon: <ImageIcon className="h-5 w-5" />,
    },
    {
      title: "Tema",
      href: "/tema",
      icon: <Palette className="h-5 w-5" />,
    },
    {
      title: "Configurações",
      href: "/config",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Logs Whatsapp",
      href: "/wp-logs",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Configurações Whatsapp",
      href: "/config-wp",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Integrações",
      href: "/integracao",
      icon: <Users className="h-5 w-5" />,
    },
  ]

  return (
    <>
      <Preloader isVisible={showPreloader} onComplete={handlePreloaderComplete} />
      <Sidebar className="bg-background">
        <SidebarHeader className="flex px-6 py-6">
          <div className="flex items-center gap-2 font-bold text-2xl">
            LERJ RECARGAS
          </div>
        </SidebarHeader>
        <div className="px-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          <nav className="grid gap-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === route.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {route.icon}
                <span>{route.title}</span>
              </Link>
            ))}
          </nav>
        </div>
        <SidebarFooter className="px-3 py-4 absolute bottom-0 w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mounted ? (
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeChange}
                  />
                ) : (
                  <div className="h-5 w-9 rounded-full bg-muted animate-pulse" />
                )}
                <Label htmlFor="dark-mode">Modo escuro</Label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserButton afterSignOutUrl="/" />
                <div className="text-sm">
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user?.emailAddresses[0].emailAddress}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/sign-out">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Sair</span>
                </Link>
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
