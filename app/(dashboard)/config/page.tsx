"use client"

import { type SetStateAction, useEffect, useState } from "react"
import { getUsers, deleteUser } from "@/app/actions/user-actions"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Home,
  RefreshCw,
  Search,
  Settings,
  Trash,
  Users,
} from "lucide-react"

import { Button } from "@/app/components/ui/button"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Input } from "@/app/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/app/components/ui/badge"
import { CreateUserDialog } from "./_components/user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"

interface User {
  id: string
  firstName: string
  lastName: string
  emailAddresses: Array<{ emailAddress: string }>
  role: string
  createdAt: string
}

export default function ConfigPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("users")
  const { toast } = useToast()

  const usersPerPage = 10
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

  const fetchUsers = async () => {
    try {
      setRefreshing(true)
      const data = await getUsers()
      setUsers(data)
      setFilteredUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido")
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const lowercaseQuery = searchQuery.toLowerCase()
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowercaseQuery) ||
          user.lastName.toLowerCase().includes(lowercaseQuery) ||
          user.emailAddresses.some((email) => email.emailAddress.toLowerCase().includes(lowercaseQuery)),
      )
      setFilteredUsers(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, users])

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await deleteUser(userToDelete.id)

      // Update local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id))
      setFilteredUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id))

      toast({
        title: "Usuário excluído",
        description: `${userToDelete.firstName} ${userToDelete.lastName} foi removido com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive",
      })
    } finally {
      setUserToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const confirmDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const exportUsers = () => {
    const csvContent = [
      ["ID", "Nome", "Sobrenome", "Email", "Função", "Criado em"],
      ...filteredUsers.map((user) => [
        user.id,
        user.firstName,
        user.lastName,
        user.emailAddresses[0]?.emailAddress || "",
        user.role,
        formatDate(user.createdAt),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `usuarios_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportação concluída",
      description: `${filteredUsers.length} usuários exportados com sucesso.`,
    })
  }

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-6" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))
  }

  return (
    <div className="container py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configurações</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground">Gerencie usuários e configurações do sistema</p>
        </div>
      </div>


      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Adicione, edite ou remova usuários do sistema. Total: {filteredUsers.length} usuários
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={fetchUsers}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={exportUsers}
                disabled={filteredUsers.length === 0}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtrar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por função</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilteredUsers(users)}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilteredUsers(users.filter((user) => user.role === "admin"))}>
                    Administradores
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilteredUsers(users.filter((user) => user.role === "member"))}
                  >
                    Membros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CreateUserDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
              />
            </div>

            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 p-4 rounded-md text-destructive"
              >
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={fetchUsers} className="mt-2">
                  Tentar novamente
                </Button>
              </motion.div>
            ) : filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                {searchQuery
                  ? "Nenhum usuário encontrado com os critérios de busca."
                  : "Nenhum usuário cadastrado."}
              </motion.div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="hidden md:table-cell">Criado em</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading
                      ? renderSkeletons()
                      : currentUsers.map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{indexOfFirstUser + index + 1}</TableCell>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>
                            {user.emailAddresses.length > 0 ? (
                              <span className="max-w-[200px] truncate block">
                                {user.emailAddresses[0].emailAddress}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Sem email
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user?.role === "admin" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {user?.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(user)}
                              aria-label={`Excluir ${user.firstName} ${user.lastName}`}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredUsers.length > usersPerPage && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de{" "}
                  {filteredUsers.length} usuários
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <span className="font-semibold">
                {userToDelete?.firstName} {userToDelete?.lastName}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
