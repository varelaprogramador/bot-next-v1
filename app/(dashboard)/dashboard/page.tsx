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
    const [batchLoading, setBatchLoading] = useState(false)
    const [data, setData] = useState<VendasProps[]>([])
    const [selectedRange, setSelectedRange] = useState("30")
    const [filteredData, setFilteredData] = useState<ChartProps[]>([])
    const [totalRecords, setTotalRecords] = useState(0)
    
    // Cache para armazenar dados por período
    const [dataCache, setDataCache] = useState<Map<string, VendasProps[]>>(new Map())
    
    // Estados para métricas agregadas
    const [metricsData, setMetricsData] = useState({
        vendastotal: 0,
        clientesUnicos: 0,
        vendasCanceladas: 0
    })

    // Função para carregar dados em batch otimizado por período
    const loadDataByRange = async (range: string) => {
        const cacheKey = range
        
        // Verifica se já existe no cache
        if (dataCache.has(cacheKey)) {
            setData(dataCache.get(cacheKey) || [])
            return
        }

        setBatchLoading(true)
        const today = new Date()
        let startDate = today

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
                startDate = subDays(today, 30)
                break
        }

        try {
            const BATCH_SIZE = 1000
            let allData: VendasProps[] = []
            let start = 0
            let hasMore = true

            while (hasMore) {
                const { data: batch, error } = await supabase
                    .from("vendas")
                    .select("*")
                    .gte("created_at", startDate.toISOString())
                    .lte("created_at", today.toISOString())
                    .order("created_at", { ascending: false })
                    .range(start, start + BATCH_SIZE - 1)

                if (error) throw error

                if (batch && batch.length > 0) {
                    allData = [...allData, ...batch]
                    start += BATCH_SIZE
                    hasMore = batch.length === BATCH_SIZE
                } else {
                    hasMore = false
                }
            }

            // Armazena no cache
            setDataCache(prev => new Map(prev.set(cacheKey, allData)))
            setData(allData)
            
        } catch (error) {
            console.error("Erro ao carregar dados em batch:", error)
        } finally {
            setBatchLoading(false)
        }
    }

    // Função para carregar métricas agregadas em background
    const loadAggregatedMetrics = async () => {
        try {
            // Vendas totais concluídas
            const { data: totalData } = await supabase
                .from("vendas")
                .select("valor")
                .eq("status", "concluida")
            
            const vendastotal = (totalData || []).reduce((acc, venda) => acc + (venda.valor || 0), 0)

            // Clientes únicos
            const { data: clientesData } = await supabase
                .from("vendas")
                .select("id_cliente")
            
            const clientesUnicos = new Set((clientesData || []).map(v => v.id_cliente)).size

            // Vendas canceladas
            const { data: canceladasData } = await supabase
                .from("vendas")
                .select("uuid")
                .eq("status", "cancelada")
            
            const vendasCanceladas = canceladasData?.length || 0

            setMetricsData({
                vendastotal,
                clientesUnicos,
                vendasCanceladas
            })

        } catch (error) {
            console.error("Erro ao carregar métricas agregadas:", error)
        }
    }

    // Carregamento inicial otimizado
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                // Carrega dados do período selecionado
                await loadDataByRange(selectedRange)
                
                // Carrega métricas agregadas em paralelo
                await Promise.all([
                    loadAggregatedMetrics(),
                    // Carrega contagem total
                    supabase.from("vendas").select("*", { count: "exact", head: true })
                        .then(({ count }) => setTotalRecords(count || 0))
                ])
                
            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error)
            } finally {
                setLoading(false)
            }
        }

        loadInitialData()
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
                // Invalida cache quando há mudanças
                setDataCache(new Map())
                
                setData((prevData) => {
                    const newVenda = payload.new as VendasProps
                    const oldVenda = payload.old as VendasProps
                    
                    switch (payload.eventType) {
                        case "INSERT":
                            // Verifica se a nova venda está no período atual
                            const vendaDate = new Date(newVenda.created_at)
                            const today = new Date()
                            let shouldInclude = false
                            
                            switch (selectedRange) {
                                case "7":
                                    shouldInclude = vendaDate >= subDays(today, 7)
                                    break
                                case "15":
                                    shouldInclude = vendaDate >= subDays(today, 15)
                                    break
                                case "30":
                                    shouldInclude = vendaDate >= subDays(today, 30)
                                    break
                            }
                            
                            return shouldInclude ? [...prevData, newVenda] : prevData
                            
                        case "UPDATE":
                            return prevData.map((item) => (item.uuid === newVenda.uuid ? newVenda : item))
                            
                        case "DELETE":
                            return prevData.filter((item) => item.uuid !== oldVenda.uuid)
                            
                        default:
                            return prevData
                    }
                })
                
                // Atualiza métricas agregadas e contagem total
                if (payload.eventType === "INSERT") {
                    setTotalRecords(prev => prev + 1)
                    // Recarrega métricas agregadas se necessário
                    if ((payload.new as VendasProps).status?.toLowerCase() === "concluida") {
                        loadAggregatedMetrics()
                    }
                } else if (payload.eventType === "DELETE") {
                    setTotalRecords(prev => prev - 1)
                    loadAggregatedMetrics()
                } else if (payload.eventType === "UPDATE") {
                    // Recarrega métricas se o status mudou
                    const oldStatus = (payload.old as VendasProps).status?.toLowerCase()
                    const newStatus = (payload.new as VendasProps).status?.toLowerCase()
                    if (oldStatus !== newStatus) {
                        loadAggregatedMetrics()
                    }
                }
            },
        )

        subscription.subscribe()
        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, selectedRange])

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
        if (data.length > 0) {
            filterDataByRange(selectedRange)
        }
    }, [data])

    const handleTabChange = async (value: string) => {
        setSelectedRange(value)
        await loadDataByRange(value)
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

    const vendastotal = metricsData.vendastotal

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
            if (
                venda.status.toLowerCase() === "concluida" &&
                venda.detalhes_produto &&
                venda.detalhes_produto.nome
            ) {
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

    // Clientes únicos (usando dados agregados)
    const clientesUnicos = metricsData.clientesUnicos

    // Receita por cliente
    const receitaPorCliente = clientesUnicos > 0 ? vendastotal / clientesUnicos : 0

    // Vendas canceladas (usando dados agregados)
    const vendasCanceladas = metricsData.vendasCanceladas
    const taxaCancelamento = totalRecords > 0 ? (vendasCanceladas / totalRecords) * 100 : 0

    return (
        <div className="min-h-screen ">
            <div className="flex min-h-[90vh] flex-col space-y-8 px-4 py-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="px-4 py-2 bg-white/50 backdrop-blur-sm">
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Tempo real
                        </Badge>
                        <Badge variant="secondary" className="px-4 py-2">
                            <Clock className="mr-2 h-4 w-4" />
                            {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </Badge>
                        {batchLoading && (
                            <Badge variant="outline" className="px-4 py-2 bg-blue-50 border-blue-200">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                Carregando dados...
                            </Badge>
                        )}
                        {totalRecords > 0 && (
                            <Badge variant="secondary" className="px-4 py-2">
                                Total: {totalRecords.toLocaleString()} registros
                            </Badge>
                        )}
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
                            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 dark:from-blue-800 dark:to-blue-900">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <CardHeader className="relative pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-blue-100 dark:text-blue-200">VENDAS HOJE</CardTitle>
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
                                            className={`flex items-center text-sm ${percentageChange >= 0 ? "text-blue-100 dark:text-blue-200" : "text-red-200 dark:text-red-300"}`}
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

                            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 dark:from-gray-700 dark:to-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <CardHeader className="relative pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-slate-100 dark:text-slate-200">VENDAS DA SEMANA</CardTitle>
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
                                        <div className="text-sm text-slate-100 dark:text-slate-200">
                                            {format(inicioSemana, "dd/MM")} - {format(fimSemana, "dd/MM")}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 dark:from-gray-700 dark:to-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <CardHeader className="relative pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-slate-100 dark:text-slate-200">VENDAS DO MÊS</CardTitle>
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
                                            className={`flex items-center text-sm ${crescimentoMensal >= 0 ? "text-slate-100 dark:text-slate-200" : "text-red-200 dark:text-red-300"}`}
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

                            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 dark:from-gray-700 dark:to-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                <CardHeader className="relative pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-slate-100 dark:text-slate-200">RECEITA TOTAL</CardTitle>
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
                                        <div className="text-sm text-slate-100 dark:text-slate-200">Todas as vendas concluídas</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* KPIs Secundários */}
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl dark:bg-gray-800/80 dark:text-gray-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">TICKET MÉDIO</CardTitle>
                                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold ">
                                        R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-500">Últimos 30 dias</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl dark:bg-gray-800/80 dark:text-gray-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">TAXA DE CONVERSÃO</CardTitle>
                                        <Percent className="h-4 w-4 text-green-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold ">{taxaConversao.toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-500">
                                        {vendasPorStatus["concluida"] || 0} de {data.length} vendas
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl dark:bg-gray-800/80 dark:text-gray-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">CLIENTES ÚNICOS</CardTitle>
                                        <Users className="h-4 w-4 text-purple-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold ">{clientesUnicos.toLocaleString("pt-BR")}</div>
                                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-500">R$ {receitaPorCliente.toFixed(2)} por cliente</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg transition-all hover:shadow-xl dark:bg-gray-800/80 dark:text-gray-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">HORÁRIO DE PICO</CardTitle>
                                        <Timer className="h-4 w-4 text-orange-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold ">
                                        {horarioPico !== "N/A" ? `${horarioPico}:00` : "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 dark:text-gray-500">Maior volume de vendas</p>
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
                        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl dark:bg-gray-800/80 dark:text-gray-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-semibold">Evolução das Vendas</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">Acompanhe o desempenho diário das suas vendas</p>
                                    </div>
                                    <Tabs defaultValue="30" className="space-y-4" onValueChange={handleTabChange}>
                                        <TabsList className="bg-gray-100 dark:bg-gray-700">
                                            <TabsTrigger 
                                                value="7" 
                                                disabled={batchLoading}
                                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 dark:text-gray-200"
                                            >
                                                7 dias
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="15" 
                                                disabled={batchLoading}
                                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 dark:text-gray-200"
                                            >
                                                15 dias
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="30" 
                                                disabled={batchLoading}
                                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 dark:text-gray-200"
                                            >
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
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Métodos de Pagamento */}
                            <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:from-gray-800 dark:to-gray-900 dark:text-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg font-semibold">
                                        <Wallet className="mr-2 h-5 w-5 text-blue-600" />
                                        Métodos de Pagamento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2" />
                                                PIX
                                            </span>
                                            <span className="font-semibold">{vendaspix.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={vendaspix} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-slate-600 rounded-full mr-2" />
                                                Cartão
                                            </span>
                                            <span className="font-semibold">{(100 - vendaspix).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={100 - vendaspix} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status das Vendas */}
                            <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:from-gray-800 dark:to-gray-900 dark:text-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg font-semibold">
                                        <PieChart className="mr-2 h-5 w-5 text-blue-600" />
                                        Status das Vendas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(vendasPorStatus).map(([status, quantidade]) => {
                                        const percentage = (quantidade / data.length) * 100
                                        const colors = {
                                            concluida: "bg-blue-600",
                                            pendente: "bg-slate-600",
                                            cancelada: "bg-red-600",
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


                        </div>

                        {/* Métricas Adicionais */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Insights e Alertas */}
                            <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:from-gray-800 dark:to-gray-900 dark:text-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg font-semibold">
                                        <Zap className="mr-2 h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                                        Insights Inteligentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900">
                                        <Star className="h-4 w-4 text-blue-600" />
                                        <AlertTitle className="text-blue-800 dark:text-blue-200">Produto Destaque</AlertTitle>
                                        <AlertDescription className="text-blue-700 dark:text-blue-200">
                                            {produtoMaisVendido} é o mais vendido
                                        </AlertDescription>
                                    </Alert>

                                    <Alert
                                        className={`${crescimentoMensal >= 0 ? "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900" : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900"}`}
                                    >
                                        <TrendingUp className={`h-4 w-4 ${crescimentoMensal >= 0 ? "text-blue-600 dark:text-blue-200" : "text-red-600 dark:text-red-200"}`} />
                                        <AlertTitle className={crescimentoMensal >= 0 ? "text-blue-800 dark:text-blue-200" : "text-red-800 dark:text-red-200"}>
                                            Tendência Mensal
                                        </AlertTitle>
                                        <AlertDescription className={crescimentoMensal >= 0 ? "text-blue-700 dark:text-blue-200" : "text-red-700 dark:text-red-200"}>
                                            {crescimentoMensal >= 0 ? "Crescimento" : "Queda"} de {Math.abs(crescimentoMensal).toFixed(1)}%
                                        </AlertDescription>
                                    </Alert>

                                    {taxaCancelamento > 10 && (
                                        <Alert className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                                            <AlertCircle className="h-4 w-4 text-slate-600" />
                                            <AlertTitle className="text-slate-800 dark:text-slate-200">Atenção</AlertTitle>
                                            <AlertDescription className="text-slate-700 dark:text-slate-200">
                                                Taxa de cancelamento: {taxaCancelamento.toFixed(1)}%
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:from-gray-800 dark:to-gray-900 dark:text-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg font-semibold">
                                        <Activity className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        Resumo de Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-white/50 rounded-lg dark:bg-gray-700/50">
                                            <div className="text-2xl font-bold text-slate-600 dark:text-gray-300">
                                                {data.filter((v) => v.status.toLowerCase() === "concluida").length}
                                            </div>
                                            <div className="text-sm text-muted-foreground dark:text-gray-400">Vendas Concluídas</div>
                                        </div>
                                        <div className="text-center p-4 bg-white/50 rounded-lg dark:bg-gray-700/50">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                R$ {vendaspendentes.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-muted-foreground dark:text-gray-400">Vendas Pendentes</div>
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-white/50 rounded-lg dark:bg-gray-700/50">
                                        <div className="text-xl font-bold text-slate-800 dark:text-gray-300">{Object.keys(vendasPorProduto).length}</div>
                                        <div className="text-sm text-muted-foreground dark:text-gray-400">Produtos Diferentes Vendidos</div>
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
