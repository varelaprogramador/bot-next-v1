"use client";

import { SetStateAction, useState } from "react";
import {
  MoreVertical,
  UserRound,
  MessageSquare,
  Ban,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
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
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface UserProps {
  id: string;
  user_id: string;
  username: string;
  saldo: string;
  created_at: string;
}

interface UserDropdownProps {
  user: UserProps;
}

export function UserDropdown({ user }: UserDropdownProps) {
  const supabase = createClient();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);

  const copyUserId = () => {
    navigator.clipboard.writeText(user?.user_id);
    toast({
      description: "ID do usuário copiado para a área de transferência",
    });
  };

  const viewUserProfile = () => {
    setShowProfileDialog(true);

    // Use the user data that's already passed to the component
    setUserProfile(user);

    // No need to fetch from database since we already have the user data
  };

  const sendDirectMessage = () => {
    setShowMessageDialog(true);
  };

  const blockUser = () => {
    setShowBlockDialog(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch("/api/webhooks/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.user_id,
          message,
          button: [],
          disparo: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar mensagem");
      }

      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso",
      });

      setMessage("");
      setShowMessageDialog(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBlockUser = async () => {
    if (!blockReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça um motivo para o bloqueio",
        variant: "destructive",
      });
      return;
    }

    setBlockingUser(true);

    try {
      // Update user status in Supabase
      const { error } = await supabase
        .from("users")
        .update({
          status: "blocked",
          block_reason: blockReason,
          blocked_at: new Date().toISOString(),
        })
        .eq("user_id", user?.user_id);

      if (error) {
        throw error;
      }

      // Notify the user they've been blocked
      await fetch("/api/webhooks/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.user_id,
          message:
            "Sua conta foi bloqueada. Entre em contato com o suporte para mais informações.",
          disparo: true,
        }),
      });

      toast({
        title: "Usuário bloqueado",
        description: "O usuário foi bloqueado com sucesso",
      });

      setBlockReason("");
      setShowBlockDialog(false);
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o usuário",
        variant: "destructive",
      });
    } finally {
      setBlockingUser(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={viewUserProfile}>
            <UserRound className="mr-2 h-4 w-4" />
            <span>Ver perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={sendDirectMessage}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Mensagem direta</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyUserId}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copiar ID</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={blockUser} className="text-destructive">
            <Ban className="mr-2 h-4 w-4" />
            <span>Bloquear usuário</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
            <DialogDescription>Detalhes completos do usuário</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {userProfile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {userProfile.username || "Sem nome"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {userProfile.user_id}
                  </p>
                  {userProfile.status && (
                    <Badge
                      variant={
                        userProfile.status === "active"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {userProfile.status === "active" ? "Ativo" : "Bloqueado"}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Saldo</p>
                    <p className="text-xl">
                      R$ {userProfile.saldo?.toFixed(2) || "0.00"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Indicações</p>
                    <p className="text-xl">
                      R$ {userProfile.saldo_indicacao?.toFixed(2) || "0.00"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Informações da Conta
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em</span>
                    <span>
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total de compras
                    </span>
                    <span>{userProfile.vendas?.length || 0}</span>
                  </div>
                  {userProfile.status === "blocked" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Motivo do bloqueio
                      </span>
                      <span className="text-destructive">
                        {userProfile.block_reason || "Não especificado"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {userProfile.vendas && userProfile.vendas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Histórico de Compras
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {userProfile.vendas.map((venda: any) => (
                      <Card key={venda.uuid}>
                        <CardContent className="p-3 text-xs">
                          <div className="flex justify-between">
                            <span>Valor:</span>
                            <span>R$ {venda.valor?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Badge
                              variant={
                                venda.status === "concluido"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {venda.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Data:</span>
                            <span>
                              {new Date(venda.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p>Não foi possível carregar os dados do usuário</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowProfileDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem Direta</DialogTitle>
            <DialogDescription>
              Envie uma mensagem direta para o usuário ID: {user?.user_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !message.trim()}
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação bloqueará o usuário ID: {user?.user_id} e impedirá que
              ele use o sistema. O bloqueio pode ser revertido posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo do bloqueio</Label>
              <Textarea
                id="blockReason"
                placeholder="Informe o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBlockUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={blockingUser || !blockReason.trim()}
            >
              {blockingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Bloquear Usuário
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
