"use client"

import { DataTableCodigos } from "@/app/components/tabela-codigos"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react"
import type { CodigosProps } from "../../../utils/codigos"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft, Binary, CheckCircle, Code } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function Codigos() {
  const supabase = createClientSupabaseClient()
  const router = useRouter()
  const { id } = useParams() // Captura o `id` da venda na URL
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CodigosProps[]>([])
  const [productName, setProductName] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<any>(null)

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

        // Buscar códigos
        const { data: codigos, error } = await supabase.from("codigos").select("*").eq("id_produto", id)

        if (error) {
          throw error
        }

        setData(codigos || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Não foi possível carregar os códigos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, supabase])

  // Assinatura em tempo real para atualizar dados conforme alterações no banco
  useEffect(() => {
    const subscription = supabase.channel(`realtime:public:codigos:${id}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
        filter: `id_produto=eq.${id}`,
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as CodigosProps]
            case "UPDATE":
              return prevData.map((item) =>
                item.id_codigo === payload.new.id_codigo ? (payload.new as CodigosProps) : item,
              )
            case "DELETE":
              return prevData.filter((item) => item.id_codigo !== payload.old.id_codigo)
            default:
              return prevData
          }
        })
      },
    )

    subscription.subscribe()

    // Cleanup: desassinar quando o componente for desmontado
    return () => {
      subscription.unsubscribe()
    }
  }, [id, supabase])

  // KPIs
  const totalCodigos = data.length
  const codigosResgatados = data.filter((codigo) => codigo.status === "Resgatado").length
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
            <p className="text-muted-foreground">Gerenciamento de códigos do produto</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL DE CÓDIGOS</CardTitle>
                <Code className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{totalCodigos}</div>
                <Badge variant="outline" className="text-xs">
                  {productName}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Códigos disponíveis para este produto</p>
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
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${percentageResgatados}%` }} />
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
              <p className="mt-1 text-xs text-muted-foreground">Códigos disponíveis para uso</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* DataTable */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
      >
        <DataTableCodigos data={data} />
      </motion.div>
    </motion.div>
  )
}
