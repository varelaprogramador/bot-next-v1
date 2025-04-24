"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { ArrowRightIcon, Calendar, CircleDollarSign, Trash2, Search, BarChart3, Plus, Filter, Loader2, Tag, SlidersHorizontal, X } from 'lucide-react'

import type { ProdutosProps } from "@/app/utils/produto"
import { CreateProduto } from "@/app/components/create-forms/produto"
import { EditProduto } from "@/app/components/edit-form/produto-edit"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
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
import { Progress } from "@/app/components/ui/progress"

export default function Produtos() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProdutosProps[]>([])
  const [filterText, setFilterText] = useState("")
  const [filterData, setFilterData] = useState<ProdutosProps[]>([])
  const [filterCategoria, setFilterCategoria] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    mensal: 0,
    anual: 0,
    avgPrice: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("produtos").select("*")

        if (error) {
          throw error
        }

        setData(data || [])

        // Calculate stats
        if (data) {
          const mensal = data.filter((item) => item.categoria === "mensal").length
          const anual = data.filter((item) => item.categoria === "anual").length
          const avgPrice = data.reduce((acc, item) => acc + (item.valor || 0), 0) / (data.length || 1)

          setStats({
            total: data.length,
            mensal,
            anual,
            avgPrice,
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Não foi possível carregar os produtos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  useEffect(() => {
    const subscription = supabase.channel(`realtime:public:produtos`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produtos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as ProdutosProps]
            case "UPDATE":
              return prevData.map((item) => (item.id === payload.new.id ? (payload.new as ProdutosProps) : item))
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id)
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

  useEffect(() => {
    let filtered = [...data]

    // Apply text filter
    if (filterText) {
      filtered = filtered.filter(
        (item) =>
          item.nome?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.descricao?.toLowerCase().includes(filterText.toLowerCase()),
      )
    }

    // Apply category filter
    if (filterCategoria && filterCategoria !== "geral") {
      filtered = filtered.filter((item) => item.categoria?.toLowerCase() === filterCategoria.toLowerCase())
    }

    // Apply sorting
    if (sortOrder) {
      filtered.sort((a, b) => {
        if (sortOrder === "asc") {
          return (a.valor || 0) - (b.valor || 0)
        } else {
          return (b.valor || 0) - (a.valor || 0)
        }
      })
    }

    setFilterData(filtered)
  }, [filterText, filterCategoria, sortOrder, data])

  const handleConfirmCreate = async ({ data }: { data: ProdutosProps }) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("produtos").insert([data])
      if (error) {
        throw error
      }
      toast.success("Produto criado com sucesso")
    } catch (error) {
      console.error("Erro ao criar produto:", error)
      toast.error("Não foi possível criar o produto")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmEdit = async ({ data }: { data: ProdutosProps }) => {
    try {
      const { error } = await supabase.from("produtos").update(data).eq("id", data.id)
      if (error) {
        throw error
      }
      toast.success("Produto atualizado com sucesso")
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast.error("Não foi possível atualizar o produto")
    }
  }

  const handleDeleteProduto = async (id: string) => {
    setDeleteLoading(id)
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id)
      if (error) {
        throw error
      }
      toast.success("Produto excluído com sucesso")
      setData((prevData) => prevData.filter((produto) => produto.id !== id))
    } catch (error) {
      console.error("Erro ao deletar produto:", error)
      toast.error("Não foi possível excluir o produto")
    } finally {
      setDeleteLoading(null)
    }
  }

  // Função para gerar um número aleatório de vendas para demonstração
  const getRandomSales = () => {
    return Math.floor(Math.random() * 100)
  }

  const clearFilters = () => {
    setFilterText("")
    setFilterCategoria("")
    setSortOrder("")
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen px-4 py-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seu catálogo de produtos e acompanhe seu desempenho</p>
          </div>

          <div className="flex gap-2">
            <CreateProduto onConfirmCreate={handleConfirmCreate} />

          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Total
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{stats.total}</h3>
                <p className="text-sm text-muted-foreground">Produtos cadastrados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Mensal
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{stats.mensal}</h3>
                <p className="text-sm text-muted-foreground">Produtos mensais</p>
              </div>
              <Progress value={(stats.mensal / (stats.total || 1)) * 100} className="h-1.5 mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Anual
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{stats.anual}</h3>
                <p className="text-sm text-muted-foreground">Produtos anuais</p>
              </div>
              <Progress value={(stats.anual / (stats.total || 1)) * 100} className="h-1.5 mt-4" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CircleDollarSign className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline" className="font-medium">
                  Média
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">R$ {stats.avgPrice.toFixed(2)}</h3>
                <p className="text-sm text-muted-foreground">Valor médio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              className="pl-10"
              onChange={(e) => setFilterText(e.target.value)}
              value={filterText}
            />
          </div>

          <div className="flex gap-2">
            <Select onValueChange={setFilterCategoria} value={filterCategoria}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categoria</SelectLabel>
                  <SelectItem value="geral">Todas</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>Preço: Menor para Maior</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>Preço: Maior para Menor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("")}>Limpar Ordenação</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10" : ""}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(filterText || filterCategoria || sortOrder) && (
          <div

            className="mb-4"
          >
            <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-md">
              <div className="text-sm text-muted-foreground">Filtros ativos:</div>
              <div className="flex flex-wrap gap-2">
                {filterText && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: {filterText}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterText("")} />
                  </Badge>
                )}
                {filterCategoria && filterCategoria !== "geral" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Categoria: {filterCategoria}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCategoria("")} />
                  </Badge>
                )}
                {sortOrder && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Ordenação: {sortOrder === "asc" ? "Menor preço" : "Maior preço"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSortOrder("")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                  Limpar todos
                </Button>
              </div>
            </div>
          </div>
        )}

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Filtros avançados</CardTitle>
                <CardDescription>Refine sua busca com filtros específicos</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select onValueChange={setFilterCategoria} value={filterCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenação</label>
                  <Select onValueChange={(value) => setSortOrder(value as "asc" | "desc" | "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Padrão</SelectItem>
                      <SelectItem value="asc">Menor preço</SelectItem>
                      <SelectItem value="desc">Maior preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Limpar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {loading ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div key={i} variants={item}>
                <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <>
            {filterData.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filterData.map((produto) => {
                  const vendas = getRandomSales()

                  return (
                    <div key={produto.id}>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Card className="group overflow-hidden border-border bg-card transition-all hover:bg-card/90 hover:shadow-md hover:shadow-primary/5">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                                    {produto.nome || "Produto teste"}
                                  </CardTitle>
                                  <Badge
                                    className={`${produto.categoria === "mensal" ? "bg-primary" : "bg-secondary"
                                      } text-primary-foreground px-2 py-0.5 text-xs font-medium`}
                                  >
                                    {produto.categoria || "categoria"}
                                  </Badge>
                                </div>
                                <CardDescription className="line-clamp-2 h-10 text-muted-foreground">
                                  {produto.descricao || "Sem descrição"}
                                </CardDescription>
                              </CardHeader>

                              <CardContent className="pb-2">
                                <div className="flex items-center justify-between py-2 text-sm text-muted-foreground border-y border-border">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <CircleDollarSign size={16} className="text-primary" />
                                    </div>
                                    <div>
                                      <div className="text-xs">Valor</div>
                                      <div className="font-semibold text-foreground">
                                        R$ {produto.valor?.toFixed(2) || "0.00"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Calendar size={16} className="text-primary" />
                                    </div>
                                    <div>
                                      <div className="text-xs">Data</div>
                                      <div className="font-medium text-foreground">
                                        {produto.created_at
                                          ? new Date(produto.created_at).toLocaleDateString()
                                          : "No date"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>

                              <CardFooter className="flex gap-2">
                                <Button
                                  onClick={() => (window.location.href = `/produtos/${produto.id}`)}
                                  className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                  Acessar <ArrowRightIcon size={15} className="ml-1" />
                                </Button>
                                <EditProduto produto={produto} onConfirmEdit={handleConfirmEdit} />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                      <Trash2 size={16} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto &quot;{produto.nome}&quot; e todos os dados associados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteProduto(produto?.id || "")}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deleteLoading === produto.id}
                                      >
                                        {deleteLoading === produto.id ? (
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
                              </CardFooter>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-card border-border p-4 rounded-md max-w-xs">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h3 className="font-bold">{produto.nome}</h3>
                                <Badge variant="outline">{produto.categoria}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{produto.descricao}</p>
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                  <CircleDollarSign size={16} className="text-primary" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Valor</div>
                                    <div className="font-medium">R$ {produto.valor?.toFixed(2) || "0.00"}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BarChart3 size={16} className="text-primary" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Vendas</div>
                                    <div className="font-medium">{vendas} unidades</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div>
                <Card className="border-border bg-card p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Search size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground mb-6">Tente ajustar seus filtros ou adicione um novo produto</p>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                      <CreateProduto onConfirmCreate={handleConfirmCreate} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
