"use client";
import { RevenueChart, ChartProps } from "@/app/components/revenue-chart";
import { SummaryCard } from "@/app/components/summary-card";

import { Progress } from "@/app/components/ui/progress";
import {
  Tabs,
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
import MetaProgress from "@/app/components/meta";


export default function DashboardPage() {

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendasProps[]>([]);
  const [selectedRange, setSelectedRange] = useState("30");
  const [filteredData, setFilteredData] = useState<ChartProps[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Cache para armazenar dados por período
  const [dataCache, setDataCache] = useState<Map<string, VendasProps[]>>(new Map());

  // Função para carregar dados em batch com base no período selecionado
  const loadDataByRange = async (range: string) => {
    const cacheKey = range;
    
    // Verifica se já existe no cache
    if (dataCache.has(cacheKey)) {
      setData(dataCache.get(cacheKey) || []);
      return;
    }

    setBatchLoading(true);
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
        startDate = subDays(today, 30);
        break;
    }

    try {
      const BATCH_SIZE = 1000;
      let allData: VendasProps[] = [];
      let start = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error } = await supabase
          .from("vendas")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", today.toISOString())
          .order("created_at", { ascending: false })
          .range(start, start + BATCH_SIZE - 1);

        if (error) throw error;

        if (batch && batch.length > 0) {
          allData = [...allData, ...batch];
          start += BATCH_SIZE;
          hasMore = batch.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      // Armazena no cache
      setDataCache(prev => new Map(prev.set(cacheKey, allData)));
      setData(allData);
      
    } catch (error) {
      console.error("Erro ao carregar dados em batch:", error);
    } finally {
      setBatchLoading(false);
    }
  };

  // Carregamento inicial simplificado - apenas dados recentes
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Carrega apenas os últimos 30 dias inicialmente
        await loadDataByRange("30");
        
        // Carrega contagem total em background
        const { count } = await supabase
          .from("vendas")
          .select("*", { count: "exact", head: true });
        
        setTotalRecords(count || 0);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
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
        // Invalida cache quando há mudanças
        setDataCache(new Map());
        
        setData((prevData) => {
          const newVenda = payload.new as VendasProps;
          const oldVenda = payload.old as VendasProps;
          
          switch (payload.eventType) {
            case "INSERT":
              // Verifica se a nova venda está no período atual
              const vendaDate = new Date(newVenda.created_at);
              const today = new Date();
              let shouldInclude = false;
              
              switch (selectedRange) {
                case "7":
                  shouldInclude = vendaDate >= subDays(today, 7);
                  break;
                case "15":
                  shouldInclude = vendaDate >= subDays(today, 15);
                  break;
                case "30":
                  shouldInclude = vendaDate >= subDays(today, 30);
                  break;
              }
              
              return shouldInclude ? [...prevData, newVenda] : prevData;
              
            case "UPDATE":
              return prevData.map((item) =>
                item.uuid === newVenda.uuid ? newVenda : item
              );
              
            case "DELETE":
              return prevData.filter((item) => item.uuid !== oldVenda.uuid);
              
            default:
              return prevData;
          }
        });
        
        // Atualiza contagem total
        setTotalRecords(prev => {
          switch (payload.eventType) {
            case "INSERT":
              return prev + 1;
            case "DELETE":
              return prev - 1;
            default:
              return prev;
          }
        });
      }
    );

    subscription.subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, selectedRange]);

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

  // Atualiza os dados filtrados quando os dados mudam
  useEffect(() => {
    if (data.length > 0) {
      filterDataByRange(selectedRange);
    }
  }, [data]);

  // Handle tab change - carrega dados quando muda o período
  const handleTabChange = async (value: string) => {
    setSelectedRange(value);
    await loadDataByRange(value);
  };
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1); // Subtrai um dia
  const startOfYesterday = startOfDay(yesterday);
  const endOfYesterday = endOfDay(yesterday);

  // Calculando métricas otimizadas
  const vendashoje = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at);
      return itemDate >= startOfToday && itemDate <= endOfToday;
    })
    .reduce((acc, venda) => acc + (venda.valor || 0), 0);

  // Para vendas totais, fazemos uma query separada quando necessário
  const [vendastotal, setVendasTotal] = useState(0);
  
  useEffect(() => {
    const getVendasTotal = async () => {
      try {
        const { data: totalVendas } = await supabase
          .from("vendas")
          .select("valor")
          .eq("status", "concluida");
        
        const total = (totalVendas || []).reduce((acc, venda) => acc + (venda.valor || 0), 0);
        setVendasTotal(total);
      } catch (error) {
        console.error("Erro ao carregar vendas totais:", error);
      }
    };

    getVendasTotal();
  }, [supabase]);

  const vendasontem = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at);
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
    })
    .reduce((acc, venda) => acc + (venda.valor || 0), 0);

  const vendasfeitas = data
    .filter((venda) => {
      return venda.status.toLowerCase() === "concluida";
    })
    .reduce((acc, venda) => acc + (venda.valor || 0), 0);
    
  const vendaspendentes = data
    .filter(
      (venda) =>
        venda.status.toLowerCase() !== "concluida" &&
        new Date(venda.created_at) >= startOfToday &&
        new Date(venda.created_at) <= endOfToday
    )
    .reduce((acc, venda) => acc + (venda.valor || 0), 0);

  const vendaspix = data.length > 0 
    ? (data.filter((venda) => venda.tipo_pagamento === "pix").length * 100) / data.length
    : 0;

  const [valorAtual, setValorAtual] = useState(vendastotal); 
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
  useEffect(()=>{
    setValorAtual(vendastotal);
  },[vendastotal])
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
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium">GRÁFICO DE VENDAS</h3>
            {batchLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Carregando dados...
              </div>
            )}
            {totalRecords > 0 && (
              <span className="text-sm text-muted-foreground">
                Total: {totalRecords.toLocaleString()} registros
              </span>
            )}
          </div>
          <Tabs
            defaultValue="30"
            className="space-y-4 "
            onValueChange={handleTabChange}
          >
            <TabsList className="filter-category-night">
              <TabsTrigger
                value="7"
                disabled={batchLoading}
                aria-label="Filter data for the last 7 days"
              >
                7 dias
              </TabsTrigger>
              <TabsTrigger
                value="15"
                disabled={batchLoading}
                aria-label="Filter data for the last 15 days"
              >
                15 dias
              </TabsTrigger>
              <TabsTrigger
                value="30"
                disabled={batchLoading}
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
