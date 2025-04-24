"use client"
import { RevenueChart, type ChartProps } from "@/app/components/revenue-chart"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { VendasProps } from "@/app/utils/vendas"
import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns"
import MetaProgress from "@/app/components/meta"
import { ArrowUpRight, CreditCard, DollarSign, Users, Activity, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VendasProps[]>([])
  const [selectedRange, setSelectedRange] = useState("30")
  const [filteredData, setFilteredData] = useState<ChartProps[]>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data: vendas, error } = await supabase.from("vendas").select("*")
        if (error) throw error
        setData(vendas || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

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
              return [...prevData, payload.new as VendasProps]
            case "UPDATE":
              return prevData.map((item) => (item.uuid === payload.new.uuid ? (payload.new as VendasProps) : item))
            case "DELETE":
              return prevData.filter((item) => item.uuid !== payload.old.uuid)
            default:
              return prevData
          }
        })
      },
    )

    subscription.subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Função para filtrar os dados com base no intervalo de dias
  const filterDataByRange = (range: string) => {
    const today = new Date()
    let startDate = today
    const endDate = today

    switch (range) {
      case "7":
        startDate = subDays(today, 7)
        break
      case "15":
        startDate = subDays(today, 15)
        break
      case "30":
        startDate = subDays(today, 30)
        break
      default:
        break
    }

    const allDates = eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) })

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.created_at)
      return itemDate >= startDate && itemDate <= endDate && !isNaN(itemDate.getTime())
    })

    const dataMap = filtered.reduce(
      (acc, curr) => {
        const formattedDate = format(new Date(curr.created_at), "dd/MM/yy")
        // Atribui o valor como número, usando parseFloat para garantir que seja um número
        acc[formattedDate] = curr.valor || 0 // Se curr.valor não for um número, atribui 0
        return acc
      },
      {} as Record<string, number>,
    )

    const finalFilteredData = allDates.map((date) => {
      const formattedDate = format(date, "dd/MM/yy")
      return {
        date: formattedDate,
        value: dataMap[formattedDate] || 0,
      }
    })

    setFilteredData(finalFilteredData)
  }

  // Atualiza os dados filtrados quando a aba é alterada
  useEffect(() => {
    filterDataByRange(selectedRange)
  }, [selectedRange, data])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedRange(value)
  }
  const today = new Date()
  const startOfToday = startOfDay(today)
  const endOfToday = endOfDay(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1) // Subtrai um dia
  const startOfYesterday = startOfDay(yesterday)
  const endOfYesterday = endOfDay(yesterday)

  // Calculando o total de vendas
  const vendashoje = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at)
      return itemDate >= startOfToday && itemDate <= endOfToday
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const vendastotal = data
    .filter((venda) => {
      return venda.status.toLowerCase() === "concluida"
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0) // Soma os valores das vendas

  const vendasontem = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at)
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const trintaDiasAtras = new Date(today)
  trintaDiasAtras.setDate(today.getDate() - 30)

  // Filtra as vendas que têm o status 'concluida' e foram feitas nos últimos 30 dias
  const vendasfeitas = data
    .filter((venda) => {
      const dataVenda = new Date(venda.created_at) // Converte a data de criação da venda para o formato Date
      return (
        venda.status.toLowerCase() === "concluida" && dataVenda >= trintaDiasAtras // Verifica se a venda é dos últimos 30 dias
      )
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0) // Soma os valores das vendas

  const vendaspendentes = data
    .filter(
      (venda) =>
        venda.status.toLowerCase() !== "concluida" &&
        new Date(venda.created_at) >= startOfToday &&
        new Date(venda.created_at) <= endOfToday,
    )
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const vendaspix = (data.filter((venda) => venda.tipo_pagamento === "pix").length * 100) / data.length || 0

  const [valorAtual, setValorAtual] = useState(vendastotal)
  const [meta, setMeta] = useState(10000)
  const [nivel, setNivel] = useState(1)

  // Função que é chamada quando a meta é atingida
  const handleMetaConcluida = () => {
    setNivel((prevNivel) => prevNivel + 1) // Avança para o próximo nível
    setMeta((prevMeta) => prevMeta * 10) // Multiplica a meta por 10
  }
  useEffect(() => {
    setValorAtual(vendashoje)
  }, [vendashoje])
  useEffect(() => {
    if (valorAtual >= meta) {
      handleMetaConcluida()
    }
  }, [valorAtual, meta])
  useEffect(() => {
    setValorAtual(vendastotal)
  }, [vendastotal])

  // Calculate percentage change for today vs yesterday
  const percentageChange = vendasontem > 0 ? ((vendashoje - vendasontem) / vendasontem) * 100 : 100

  return (
    <div className="flex min-h-[90vh] flex-col space-y-6 px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do seu negócio e métricas importantes</p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5">
          <Clock className="mr-1 h-3.5 w-3.5" />
          Última atualização: {format(new Date(), "dd/MM/yyyy HH:mm")}
        </Badge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS HOJE</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">R$ {vendashoje.toFixed(2)}</div>
                <div
                  className={`flex items-center text-sm ${percentageChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {percentageChange >= 0 ? (
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(percentageChange).toFixed(1)}%
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">vs R$ {vendasontem.toFixed(2)} ontem</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS CONCLUÍDAS</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">R$ {vendasfeitas.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">últimos 30 dias</div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.filter((v) => v.status.toLowerCase() === "concluida").length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS PENDENTES</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">R$ {vendaspendentes.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">hoje</div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.filter((v) => v.status.toLowerCase() !== "concluida").length} transações pendentes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
          <h3 className="text-lg font-medium">GRÁFICO DE VENDAS</h3>
          <Tabs defaultValue="30" className="space-y-4" onValueChange={handleTabChange}>
            <TabsList className="filter-category-night">
              <TabsTrigger value="7" aria-label="Filter data for the last 7 days">
                7 dias
              </TabsTrigger>
              <TabsTrigger value="15" aria-label="Filter data for the last 15 days">
                15 dias
              </TabsTrigger>
              <TabsTrigger value="30" aria-label="Filter data for the last 30 days">
                30 dias
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <RevenueChart data={filteredData} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">MÉTODOS DE PAGAMENTO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                Cartão
              </span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2 progress-night" />

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-primary" />
                PIX
              </span>
              <span>{vendaspix.toFixed(1)}%</span>
            </div>
            <Progress value={vendaspix} className="h-2 progress-night" />

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                Boleto
              </span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2 progress-night" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">STATUS DA CONTA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[150px] space-y-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-center text-muted-foreground">Conta ativa com todos os recursos disponíveis</p>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Premium
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">CONVERSÃO DE CHECKOUT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[150px] space-y-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Funil de conversão otimizado disponível em breve
              </p>
              <Badge variant="outline" className="bg-secondary text-muted-foreground">
                Em desenvolvimento
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
