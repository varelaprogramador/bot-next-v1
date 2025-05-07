"use client";

import { useState, useEffect, SetStateAction } from "react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Send,
  Trash,
  Search,
  CheckSquare,
  Save,
  FileText,
  Plus,
  Loader2,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import { Checkbox } from "@/app/components/ui/checkbox";
import GaleriaPopup from "@/app/components/popup-imagens";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";

import { createClientSupabaseClient } from "@/lib/supabase/client";

import { UserDropdown } from "./_components/user-dropdown";
import MessageConfirmation from "./_components/message-confirmation";
import { toast } from "@/hooks/use-toast";

export interface ButtonProps {
  name: string;
  command: string;
  type: string;
}

interface UserProps {
  id: string;
  user_id: string;
  username: string;
  saldo: string;
  created_at: string;
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export default function DisparoPage() {
  const supabase = createClientSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProps[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [image, setImage] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [buttons, setButtons] = useState<ButtonProps[]>([]);

  // Template related states
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load message templates.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = supabase.channel("realtime:public:users").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
      },
      (payload) => {
        setUsers((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as UserProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id === payload.new.id ? (payload.new as UserProps) : item
              );
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id);
            default:
              return prevData;
          }
        });
      }
    );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Subscribe to template changes
  useEffect(() => {
    const subscription = supabase
      .channel("realtime:public:message_templates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_templates",
        },
        (payload) => {
          setTemplates((prevData) => {
            switch (payload.eventType) {
              case "INSERT":
                return [payload.new as MessageTemplate, ...prevData];
              case "UPDATE":
                return prevData.map((item) =>
                  item.id === payload.new.id
                    ? (payload.new as MessageTemplate)
                    : item
                );
              case "DELETE":
                return prevData.filter((item) => item.id !== payload.old.id);
              default:
                return prevData;
            }
          });
        }
      );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLeadSelection = (userId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllLeads = () => {
    const allUserIds = filteredUsers.map((user) => user.user_id);
    setSelectedLeads(allUserIds);
    toast({
      title: "Seleção em massa",
      description: `${allUserIds.length} leads selecionados com sucesso.`,
    });
  };

  const handleSendMessage = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione pelo menos um lead.",
        variant: "destructive",
      });
      return;
    }

    if (message.length < 10) {
      toast({
        title: "Atenção",
        description: "A mensagem deve conter mais de 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça um título para o modelo.",
        variant: "destructive",
      });
      return;
    }

    if (message.length < 10) {
      toast({
        title: "Erro",
        description: "A mensagem deve conter mais de 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSavingTemplate(true);

    try {
      const { data, error } = await supabase
        .from("message_templates")
        .insert([
          {
            title: templateTitle,
            content: message,
            image_url: image || null,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Modelo de mensagem salvo com sucesso.",
      });

      setShowSaveTemplateDialog(false);
      setTemplateTitle("");
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o modelo de mensagem.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    if (template.image_url) {
      setImage(template.image_url);
    }
    setShowTemplatesDialog(false);

    toast({
      title: "Modelo carregado",
      description: `Modelo "${template.title}" carregado com sucesso.`,
    });
  };

  const handleDeleteTemplate = async (id: string) => {
    console.log("Deleting template with ID:", id);
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      window.location.reload();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Modelo de mensagem excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o modelo de mensagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disparo de Mensagens</h1>

        <Badge variant="outline" className="px-3 py-1">
          {selectedLeads.length} leads selecionados
        </Badge>

      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">Compor Mensagem</TabsTrigger>

          <TabsTrigger value="history">Histórico de Disparos</TabsTrigger>

        </TabsList>

        <TabsContent value="compose" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-[70vh] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Selecionar Destinatários</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllLeads}
                    className="flex items-center gap-1"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Selecionar Todos</span>
                  </Button>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchQuery}
                    onChange={(e: {
                      target: { value: SetStateAction<string> };
                    }) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Carregando usuários...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user, index) => (
                      <div
                        key={`user-${index}`}
                        className={`flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors ${selectedLeads.includes(user.user_id)
                          ? "bg-muted/30"
                          : ""
                          }`}
                        onClick={() => toggleLeadSelection(user.user_id)}
                      >
                        <Checkbox
                          checked={selectedLeads.includes(user.user_id)}
                          onCheckedChange={() =>
                            toggleLeadSelection(user.user_id)
                          }
                          className="mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.user_id}
                          </p>
                        </div>
                        <UserDropdown user={user} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-[70vh] flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Compor Mensagem</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplatesDialog(true)}
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Modelos</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSaveTemplateDialog(true)}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      <span>Salvar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-auto">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Imagem</h3>
                    {image && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImage("")}
                        className="h-8 px-2 text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        <span>Remover</span>
                      </Button>
                    )}
                  </div>

                  <GaleriaPopup
                    defaultValue=""
                    sendData={(url: SetStateAction<string>) => setImage(url)}
                    onClose={() => { }}
                  />

                  {image && (
                    <div className="mt-2 rounded-md overflow-hidden border">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Mensagem</h3>
                  <Textarea
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={(e: {
                      target: { value: SetStateAction<string> };
                    }) => setMessage(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} caracteres (mínimo: 10)
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSendMessage}
                    className="w-full"
                    disabled={selectedLeads.length === 0 || message.length < 10}
                  >
                    Continuar para Confirmação
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Disparos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O histórico de disparos será implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Template Dialog */}
      <Dialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Salvar Modelo de Mensagem</DialogTitle>
            <DialogDescription>
              Salve esta mensagem como um modelo para uso futuro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateTitle">Título do Modelo</Label>
              <Input
                id="templateTitle"
                placeholder="Ex: Promoção de Fim de Semana"
                value={templateTitle}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setTemplateTitle(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Prévia da Mensagem</Label>
              <div className="bg-muted p-3 rounded-md text-sm max-h-[150px] overflow-y-auto">
                {message}
              </div>
              {image && (
                <div className="mt-2">
                  <Label>Imagem incluída</Label>
                  <div className="mt-1 h-20 w-20 relative rounded-md overflow-hidden border">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt="Template image"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={
                savingTemplate || !templateTitle.trim() || message.length < 10
              }
            >
              {savingTemplate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Modelo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Modelos de Mensagem</DialogTitle>
            <DialogDescription>
              Selecione um modelo para carregar na área de composição.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingTemplates ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum modelo de mensagem salvo.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">
                            {template.title}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleDeleteTemplate(template.id)
                                }
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Criado em{" "}
                          {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex gap-4">
                          {template.image_url && (
                            <div className="h-16 w-16 relative rounded-md overflow-hidden flex-shrink-0 border">
                              <Image
                                src={template.image_url || "/placeholder.svg"}
                                alt="Template image"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm line-clamp-3">
                              {template.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-2 bg-muted/30 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleLoadTemplate(template)}
                        >
                          Usar este modelo
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplatesDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConfirmation && (
        <MessageConfirmation
          selectedLeads={selectedLeads}
          message={message}
          image={image}
          buttons={buttons}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}
