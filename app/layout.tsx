import { ClerkProvider } from "@clerk/nextjs";

import { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import NextTopLoader from 'nextjs-toploader'
import { Inter } from "next/font/google";
import './globals.css';
import { ptBR } from "@clerk/localizations";
import { dark } from '@clerk/themes'
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LERJ RECARGAS",
  applicationName: "LERJ RECARGAS",
  metadataBase: new URL("https://lerjrecargas.com/"),
  icons: {
    icon: "/ico.jpg",
  },
};

// Componente wrapper para evitar problemas de hidratação
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ClerkProvider localization={ptBR} appearance={{
      baseTheme: dark,
    }}>
      <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charSet="utf-8" />
          <title>DASHBOARD LERJ</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                } catch (_) {}
              `,
            }}
          />
        </head>
        <body className="font-inter">
          <NextTopLoader color="blue" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}