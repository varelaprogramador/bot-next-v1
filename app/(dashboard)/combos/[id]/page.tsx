"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  CircleDollarSign,
  Binary,
  Calendar,
  ArrowLeft,
  Trash2,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Info,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/app/components/ui/button"
import type { CombosProps } from "@/app/utils/combos"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import { CreateOrUpdateCombo } from "@/app/components/edit-form/combos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"

const supabase = createClient()

export default function ComboDetalhes() {
  const [combo, setCombo] = useState<CombosProps | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const { id: comboId } = useParams()
  const router = useRouter()

  const handleConfirmEdit = async ({ data }: { data: CombosProps }) => {
    try {
      const { error } = await supabase.from("combos").update(data).eq("id", data.id)
      if (error) {
        throw error
      }
      setCombo(data)
      toast({
        title: "Combo atualizado",
        description: "O combo foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar combo:", error)
      toast({
        title: "Erro ao atualizar combo",
        description: "Não foi possível atualizar o combo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const fetchCombo = async () => {
      if (!comboId) return

      setLoading(true)

      try {
        const { data, error } = await supabase.from("combos").select("*").eq("id", comboId).single()

        if (error) {
          throw error
        }

        setCombo(data)
      } catch (error) {
        console.error("Erro ao carregar combo:", error)
        toast({
          title: "Erro ao carregar combo",
          description: "Não foi possível carregar os detalhes do combo.",
          variant: "destructive",
        })
        router.push("/combos")
      } finally {
        setLoading(false)
      }
    }

    fetchCombo()
  }, [comboId, router])

  const handleDeleteProduct = async (productId: string) => {
    setProductToDelete(productId)
    setDeleteProductDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!combo || !productToDelete) return

    try {
      // Filter out the product with the given ID
      const updatedProducts = combo.produtos.filter((produto) => produto.id !== productToDelete)

      // Update the combo in Supabase
      const { error } = await supabase.from("combos").update({ produtos: updatedProducts }).eq("id", combo.id)

      if (error) {
        throw error
      }

      // Update local state
      setCombo({
        ...combo,
        produtos: updatedProducts,
      })

      toast({
        title: "Produto removido",
        description: "O produto foi removido do combo com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao remover produto:", error)
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto do combo.",
        variant: "destructive",
      })
    } finally {
      setDeleteProductDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleDeleteCombo = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCombo = async () => {
    if (!combo) return

    try {
      const { error } = await supabase.from("combos").delete().eq("id", combo.id)

      if (error) {
        throw error
      }

      toast({
        title: "Combo excluído",
        description: "O combo foi excluído com sucesso.",
      })
      router.push("/combos")
    } catch (error) {
      console.error("Erro ao excluir combo:", error)
      toast({
        title: "Erro ao excluir combo",
        description: "Não foi possível excluir o combo.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold">Combo não encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-6">O combo solicitado não existe ou foi removido.</p>
          <Button onClick={() => router.push("/combos")}>Voltar para Combos</Button>
        </Card>
      </div>
    )
  }

  const productIds = combo.produtos.map((produto) => produto.id).join(",")
  const totalProducts = combo.produtos.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/combos">Combos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink>{combo.nome}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{combo.nome}</h1>
          <p className="text-muted-foreground">Detalhes e gerenciamento do combo</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/combos")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>

          <CreateOrUpdateCombo combo={combo} onConfirm={handleConfirmEdit} />

          <Button variant="destructive" onClick={handleDeleteCombo}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes do Combo</CardTitle>
            <CardDescription>Informações gerais sobre o combo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Descrição</h3>
              <p className="text-muted-foreground">
                {combo.descricao || "Nenhuma descrição disponível para este combo."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <CircleDollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">Valor</h3>
                  <p className="text-2xl font-bold">R$ {combo.valor?.toFixed(2) || "0.00"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <Package className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="text-lg font-medium">Produtos</h3>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="text-lg font-medium">Criado em</h3>
                  <p className="text-lg">
                    {combo.created_at ? new Date(combo.created_at).toLocaleDateString() : "Sem data"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Operações disponíveis para este combo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => (window.location.href = `/codigos-combo/${productIds}`)}
              disabled={totalProducts === 0}
            >
              <Binary className="mr-2 h-5 w-5" />
              Gerenciar Códigos
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button className="w-full justify-start" variant="outline" disabled>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Ver Vendas
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Em breve</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button className="w-full justify-start" variant="outline" disabled>
                      <Tag className="mr-2 h-5 w-5" />
                      Adicionar à Loja
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Em breve</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produtos do Combo</CardTitle>
            <CardDescription>{totalProducts} produto(s) incluído(s) neste combo</CardDescription>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Em breve</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <CardContent>
          {totalProducts === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Nenhum produto</AlertTitle>
              <AlertDescription>
                Este combo não possui produtos. Adicione produtos para disponibilizá-lo para venda.
              </AlertDescription>
            </Alert>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {combo.produtos.map((item, index) => (
                <AccordionItem key={`${item.id}-${index}`} value={`item-${index}`}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                    <div className="flex justify-between items-center max-md:flex-col gap-2 w-full pr-4">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-3">
                          {index + 1}
                        </Badge>
                        <h3 className="text-lg font-medium">{item.nome}</h3>
                      </div>
                      <Badge>R$ {item.valor.toFixed(2)}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t mt-2 pt-4">
                    <div className="px-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                        <p>{item.descricao || "Sem descrição"}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Categoria</h4>
                          <Badge variant="outline">{item.categoria || "Sem categoria"}</Badge>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">ID do Produto</h4>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{item.id}</code>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Criado em</h4>
                          <p>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "Sem data"}</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(item.id || "")}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remover do Combo
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este combo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCombo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este produto do combo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
