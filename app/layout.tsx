import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { ptBR } from "@clerk/localizations";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Metadata } from "next";
import Link from "next/link";
import { Input } from "./components/ui/input";
import { Search, User } from "lucide-react";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NEXTRECARGAS",
  applicationName: "NEXT RECARGAS",
  metadataBase: new URL("https://bot-next-v1.vercel.app/"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt" className={poppins.variable}>
        <body className="bg-gray-100">
          <NextTopLoader color="blue" />
          {children}
          <Toaster></Toaster>
        </body>
      </html>
    </ClerkProvider>
  );
}
