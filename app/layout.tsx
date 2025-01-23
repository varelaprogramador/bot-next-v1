import type { Metadata } from "next"
import { Poppins } from 'next/font/google'
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MainNav } from "@/components/main-nav"
import { ThemeProvider } from "next-themes"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"], // Especifique os pesos que você deseja usar
});


export const metadata: Metadata = {
  title: "Kirvano Dashboard",
  description: "Dashboard for Kirvano platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={poppins.className}>
        <SidebarProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1">
              <MainNav />
              <ThemeProvider>
              <main className="flex-1 p-4">{children}</main></ThemeProvider>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
