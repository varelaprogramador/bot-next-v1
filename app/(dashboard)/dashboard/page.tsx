"use client";
import { AlertTriangle } from "lucide-react";
import { MainNav } from "@/app/components/main-nav";
import { RevenueChart, ChartProps } from "@/app/components/revenue-chart";
import { SummaryCard } from "@/app/components/summary-card";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

import { Progress } from "@/app/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { VendasProps } from "../../utils/vendas";
import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns";
import { number } from "zod";
import MetaProgress from "@/app/components/meta";

export default function DashboardPage() {

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendasProps[]>([]);
  const [selectedRange, setSelectedRange] = useState("30");
  const [filteredData, setFilteredData] = useState<ChartProps[]>([]);



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: vendas, error } = await supabase
          .from("vendas")
          .select("*");
        if (error) throw error;
        setData(vendas || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

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

  // Função para filtrar os dados com base no intervalo de dias
  const filterDataByRange = (range: string) => {
    const today = new Date();
    let startDate = today;
    const endDate = today;

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

    const allDates = eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) });

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate && !isNaN(itemDate.getTime());
    });

    const dataMap = filtered.reduce((acc, curr) => {
      const formattedDate = format(new Date(curr.created_at), "dd/MM/yy");
      // Atribui o valor como número, usando parseFloat para garantir que seja um número
      acc[formattedDate] =curr.valor  || 0; // Se curr.valor não for um número, atribui 0
      return acc;
    }, {} as Record<string, number>);

    const finalFilteredData = allDates.map(date => {
      const formattedDate = format(date, "dd/MM/yy");
      return {
        date: formattedDate,
        value: dataMap[formattedDate] || 0,
      };
    });

    setFilteredData(finalFilteredData);
  };

  // Atualiza os dados filtrados quando a aba é alterada
  useEffect(() => {
    filterDataByRange(selectedRange);
  }, [selectedRange, data]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedRange(value);
  };
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1); // Subtrai um dia
  const startOfYesterday = startOfDay(yesterday);
  const endOfYesterday = endOfDay(yesterday);

  // Calculando o total de vendas
  const vendashoje = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at);
      return itemDate >= startOfToday && itemDate <= endOfToday;
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0);

  const vendastotal = data.reduce(
    (acc, venda) => acc + venda.valor,
    0
  );

  const vendasontem = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at);
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0);

    const trintaDiasAtras = new Date(today);
    trintaDiasAtras.setDate(today.getDate() - 30);
    
    // Filtra as vendas que têm o status 'concluido' e foram feitas nos últimos 30 dias
    const vendasfeitas = data
      .filter((venda) => {
        const dataVenda = new Date(venda.created_at); // Converte a data de criação da venda para o formato Date
        return (
          venda.status.toLowerCase() === "concluido" &&
          dataVenda >= trintaDiasAtras // Verifica se a venda é dos últimos 30 dias
        );
      })
      .reduce((acc, venda) => acc + venda.valor || 0, 0); // Soma os valores das vendas
    
  const vendaspendentes = data
    .filter(
      (venda) =>
        venda.status.toLowerCase() !== "concluido" &&
        new Date(venda.created_at) >= startOfToday &&
        new Date(venda.created_at) <= endOfToday
    )
    .reduce((acc, venda) => acc + venda.valor || 0, 0);

  const vendaspix =
    (data.filter((venda) => venda.tipo_pagamento === "pix").length * 100) /
    data.length;

  const [valorAtual, setValorAtual] = useState(0); 
  const [meta, setMeta] = useState(10000); 
  const [nivel, setNivel] = useState(1);

  // Função que é chamada quando a meta é atingida
  const handleMetaConcluida = () => {
    setNivel((prevNivel) => prevNivel + 1); // Avança para o próximo nível
    setMeta((prevMeta) => prevMeta * 10); // Multiplica a meta por 10

  };
useEffect(()=>{
setValorAtual(vendashoje);
},[vendashoje])
  useEffect(() => {
    if (valorAtual >= meta) {
      handleMetaConcluida();
    }
  }, [valorAtual, meta]);

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
            previousValue={`R$${vendasontem.toFixed(2)}`}
            previousLabel="De ontem"
            colortitle="text-blue-500"
          />
          <SummaryCard
            title="Vendas feitas"
            value={`R$${vendasfeitas.toFixed(2)}`}
            previousValue="30 dias"
            previousLabel="Dos últimos"
            colortitle="text-green-700"
          />
          <SummaryCard
            title="Vendas Pendentes"
            value={`R$${vendaspendentes.toFixed(2)}`}
            previousValue="24 horas"
            previousLabel="Das últimas"
            colortitle="text-yellow-600"
          />
        </div>
      </div>
      <div className="space-y-6">
        <MetaProgress
          nivel={`NÍVEL ${nivel}`}
          valorAtual={valorAtual}
          meta={meta}
          onMetaConcluida={handleMetaConcluida}
        />
        
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">GRÁFICO DE FATURAMENTO</h3>
          <Tabs
            defaultValue="30"
            className="space-y-4 "
            onValueChange={handleTabChange}
          >
            <TabsList className="filter-category-night">
              <TabsTrigger
                value="7"

                aria-label="Filter data for the last 7 days"
              >
                7 dias
              </TabsTrigger>
              <TabsTrigger
                value="15"
                aria-label="Filter data for the last 15 days"
              >
                15 dias
              </TabsTrigger>
              <TabsTrigger
                value="30"
                aria-label="Filter data for the last 30 days"
              >
                30 dias
              </TabsTrigger>
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
            <Progress value={0} className="h-2 progress-night" />
            <div className="flex items-center justify-between text-sm">
              <span>PIX</span>
              <span>{vendaspix || "0"}%</span>
            </div>
            <Progress value={vendaspix} className="h-2 progress-night" />
            <div className="flex items-center justify-between text-sm">
              <span>Boleto</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2 progress-night" />
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
