"use client"

import { DataTableVendas } from "@/app/components/tabela-vendas"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react"
import type { VendasProps } from "@/app/utils/vendas"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CircleDollarSign, ShoppingBag, CheckCircle, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"

export default function Vendas() {
  const supabase = createClientSupabaseClient()
  const router = useRouter()
  const { id } = useParams() // Captura o `id` da venda na URL
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VendasProps[]>([])
  const [productName, setProductName] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar o nome do produto
  const fetchProductDetails = async (id: string) => {
    try {
      const { data, error } = await supabase.from("produtos").select("*").eq("id", id).single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      return null
    }
  }

  // Carregar dados inicialmente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Buscar detalhes do produto
        const productData = await fetchProductDetails(id as string)
        setProductDetails(productData)
        setProductName(productData?.nome || null)

        // Buscar vendas
        const { data: vendas, error } = await supabase.from("vendas").select("*").eq("id_produto", id)

        if (error) {
          throw error
        }

        setData(vendas || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError("Não foi possível carregar os dados de vendas. Tente novamente mais tarde.")
        toast.error("Não foi possível carregar as vendas. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, supabase])

  // Assinatura em tempo real para atualizar dados conforme alterações no banco
  useEffect(() => {
    if (!id) return

    const subscription = supabase.channel(`realtime:public:vendas:${id}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vendas",
        filter: `id_produto=eq.${id}`,
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as VendasProps]
            case "UPDATE":
              return prevData.map((item) =>
                item.id_produto === payload.new.id_produto ? (payload.new as VendasProps) : item,
              )
            case "DELETE":
              return prevData.filter((item) => item.id_produto !== payload.old.id_produto)
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
  }, [id, supabase])

  // KPIs
  const totalVendas = data.reduce((acc, venda) => acc + venda.valor, 0)
  const vendasConcluidas = data.filter((venda) => venda.status === "concluida").length
  const vendasPendentes = data.length - vendasConcluidas
  const percentageConcluidas = data.length > 0 ? (vendasConcluidas / data.length) * 100 : 0

  // Calculate recent sales (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const vendasRecentes = data
    .filter((venda) => new Date(venda.created_at) >= sevenDaysAgo)
    .reduce((acc, venda) => acc + venda.valor, 0)

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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>

        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(`/produtos/${id}`)}
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{productName || "Carregando..."}</h1>
            <p className="text-muted-foreground">Histórico de vendas do produto</p>
          </div>
        </div>

        {productDetails && (
          <Badge
            className={`${productDetails.categoria === "mensal" ? "bg-primary" : "bg-secondary"
              } text-primary-foreground px-3 py-1`}
          >
            {productDetails.categoria}
          </Badge>
        )}
      </motion.div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL DE VENDAS</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-primary" />
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
                <CardTitle className="text-sm font-medium text-muted-foreground">VENDAS RECENTES</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">R$ {vendasRecentes.toFixed(2)}</div>
                <Badge variant="outline" className="text-xs">
                  Últimos 7 dias
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.filter((venda) => new Date(venda.created_at) >= sevenDaysAgo).length} vendas recentes
              </p>
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
      </motion.div>

      {/* Product Info Card */}
      {productDetails && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DETALHES DO PRODUTO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço</p>
                    <p className="font-medium">R$ {productDetails.valor?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {productDetails.created_at ? new Date(productDetails.created_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                    <p className="font-medium">R$ {totalVendas.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* DataTable */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
      >
        <DataTableVendas data={data} />
      </motion.div>
    </motion.div>
  )
}
