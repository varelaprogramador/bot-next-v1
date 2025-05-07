"use client"
import { Button } from "@/app/components/ui/button"
import { ArrowRightIcon, Binary, Calendar, CircleDollarSign, FilterIcon, Package, Plus, Search, SquareMousePointer, Trash2 } from 'lucide-react'
import { useEffect, useState } from "react"

import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Input } from "@/app/components/ui/input"
import { CreateOrUpdateCombo } from "@/app/components/edit-form/combos"
import type { CombosProps } from "@/app/utils/combos"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination"
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
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { ProdutosProps } from "@/app/utils/produto"

export default function Combos() {
  const supabase = createClientSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CombosProps[]>([])
  const [filterText, setFilterText] = useState("")
  const [filterData, setFilterData] = useState<CombosProps[]>([])
  const [filterCategory, setFilterCategory] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [comboToDelete, setComboToDelete] = useState<string | null>(null)

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filterData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filterData.length / itemsPerPage)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("combos").select("*")

        if (error) {
          throw error
        }

        setData(data || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro ao carregar combos",
          description: "Não foi possível carregar os combos. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  useEffect(() => {
    const subscription = supabase.channel(`realtime:public:combos`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "combos",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              toast({
                title: "Combo adicionado",
                description: "Um novo combo foi adicionado com sucesso.",
              })
              return [...prevData, payload.new as CombosProps]
            case "UPDATE":
              toast({
                title: "Combo atualizado",
                description: "O combo foi atualizado com sucesso.",
              })
              return prevData.map((item) => (item.id === payload.new.id ? (payload.new as CombosProps) : item))
            case "DELETE":
              toast({
                title: "Combo removido",
                description: "O combo foi removido com sucesso.",
              })
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
    if (data) {
      let filtered = [...data]

      // Apply text filter
      if (filterText) {
        filtered = filtered.filter(
          (item) =>
            item.nome.toLowerCase().includes(filterText.toLowerCase()) ||
            (item.descricao && item.descricao.toLowerCase().includes(filterText.toLowerCase())),
        )
      }

      // Apply category filter if needed in the future

      // Apply sorting
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || "").getTime()
        const dateB = new Date(b.created_at || "").getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })

      setFilterData(filtered)
    }
  }, [filterText, filterCategory, data, sortOrder])

  const handleConfirmCreate = async ({ data }: { data: CombosProps }) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("combos").insert([data])
      if (error) {
        throw error
      }
      toast({
        title: "Combo criado",
        description: "O combo foi criado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao criar combo:", error)
      toast({
        title: "Erro ao criar combo",
        description: "Não foi possível criar o combo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmEdit = async ({ data }: { data: CombosProps }) => {
    try {
      const { error } = await supabase.from("combos").update(data).eq("id", data.id)
      if (error) {
        throw error
      }
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

  const handleDeleteCombo = async (id: string) => {
    setComboToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!comboToDelete) return

    try {
      const { error } = await supabase.from("combos").delete().eq("id", comboToDelete)
      if (error) {
        throw error
      }
      toast({
        title: "Combo removido",
        description: "O combo foi removido com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao deletar combo:", error)
      toast({
        title: "Erro ao remover combo",
        description: "Não foi possível remover o combo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setComboToDelete(null)
    }
  }

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card key={`skeleton-${index}`} className="h-[380px]">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex w-full gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-10" />
            </div>
          </CardFooter>
        </Card>
      ))
  }

  // Function to get product image or fallback
  const getProductImage = (produto: ProdutosProps) => {
    return produto.url_image || `/placeholder.svg?height=80&width=80&query=product`
  }

  // Function to get product initials for avatar fallback
  const getProductInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center max-md:flex-col gap-2  ">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Área de Combos</h1>
          <p className="text-muted-foreground">Gerencie os combos de produtos disponíveis para venda.</p>
        </div>
        <div className="max-md:w-full">
          <CreateOrUpdateCombo onConfirm={handleConfirmCreate} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar combos..."
            className="pl-8"
            onChange={(e) => setFilterText(e.target.value)}
            value={filterText}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>Mais recentes primeiro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("asc")}>Mais antigos primeiro</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderSkeletons()}</div>
      ) : filterData.length === 0 ? (
        <Card className="w-full p-6 flex flex-col items-center justify-center text-center h-[300px]">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhum combo encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            {filterText ? "Tente ajustar os filtros de busca." : "Comece criando seu primeiro combo."}
          </p>
          <CreateOrUpdateCombo onConfirm={handleConfirmCreate} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((combo) => (
              <Card key={combo.id} className="flex flex-col transition-all duration-300 hover:shadow-md overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="line-clamp-1">{combo.nome || "Combo sem nome"}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-1">
                          {combo.produtos?.length || 0} produto(s)
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge>R$ {combo.valor?.toFixed(2) || "0.00"}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-2">
                  {/* Product preview section */}
                  <div className="mb-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {combo.produtos && combo.produtos.length > 0 ? (
                        <>
                          {combo.produtos.slice(0, 5).map((produto, index) => (
                            <Avatar
                              key={`${produto.id}-${index}`}
                              className={`border-2 border-background ${index === 0 ? "" : "-ml-2"
                                } transition-all duration-200 hover:scale-110 hover:z-10`}
                            >
                              <AvatarImage src={getProductImage(produto) || "/placeholder.svg"} alt={produto.nome} />
                              <AvatarFallback className="bg-primary/10">
                                {getProductInitials(produto.nome)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {combo.produtos.length > 5 && (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border-2 border-background -ml-2 text-xs font-medium">
                              +{combo.produtos.length - 5}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-full h-10 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          Sem produtos
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-3 mb-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {combo.descricao || "Sem descrição disponível"}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <CircleDollarSign size={14} />
                      <span>R$ {combo.valor?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Binary size={14} />
                      <span>{combo.produtos?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{combo.created_at?.split("T")[0] || "Sem data"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => (window.location.href = `/combos/${combo.id}`)}
                    >
                      Acessar <ArrowRightIcon size={14} className="ml-1" />
                    </Button>


                    <Button variant="destructive" size="icon" onClick={() => handleDeleteCombo(combo.id as string)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) setCurrentPage(currentPage - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1

                  // Adjust page numbers for pagination with ellipsis
                  if (totalPages > 5) {
                    if (currentPage > 3 && currentPage < totalPages - 1) {
                      pageNum = currentPage - 2 + i
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 4 + i
                    }
                  }

                  // Show ellipsis for large page counts
                  if (totalPages > 5) {
                    if (i === 0 && currentPage > 3) {
                      return (
                        <PaginationItem key="start-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }

                    if (i === 4 && currentPage < totalPages - 2) {
                      return (
                        <PaginationItem key="end-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(pageNum)
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

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
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
