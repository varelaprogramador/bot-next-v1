"use client";

import { ThemeChanger } from "@/app/components/btn-theme";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-[70vh] items-center justify-center space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">
        Qual Tema você deseja{" "}
      </h2>
      <ThemeChanger></ThemeChanger>
    </div>
  );
}
