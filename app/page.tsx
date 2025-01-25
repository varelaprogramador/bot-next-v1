"use client";
import { AlertTriangle } from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { RevenueChart } from "@/components/revenue-chart";
import { SummaryCard } from "@/components/summary-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { VendasProps } from "./utils/vendas";
import { subDays } from "date-fns";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendasProps[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: vendas, error } = await supabase
          .from("vendas")
          .select("*");

        if (error) {
          throw error;
        }

        setData(vendas || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]); // Supabase não precisa estar na dependência

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:vendas").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vendas",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as VendasProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.uuid === payload.new.uuid
                  ? (payload.new as VendasProps)
                  : item
              );
            case "DELETE":
              return prevData.filter((item) => item.uuid !== payload.old.uuid);
            default:
              return prevData;
          }
        });
      }
    );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  const [selectedRange, setSelectedRange] = useState("30"); // Estado para selecionar a aba (intervalo de dias)
  const [filteredData, setFilteredData] = useState<VendasProps[]>(data);

  // Função para filtrar os dados com base no intervalo de dias
  const filterDataByRange = (range: string) => {
    const today = new Date();
    let startDate = today;

    switch (range) {
      case "7":
        startDate = subDays(today, 7);
        break;
      case "15":
        startDate = subDays(today, 15);
        break;
      case "30":
        startDate = subDays(today, 30);
        break;
      default:
        break;
    }

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate;
    });

    setFilteredData(filtered);
  };

  // Atualiza os dados filtrados quando a aba é alterada
  useEffect(() => {
    filterDataByRange(selectedRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange, data]);

  const vendashoje = data.reduce(
    (acc, venda) => acc + parseFloat(venda.valor),
    0
  );
  const vendasontem = data.reduce(
    (acc, venda) => acc + parseFloat(venda.valor),
    0
  );
  const vendasfeitas = data.filter(
    (venda) => venda.status === "concluido"
  ).length;

  return (
    <div className="flex min-h-[90vh] flex-col px-4 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Boas-vindas</h2>
      </div>
      <div>
        <h3 className="text-lg font-medium">RESUMO</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Vendas hoje"
            value={`R$${vendashoje.toFixed(2)}`}
            previousValue="R$ 0,00"
            previousLabel="De ontem"
          />
          <SummaryCard
            title="Vendas feitas"
            value={`R$${vendasfeitas.toFixed(2)}`}
            previousValue="30 dias"
            previousLabel="Dos últimos"
          />
          <SummaryCard
            title="Pendente"
            value="R$ 0,00"
            previousValue="24 horas"
            previousLabel="Das últimas"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">
              NÍVEL 1
            </div>
            <span className="text-sm text-muted-foreground">
              R$ 0,00 em vendas
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>0</span>
            <span className="mx-1">/</span>
            <span>10k</span>
          </div>
        </div>
        <Progress value={0} className="h-2" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">GRÁFICO DE FATURAMENTO</h3>
          <Tabs defaultValue="30" className="space-y-4">
            <TabsList>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="15">15 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <RevenueChart data={filteredData} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              CONVERSÃO DE PAGAMENTO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Cartão</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>PIX</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Boleto</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              STATUS DA CONTA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve você terá acesso a um informe
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              CONVERSÃO DE CHECKOUT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve você terá acesso a um funil otimizado
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
