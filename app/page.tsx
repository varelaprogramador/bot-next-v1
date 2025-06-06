"use client"
import { RevenueChart, type ChartProps } from "@/app/components/revenue-chart"
import { Progress } from "@/app/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { VendasProps } from "@/app/utils/vendas"
import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
  subMonths,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  getHours,
} from "date-fns"
import MetaProgress from "@/app/components/meta"
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  BarChart3,
  ShoppingCart,
  Percent,
  Target,
  Calendar,
  Star,
  Zap,
  Award,
  RefreshCw,
  PieChart,
  Timer,
  Wallet,
} from "lucide-react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"

export default function DashboardPage() {
  const supabase = createClientSupabaseClient()
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

    const allDates = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    })

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.created_at)
      return itemDate >= startDate && itemDate <= endDate && !isNaN(itemDate.getTime())
    })

    const dataMap = filtered.reduce(
      (acc, curr) => {
        const formattedDate = format(new Date(curr.created_at), "dd/MM/yy")
        acc[formattedDate] = (acc[formattedDate] || 0) + (curr.valor || 0)
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

  useEffect(() => {
    filterDataByRange(selectedRange)
  }, [selectedRange, data])

  const handleTabChange = (value: string) => {
    setSelectedRange(value)
  }

  // Cálculos de métricas
  const today = new Date()
  const startOfToday = startOfDay(today)
  const endOfToday = endOfDay(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const startOfYesterday = startOfDay(yesterday)
  const endOfYesterday = endOfDay(yesterday)

  const vendashoje = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at)
      return itemDate >= startOfToday && itemDate <= endOfToday
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const vendastotal = data
    .filter((venda) => venda.status.toLowerCase() === "concluida")
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const vendasontem = data
    .filter((venda) => {
      const itemDate = new Date(venda.created_at)
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const trintaDiasAtras = new Date(today)
  trintaDiasAtras.setDate(today.getDate() - 30)

  const vendasfeitas = data
    .filter((venda) => {
      const dataVenda = new Date(venda.created_at)
      return venda.status.toLowerCase() === "concluida" && dataVenda >= trintaDiasAtras
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

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

  const handleMetaConcluida = () => {
    setNivel((prevNivel) => prevNivel + 1)
    setMeta((prevMeta) => prevMeta * 10)
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

  const percentageChange = vendasontem > 0 ? ((vendashoje - vendasontem) / vendasontem) * 100 : 100

  // Métricas avançadas
  const vendasMesAtual = data
    .filter((venda) => {
      const dataVenda = new Date(venda.created_at)
      return isSameMonth(dataVenda, today) && venda.status.toLowerCase() === "concluida"
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const vendasMesAnterior = data
    .filter((venda) => {
      const dataVenda = new Date(venda.created_at)
      const mesAnterior = subMonths(today, 1)
      return isSameMonth(dataVenda, mesAnterior) && venda.status.toLowerCase() === "concluida"
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  const crescimentoMensal =
    vendasMesAnterior > 0 ? ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100 : 100

  const ticketMedio =
    vendasfeitas > 0 ? vendasfeitas / data.filter((v) => v.status.toLowerCase() === "concluida").length : 0

  // Vendas da semana
  const inicioSemana = startOfWeek(today, { weekStartsOn: 1 })
  const fimSemana = endOfWeek(today, { weekStartsOn: 1 })

  const vendasSemana = data
    .filter((venda) => {
      const dataVenda = new Date(venda.created_at)
      return dataVenda >= inicioSemana && dataVenda <= fimSemana && venda.status.toLowerCase() === "concluida"
    })
    .reduce((acc, venda) => acc + venda.valor || 0, 0)

  // Horário de pico
  const vendasPorHora = data.reduce(
    (acc, venda) => {
      if (venda.status.toLowerCase() === "concluida") {
        const hora = getHours(new Date(venda.created_at))
        acc[hora] = (acc[hora] || 0) + 1
      }
      return acc
    },
    {} as Record<number, number>,
  )

  const horarioPico = Object.entries(vendasPorHora).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

  // Produtos mais vendidos
  const vendasPorProduto = data.reduce(
    (acc, venda) => {
      if (venda.status.toLowerCase() === "concluida") {
        const chave = `${venda.detalhes_produto.nome}`
        acc[chave] = (acc[chave] || 0) + venda.valor
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const produtoMaisVendido = Object.entries(vendasPorProduto).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"

  const vendasPorStatus = data.reduce(
    (acc, venda) => {
      acc[venda.status.toLowerCase()] = (acc[venda.status.toLowerCase()] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const taxaConversao = data.length > 0 ? (vendasPorStatus["concluida"] / data.length) * 100 : 0

  // Clientes únicos
  const clientesUnicos = new Set(data.map((v) => v.id_cliente)).size

  // Receita por cliente
  const receitaPorCliente = clientesUnicos > 0 ? vendastotal / clientesUnicos : 0

  // Vendas canceladas
  const vendasCanceladas = data.filter((v) => v.status.toLowerCase() === "cancelada").length
  const taxaCancelamento = data.length > 0 ? (vendasCanceladas / data.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="flex min-h-[90vh] flex-col space-y-8 px-4 py-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard Analytics
            </h1>
            <p className="text-lg text-muted-foreground">Visão completa do seu negócio com métricas avançadas</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-4 py-2 bg-white/50 backdrop-blur-sm">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Tempo real
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Clock className="mr-2 h-4 w-4" />
              {format(new Date(), "dd/MM/yyyy HH:mm")}
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-100">VENDAS HOJE</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      R$ {vendashoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`flex items-center text-sm ${percentageChange >= 0 ? "text-green-100" : "text-red-200"}`}
                    >
                      {percentageChange >= 0 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      {Math.abs(percentageChange).toFixed(1)}% vs ontem
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-100">VENDAS DA SEMANA</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      R$ {vendasSemana.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-blue-100">
                      {format(inicioSemana, "dd/MM")} - {format(fimSemana, "dd/MM")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-100">VENDAS DO MÊS</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      R$ {vendasMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`flex items-center text-sm ${crescimentoMensal >= 0 ? "text-purple-100" : "text-red-200"}`}
                    >
                      {crescimentoMensal >= 0 ? (
                        <TrendingUp className="mr-1 h-4 w-4" />
                      ) : (
                        <TrendingDown className="mr-1 h-4 w-4" />
                      )}
                      {Math.abs(crescimentoMensal).toFixed(1)}% vs mês anterior
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-100">RECEITA TOTAL</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      R$ {vendastotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-orange-100">Todas as vendas concluídas</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Secundários */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">TICKET MÉDIO</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">TAXA DE CONVERSÃO</CardTitle>
                    <Percent className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{taxaConversao.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vendasPorStatus["concluida"] || 0} de {data.length} vendas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CLIENTES ÚNICOS</CardTitle>
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{clientesUnicos.toLocaleString("pt-BR")}</div>
                  <p className="text-xs text-muted-foreground mt-1">R$ {receitaPorCliente.toFixed(2)} por cliente</p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">HORÁRIO DE PICO</CardTitle>
                    <Timer className="h-4 w-4 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {horarioPico !== "N/A" ? `${horarioPico}:00` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Maior volume de vendas</p>
                </CardContent>
              </Card>
            </div>

            {/* Meta Progress */}
            <div className="space-y-6">
              <MetaProgress
                nivel={`NÍVEL ${nivel}`}
                valorAtual={valorAtual}
                meta={meta}
                onMetaConcluida={handleMetaConcluida}
              />
            </div>

            {/* Gráfico de Vendas */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Evolução das Vendas</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Acompanhe o desempenho diário das suas vendas</p>
                  </div>
                  <Tabs defaultValue="30" className="space-y-4" onValueChange={handleTabChange}>
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="7" className="data-[state=active]:bg-white">
                        7 dias
                      </TabsTrigger>
                      <TabsTrigger value="15" className="data-[state=active]:bg-white">
                        15 dias
                      </TabsTrigger>
                      <TabsTrigger value="30" className="data-[state=active]:bg-white">
                        30 dias
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? <Skeleton className="h-[350px] w-full" /> : <RevenueChart data={filteredData} />}
              </CardContent>
            </Card>

            {/* Cards de Análise */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Métodos de Pagamento */}
              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Wallet className="mr-2 h-5 w-5 text-blue-500" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                        PIX
                      </span>
                      <span className="font-semibold">{vendaspix.toFixed(1)}%</span>
                    </div>
                    <Progress value={vendaspix} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                        Cartão
                      </span>
                      <span className="font-semibold">{(100 - vendaspix).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - vendaspix} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Status das Vendas */}
              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <PieChart className="mr-2 h-5 w-5 text-green-500" />
                    Status das Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(vendasPorStatus).map(([status, quantidade]) => {
                    const percentage = (quantidade / data.length) * 100
                    const colors = {
                      concluida: "bg-green-500",
                      pendente: "bg-yellow-500",
                      cancelada: "bg-red-500",
                    }

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center capitalize">
                            <div
                              className={`w-3 h-3 rounded-full mr-2 ${colors[status as keyof typeof colors] || "bg-gray-500"}`}
                            />
                            {status}
                          </span>
                          <span className="font-semibold">{quantidade}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Insights e Alertas */}
              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                    Insights Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <Star className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Produto Destaque</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {produtoMaisVendido} é o mais vendido
                    </AlertDescription>
                  </Alert>

                  <Alert
                    className={`${crescimentoMensal >= 0 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}
                  >
                    <TrendingUp className={`h-4 w-4 ${crescimentoMensal >= 0 ? "text-blue-600" : "text-red-600"}`} />
                    <AlertTitle className={crescimentoMensal >= 0 ? "text-blue-800" : "text-red-800"}>
                      Tendência Mensal
                    </AlertTitle>
                    <AlertDescription className={crescimentoMensal >= 0 ? "text-blue-700" : "text-red-700"}>
                      {crescimentoMensal >= 0 ? "Crescimento" : "Queda"} de {Math.abs(crescimentoMensal).toFixed(1)}%
                    </AlertDescription>
                  </Alert>

                  {taxaCancelamento > 10 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Atenção</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        Taxa de cancelamento: {taxaCancelamento.toFixed(1)}%
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Métricas Adicionais */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Activity className="mr-2 h-5 w-5 text-indigo-500" />
                    Resumo de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">
                        {data.filter((v) => v.status.toLowerCase() === "concluida").length}
                      </div>
                      <div className="text-sm text-muted-foreground">Vendas Concluídas</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">R$ {vendaspendentes.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Vendas Pendentes</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">{Object.keys(vendasPorProduto).length}</div>
                    <div className="text-sm text-muted-foreground">Produtos Diferentes Vendidos</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Target className="mr-2 h-5 w-5 text-green-500" />
                    Metas e Objetivos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meta Diária (R$ 1.000)</span>
                      <span>{((vendashoje / 1000) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(vendashoje / 1000) * 100} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meta Mensal (R$ 30.000)</span>
                      <span>{((vendasMesAtual / 30000) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(vendasMesAtual / 30000) * 100} className="h-3" />
                  </div>

                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      Próxima Meta: R$ {meta.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Faltam R$ {(meta - valorAtual).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
