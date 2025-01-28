/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { VendasProps } from "@/app/utils/vendas";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";


// Defina o componente corretamente como uma função que recebe "data" como prop
export interface ChartProps {
  date: string;
  value: number;
}
export interface RevenueChartProps {
  data: ChartProps[];
}

function CustomTooltip({ active, payload }:any) {
  if (active && payload && payload.length) {
    const { date, value } = payload[0].payload;
    

  

    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <p>{`Data: ${date}`}</p>
        <p>{`Valor: R$ ${value.toFixed(2)}`}</p>
      </div>
    );
  }

  return null;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#888888" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: "#2563eb", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
