
import { Poppins } from "next/font/google";
import { ptBR } from "@clerk/localizations";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Metadata } from "next";
import Link from "next/link";
import { Input } from "./components/ui/input";
import { Toaster } from "./components/ui/sonner";
import { Search, User } from "lucide-react";
import { Button } from "./components/ui/button";
import { ClerkProvider } from "@clerk/nextjs";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "NEXTRECARGAS",
  applicationName: "NEXT RECARGAS",
  metadataBase: new URL("https://bot-next-v1.vercel.app/"),
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
        },
      }}
    >
      <html lang="pt" className={poppins.variable} suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="bg-gray-100">
          <NextTopLoader
            color="#2563eb"
            height={3}
            showSpinner={false}
            easing="ease"
            speed={200}
          />
          {children}
          <Toaster
            richColors
            closeButton
            position="top-center"
            pauseWhenPageIsHidden
            toastOptions={{
              classNames: {
                toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:pointer-events-auto z-[99999]',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
