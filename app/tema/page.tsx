'use client'

import { ThemeChanger } from "@/components/btn-theme"


export default function DashboardPage() {
  return (
   
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Qual Tema você deseja </h2>
              <ThemeChanger></ThemeChanger>
            </div>
            
  )
}

