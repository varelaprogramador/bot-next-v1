"use client"

import { useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts"
import { motion } from "framer-motion"

export interface ChartProps {
  date: string
  value: number
}

export interface RevenueChartProps {
  data: ChartProps[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [chartType, setChartType] = useState<"line" | "area">("area")

  // Format the data for better display
  const formattedData = data.map((item, index) => ({
    ...item,
    value: Number(item.value.toFixed(2)),
    index,
  }))

  // Calculate the highest value for better visualization
  const maxValue = Math.max(...formattedData.map((item) => item.value)) * 1.2

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-3 rounded-md shadow-lg"
        >
          <p className="text-sm font-medium">{`${label}`}</p>
          <p className="text-primary text-sm font-bold">{`R$ ${payload[0].value.toFixed(2)}`}</p>
        </motion.div>
      )
    }
    return null
  }

  // Custom dot component for the line chart
  const CustomDot = ({ cx, cy, index }: any) => {
    const isHovered = index === hoveredIndex

    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={isHovered ? 6 : 4}
        fill={isHovered ? "hsl(var(--primary))" : "hsl(var(--primary)/0.8)"}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        initial={false}
        animate={{
          r: isHovered ? 6 : 4,
          fill: isHovered ? "hsl(var(--primary))" : "hsl(var(--primary)/0.8)",
        }}
        transition={{ duration: 0.2 }}
      />
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setChartType("line")}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${chartType === "line" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
        >
          Linha
        </button>
        <button
          onClick={() => setChartType("area")}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${chartType === "area" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
        >
          Área
        </button>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {chartType === "line" ? (
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            onMouseMove={(e) => {
              if (e.activeTooltipIndex !== undefined) {
                setHoveredIndex(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${value}`}
              domain={[0, maxValue]}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary)/0.2)" }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8, stroke: "hsl(var(--background))", strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        ) : (
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            onMouseMove={(e) => {
              if (e.activeTooltipIndex !== undefined) {
                setHoveredIndex(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `R$${value}`}
              domain={[0, maxValue]}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary)/0.2)" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#colorValue)"
              activeDot={{
                r: 8,
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                fill: "hsl(var(--primary))",
              }}
              animationDuration={1500}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <div>Total: R$ {formattedData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</div>
        <div>
          Média: R$ {(formattedData.reduce((sum, item) => sum + item.value, 0) / formattedData.length).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
