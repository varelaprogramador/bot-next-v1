"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { motion } from "framer-motion"
import {
  CircleDollarSign,
  Binary,
  Calendar,
  ArrowLeft,
  BarChart3,
  Trash2,
  Edit,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Tag,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react"

import type { ProdutosLojaProps } from "@/app/utils/produto"
import { Button } from "@/app/components/ui/button"
import { EditProduto } from "@/app/components/edit-form/produto-edit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "sonner"
import { Separator } from "@/app/components/ui/separator"
import { Progress } from "@/app/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

const supabase = createClientSupabaseClient()

export default function ProdutoDetalhes() {
  const [produto, setProduto] = useState<ProdutosLojaProps | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [salesStats, setSalesStats] = useState({
    total: 0,
    lastWeek: 0,
    avgValue: 0,
    activeUsers: 0,
  })
  const { id: productId } = useParams()
  const router = useRouter()

  const handleConfirmEdit = async ({ data }: { data: ProdutosLojaProps }) => {
    try {
      const { error } = await supabase.from("produtos").update(data).eq("id", data.id)
      if (error) {
        throw error
      }
      setProduto(data)
      toast.success("Produto atualizado com sucesso")
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast.error("Não foi possível atualizar o produto")
    }
  }

  const handleDeleteProduto = async () => {
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", produto?.id)
      if (error) {
        throw error
      }
      toast.success("Produto excluído com sucesso")
      router.push("/produtos")
    } catch (error) {
      console.error("Erro ao deletar produto:", error)
      toast.error("Não foi possível excluir o produto")
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    const fetchProduto = async () => {
      if (!productId) return

      setLoading(true)

      try {
        const { data, error } = await supabase.from("produtos").select("*").eq("id", productId).single()

        if (error) {
          console.error("Erro ao carregar produto:", error)
          toast.error("Não foi possível carregar os detalhes do produto")
          router.push("/produtos")
          return
        }

        setProduto(data)

        // Simulated sales stats for demo purposes
        setSalesStats({
          total: Math.floor(Math.random() * 500),
          lastWeek: Math.floor(Math.random() * 50),
          avgValue: Number.parseFloat((Math.random() * 100 + 50).toFixed(2)),
          activeUsers: Math.floor(Math.random() * 200),
        })
      } catch (error) {
        console.error("Erro na requisição:", error)
        toast.error("Ocorreu um erro ao buscar os dados do produto")
      } finally {
        setLoading(false)
      }
    }

    fetchProduto()
  }, [productId, router])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!produto) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="flex flex-col items-center justify-center p-12 border border-border rounded-lg bg-card/50">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
          <p className="text-muted-foreground mb-6">O produto que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => router.push("/produtos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para produtos
          </Button>
        </div>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <Button variant="outline" onClick={() => router.push("/produtos")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          <EditProduto produto={produto} onConfirmEdit={handleConfirmEdit} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </AlertDialogTrigger>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto &quot;{produto.nome}&quot; e todos os
                  dados associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProduto}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Sim, excluir produto"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">{produto.nome}</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">ID: {produto.id}</CardDescription>
              </div>
              <Badge className={produto.categoria === "mensal" ? "bg-primary" : "bg-secondary"}>
                {produto.categoria}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h3>
              <p className="text-foreground">{produto.descricao || "Sem descrição disponível."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-lg font-semibold">R$ {produto.valor?.toFixed(2) || "0.00"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Binary className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="text-lg font-semibold">{produto.id?.substring(0, 8) || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="text-lg font-semibold">
                    {produto.created_at ? new Date(produto.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="text-lg font-semibold">{produto.categoria || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="my-6" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold mb-4">Estatísticas de Vendas</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center max-md:flex-col gap-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Total
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{salesStats.total}</h3>
                <p className="text-sm text-muted-foreground">Vendas totais</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center max-md:flex-col gap-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Recente
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{salesStats.lastWeek}</h3>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </div>
              <Progress value={(salesStats.lastWeek / (salesStats.total || 1)) * 100} className="h-1.5 mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center max-md:flex-col gap-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CircleDollarSign className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Média
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">R$ {salesStats.avgValue}</h3>
                <p className="text-sm text-muted-foreground">Valor médio</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center max-md:flex-col gap-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Usuários
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{salesStats.activeUsers}</h3>
                <p className="text-sm text-muted-foreground">Usuários ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Tabs defaultValue="gerenciamento" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="gerenciamento">Gerenciamento</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes Técnicos</TabsTrigger>
          </TabsList>

          <TabsContent value="gerenciamento">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div variants={item}>
                <Card
                  className="border-border bg-card overflow-hidden transition-all hover:bg-card/90 hover:shadow-md hover:shadow-primary/5 cursor-pointer h-64"
                  onClick={() => router.push(`/vendas/${productId}`)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-2">Vendas</CardTitle>
                    <CardDescription>Visualize e gerencie todas as vendas relacionadas a este produto</CardDescription>
                    <Button variant="ghost" size="sm" className="mt-4">
                      Acessar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card
                  className="border-border bg-card overflow-hidden transition-all hover:bg-card/90 hover:shadow-md hover:shadow-primary/5 cursor-pointer h-64"
                  onClick={() => router.push(`/codigos/${productId}`)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Binary className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-2">Códigos</CardTitle>
                    <CardDescription>Gerencie os códigos de ativação associados a este produto</CardDescription>
                    <Button variant="ghost" size="sm" className="mt-4">
                      Acessar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="detalhes">
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Detalhes Técnicos</CardTitle>
                <CardDescription>Informações técnicas sobre este produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">ID do Produto</h3>
                    <p className="font-mono bg-muted p-2 rounded-md text-sm">{produto.id}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                    <p className="font-mono bg-muted p-2 rounded-md text-sm">
                      {produto.created_at ? new Date(produto.created_at).toISOString() : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                    <p className="font-mono bg-muted p-2 rounded-md text-sm">
                      {produto.created_at ? new Date(produto.created_at).toISOString() : "N/A"}
                    </p>
                  </div>


                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
