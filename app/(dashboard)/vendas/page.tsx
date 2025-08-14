"use client";

import { DataTableVendas } from "@/app/components/tabela-vendas"
import { useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

import type { VendasProps } from "../../utils/vendas"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import { ArrowUpRight, CircleDollarSign, RefreshCw, ShoppingBag, CheckCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { toast } from "sonner"
import { motion } from "framer-motion"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { EnhancedFechamentoMensal } from "@/app/components/fechamento-mensal";
import { VendaManual } from "@/app/components/create-forms/venda-manual";

export default function Vendas() {
  const supabase = createClientSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<VendasProps[]>([])

  const loadData = async () => {
    setRefreshing(true)
    try {
      let allVendas: VendasProps[] = []
      const batchSize = 1000
      let page = 0
      let hasMore = true

      while (hasMore) {
        const from = page * batchSize
        const to = from + batchSize - 1

        const { data: vendas, error } = await supabase
          .from("vendas")
          .select("*")
          .range(from, to)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (vendas && vendas.length > 0) {
          allVendas = [...allVendas, ...vendas]
          page++
          hasMore = vendas.length === batchSize
        } else {
          hasMore = false
        }
      }

      setData(allVendas)
      toast.success(`${allVendas.length} vendas carregadas com sucesso.`)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Não foi possível carregar as vendas. Tente novamente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:vendas").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vendas",
      },
      (payload) => {
        setData((prevData: VendasProps[]) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as VendasProps]
            case "UPDATE":
              return prevData.map((item: VendasProps) => (item.uuid === payload.new.uuid ? (payload.new as VendasProps) : item))
            case "DELETE":
              return prevData.filter((item: VendasProps) => item.uuid !== payload.old.uuid)
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

  // KPIs
  const totalVendas = data.reduce((acc: any, venda: { valor: any; }) => acc + venda.valor, 0)
  const vendasConcluidas = data.filter((venda) => venda.status === "concluida").length
  const vendasPendentes = data.length - vendasConcluidas
  const percentageConcluidas = data.length > 0 ? (vendasConcluidas / data.length) * 100 : 0

  // Vendas do mês atual
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const vendasMes = data.filter((venda) => {
    const vendaDate = new Date(venda.created_at)
    return vendaDate >= firstDayOfMonth && vendaDate <= lastDayOfMonth
  })
  const totalVendasMes = vendasMes.reduce((acc, venda) => acc + venda.valor, 0)

  // Calculate today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const vendasHoje = data
    .filter((venda) => {
      const vendaDate = new Date(venda.created_at)
      return vendaDate >= today
    })
    .reduce((acc, venda) => acc + venda.valor, 0)

  // Calculate yesterday's sales for comparison
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const vendasOntem = data
    .filter((venda) => {
      const vendaDate = new Date(venda.created_at)
      return vendaDate >= yesterday && vendaDate <= yesterdayEnd
    })
    .reduce((acc, venda) => acc + venda.valor, 0)

  // Calculate percentage change
  const percentageChange = vendasOntem > 0 ? ((vendasHoje - vendasOntem) / vendasOntem) * 100 : 100

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie todas as suas transações</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <VendaManual onVendaCriada={loadData} />
          <Button onClick={loadData} disabled={refreshing} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </Button>
        </motion.div>
      </div>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* KPI Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" variants={containerVariants}>
            {loading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS HOJE</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">R$ {vendasHoje.toFixed(2)}</div>
                        <div
                          className={`flex items-center text-sm ${percentageChange >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {percentageChange >= 0 ? (
                            <ArrowUpRight className="mr-1 h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="mr-1 h-4 w-4 transform rotate-90" />
                          )}
                          {Math.abs(percentageChange).toFixed(1)}%
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">vs R$ {vendasOntem.toFixed(2)} ontem</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL DE VENDAS</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</div>
                        <Badge variant="outline" className="text-xs">
                          {data.length} transações
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Média por venda:</span>
                        <span className="font-medium">
                          R$ {data.length > 0 ? (totalVendas / data.length).toFixed(2) : "0.00"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS DO MÊS</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">R$ {totalVendasMes.toFixed(2)}</div>
                        <Badge variant="outline" className="text-xs">
                          {vendasMes.length} transações
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Média por venda:</span>
                        <span className="font-medium">
                          R$ {vendasMes.length > 0 ? (totalVendasMes / vendasMes.length).toFixed(2) : "0.00"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS CONCLUÍDAS</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">{vendasConcluidas}</div>
                        <Badge variant="outline" className="text-xs text-green-500 bg-green-500/10">
                          {percentageConcluidas.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${percentageConcluidas}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* DataTable */}
          <motion.div
            variants={itemVariants}
            className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <Skeleton className="h-8 w-8 rounded-full mb-4" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <DataTableVendas data={data} onVendaDeleted={loadData} />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="fechamento">
          <EnhancedFechamentoMensal></EnhancedFechamentoMensal>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
