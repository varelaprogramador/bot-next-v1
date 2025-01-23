"use client"

import { Line, LineChart, ResponsiveContainer, XAxis } from "recharts"

const data = [
  { date: "26 dez", value: 0 },
  { date: "30 dez", value: 0 },
  { date: "3 jan", value: 0 },
  { date: "7 jan", value: 0 },
  { date: "11 jan", value: 0 },
  { date: "15 jan", value: 0 },
  { date: "19 jan", value: 0 },
]

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

