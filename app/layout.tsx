import { AppSidebar } from "@/app/components/menus/master-sidebar";
import { Separator } from "@/app/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";

import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { Inter } from "next/font/google";
import  './globals.css';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={inter.variable} suppressHydrationWarning >
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charSet="utf-8" />
          <title>DASHBOAR LERJ</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className="font-inter">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <SidebarProvider>
              <div className="flex w-screen font-poppins">
                <AppSidebar />
                <SidebarInset className="flex-1 h-full">
                  <header className="flex w-full border-b-[1px] h-20 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                      <SidebarTrigger className="-ml-1" />
                      <Separator orientation="vertical" className="mr-2 h-4" />
                    </div>
                  </header>
                  <main className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full overflow-x-hidden">
                    {children}
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}