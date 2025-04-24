"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  value: string
  previousValue: string
  previousLabel: string
  colortitle?: string
  icon?: React.ReactNode
}

export function SummaryCard({ title, value, previousValue, previousLabel, colortitle, icon }: SummaryCardProps) {
  // Extract numeric values for comparison
  const currentNumeric = Number.parseFloat(value.replace(/[^0-9.-]+/g, ""))
  const previousNumeric = Number.parseFloat(previousValue.replace(/[^0-9.-]+/g, ""))

  // Calculate percentage change if both values are valid numbers
  const hasChange = !isNaN(currentNumeric) && !isNaN(previousNumeric) && previousNumeric !== 0
  const percentageChange = hasChange ? ((currentNumeric - previousNumeric) / previousNumeric) * 100 : 0
  const isPositive = percentageChange > 0

  return (
    <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", colortitle)}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {hasChange && (
            <div className={cn("mr-1", isPositive ? "text-green-500" : "text-red-500")}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </div>
          )}
          <span className={cn(hasChange && (isPositive ? "text-green-500" : "text-red-500"))}>
            {hasChange ? `${Math.abs(percentageChange).toFixed(1)}%` : ""}
          </span>
          <span className="ml-1">
            {previousLabel} {previousValue}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
