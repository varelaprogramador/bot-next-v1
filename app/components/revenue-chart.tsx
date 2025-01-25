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
import { format } from "date-fns";

// Defina o componente corretamente como uma função que recebe "data" como prop
interface RevenueChartProps {
  data: VendasProps[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Formatar os dados de acordo com o que o gráfico espera
  const formattedData =
    data?.map((item) => ({
      date: format(new Date(item.created_at), "dd/MM/yy"), // Formatação da data para "DD/MM/YY"
      value: item.valor, // Certifique-se de que 'valor' é o campo correto
    })) || [];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#888888" fontSize={12} />
        <Tooltip />
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
