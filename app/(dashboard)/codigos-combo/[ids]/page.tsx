"use client"

import { DataTableCodigos } from "@/app/components/tabela-codigos"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { CodigosProps } from "../../../utils/codigos"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { AlertCircle, ArrowLeft, Binary, CheckCircle, Code, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"

export default function CodigosCombos() {
  const supabase = createClient()
  const router = useRouter()
  const { ids } = useParams() // Captura o `ids` da URL
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CodigosProps[]>([])
  const [error, setError] = useState<string | null>(null)
  const [productIds, setProductIds] = useState<string[]>([])
  const [comboDetails, setComboDetails] = useState<any>(null)

  // Função para buscar detalhes do combo
  const fetchComboDetails = async (productIds: string[]) => {
    try {
      // Buscar o primeiro produto para obter o ID do combo
      const firstProductId = productIds[0]
      if (!firstProductId) return null

      // Buscar combos que contêm este produto
      const { data: combos, error } = await supabase
        .from("combos")
        .select("*")
        .filter("produtos", "cs", `[{"id":"${firstProductId}"}]`)
        .single()

      if (error) {
        console.error("Erro ao buscar combo:", error)
        return null
      }

      return combos
    } catch (error) {
      console.error("Erro ao buscar detalhes do combo:", error)
      return null
    }
  }

  // Carregar dados inicialmente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!ids) {
          throw new Error("IDs não fornecidos")
        }

        // Converte a string de IDs em um array
        const parsedIds = (ids as string)
          .split("%")
          .map((id) => id.trim())
          .filter((id) => id)

        setProductIds(parsedIds)

        if (parsedIds.length === 0) {
          throw new Error("Nenhum ID válido fornecido.")
        }

        // Buscar detalhes do combo
        const comboData = await fetchComboDetails(parsedIds)
        setComboDetails(comboData)

        // Buscar códigos
        const { data: codigos, error } = await supabase.from("codigos").select("*").in("id_produto", parsedIds)

        if (error) {
          throw error
        }

        setData(codigos || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError(error instanceof Error ? error.message : "Erro ao carregar os códigos. Tente novamente mais tarde.")
        toast.error("Não foi possível carregar os códigos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [ids, supabase])

  // Assinatura em tempo real para atualizar dados conforme alterações no banco
  useEffect(() => {
    if (!ids || productIds.length === 0) return

    const subscription = supabase.channel(`realtime:public:codigos:combo`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "codigos",
        filter: `id_produto=in.(${productIds.join(",")})`,
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

    return () => {
      subscription.unsubscribe()
    }
  }, [ids, supabase, productIds])

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
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{comboDetails?.nome || "Combo de Produtos"}</h1>
            <p className="text-muted-foreground">Gerenciamento de códigos para {productIds.length} produtos</p>
          </div>
        </div>

        <Badge className="bg-primary text-primary-foreground px-3 py-1">
          <Layers className="mr-1 h-4 w-4" /> Combo
        </Badge>
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
                  {productIds.length} produtos
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Códigos disponíveis para este combo</p>
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
