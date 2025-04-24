"use client"

import { DataTableCodigos } from "@/app/components/tabela-codigos"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { CodigosProps } from "../../utils/codigos"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Badge } from "@/app/components/ui/badge"
import { Binary, CheckCircle, CircleDollarSign, Code, RefreshCw } from 'lucide-react'
import { Button } from "@/app/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function Codigos() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<CodigosProps[]>([])

  const loadData = async () => {
    setRefreshing(true)
    try {
      let allData: CodigosProps[] = []
      let start = 0
      const batchSize = 1000 // Tamanho do lote

      while (start < 7000) {
        const { data: batch, error } = await supabase
          .from("codigos")
          .select("*")
          .range(start, start + batchSize - 1) // Buscar em lotes de 1000

        if (error) throw error

        if (batch.length === 0) break // Se não houver mais registros, parar a busca

        allData = [...allData, ...batch]
        start += batchSize
      }

      setData(allData)
      toast.success(`${allData.length} códigos carregados com sucesso.`)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Não foi possível carregar os códigos. Tente novamente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:codigos").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as CodigosProps]
            case "UPDATE":
              return prevData.map((item) =>
                item.id_codigo === payload.new.id_codigo ? (payload.new as CodigosProps) : item
              )
            case "DELETE":
              return prevData.filter((item) => item.id_codigo !== payload.old.id_codigo)
            default:
              return prevData
          }
        })
      }
    )

    subscription.subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // KPIs
  const totalCodigos = data.length
  const codigosResgatados = data.filter((codigo) => codigo.status.toLowerCase() === "resgatado").length
  const codigosPendentes = totalCodigos - codigosResgatados
  const percentageResgatados = totalCodigos > 0 ? (codigosResgatados / totalCodigos) * 100 : 0

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
          <h1 className="text-3xl font-bold">Códigos</h1>
          <p className="text-muted-foreground">Gerencie e monitore todos os seus códigos de acesso</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </Button>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {loading ? (
          <>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL DE CÓDIGOS</CardTitle>
                    <Code className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{totalCodigos}</div>
                    <Badge variant="outline" className="text-xs">
                      Todos os códigos
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Códigos disponíveis no sistema
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CÓDIGOS RESGATADOS</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{codigosResgatados}</div>
                    <Badge variant="outline" className="text-xs text-green-500 bg-green-500/10">
                      {percentageResgatados.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${percentageResgatados}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CÓDIGOS PENDENTES</CardTitle>
                    <Binary className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{codigosPendentes}</div>
                    <Badge variant="outline" className="text-xs">
                      {totalCodigos > 0 ? (100 - percentageResgatados).toFixed(1) : "0"}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Códigos disponíveis para uso
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* DataTable */}
      <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full mb-4" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <DataTableCodigos data={data} />
        )}
      </motion.div>
    </motion.div>
  )
}
