"use client";

import { SetStateAction, useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Search, Trash } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { CreateUserDialog } from "./_components/user";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: Array<{ emailAddress: string }>;
  role: string;
  createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/users/get-users");

      if (!response.ok) {
        throw new Error(`Erro ao buscar os usuários: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido"
      );
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowercaseQuery) ||
          user.lastName.toLowerCase().includes(lowercaseQuery) ||
          user.emailAddresses.some((email) =>
            email.emailAddress.toLowerCase().includes(lowercaseQuery)
          )
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch("/api/users/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userToDelete.id }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir usuário: ${response.status}`);
      }

      await response.json();

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id)
      );
      setFilteredUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id)
      );

      toast({
        title: "Usuário excluído",
        description: `${userToDelete.firstName} ${userToDelete.lastName} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Lista de Usuários</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchUsers}
                disabled={refreshing}
                aria-label="Atualizar lista"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <CreateUserDialog />
            </div>
          </div>

          <Separator />

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          {error ? (
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Nenhum usuário encontrado com os critérios de busca."
                : "Nenhum usuário cadastrado."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Criado em
                    </TableHead>
                    <TableHead className="w-20 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
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
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
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
        </div>
      </CardContent>

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
    </Card>
  );
}
