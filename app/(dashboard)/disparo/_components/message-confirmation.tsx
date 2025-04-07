"use client";

import { SetStateAction, useState } from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/app/components/ui/card";
import { Plus, X, MoveRight, Send, Loader2 } from "lucide-react";
import type { ButtonProps } from "../page";
import { toast } from "@/hooks/use-toast";

interface MessageConfirmationProps {
  selectedLeads: string[];
  message: string;
  image: string;
  buttons: ButtonProps[];
  onClose: () => void;
}

export default function MessageConfirmation({
  selectedLeads,
  message,
  image,
  buttons,
  onClose,
}: MessageConfirmationProps) {
  const [newButtons, setNewButtons] = useState<ButtonProps[]>(buttons || []);
  const [newButtonName, setNewButtonName] = useState<string>("");
  const [newButtonCommand, setNewButtonCommand] = useState<string>("");
  const [buttonType, setButtonType] = useState<string>("link");
  const [currentTab, setCurrentTab] = useState<string>("preview");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<{
    successful: number;
    failed: number;
    total: number;
  } | null>(null);

  // Available bot routes for selection
  const botRoutes = [
    { key: "start-0", value: "bemvindos-2", text: "/start" },
    { key: "help-1", value: "ajuda-1", text: "/help" },
    { key: "info-2", value: "informacoes-3", text: "/info" },
  ];

  const addButton = () => {
    if (!newButtonName) {
      toast({
        title: "Erro",
        description: "O nome do botão é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!newButtonCommand) {
      toast({
        title: "Erro",
        description: "O comando do botão é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (buttonType === "link" && !newButtonCommand.startsWith("http")) {
      toast({
        title: "Erro",
        description: "Links devem começar com http:// ou https://",
        variant: "destructive",
      });
      return;
    }

    setNewButtons((prev) => [
      ...prev,
      {
        name: newButtonName,
        command: newButtonCommand,
        type: buttonType,
      },
    ]);

    setNewButtonName("");
    setNewButtonCommand("");
    toast({
      title: "Sucesso",
      description: "Botão adicionado com sucesso",
    });
  };

  const removeButton = (index: number) => {
    setNewButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessages = async () => {
    setIsSending(true);
    setProgress(0);
    setResults(null);

    try {
      // For small batches (less than 10), send individually
      if (selectedLeads.length < 10) {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedLeads.length; i++) {
          const userId = selectedLeads[i];
          setProgress(Math.floor((i / selectedLeads.length) * 100));

          try {
            const response = await fetch("/api/webhooks/telegram", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                message,
                button: newButtons,
                image,
                disparo: true,
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
              console.error(
                `Error sending to user ${userId}:`,
                await response.json()
              );
            }
          } catch (error) {
            errorCount++;
            console.error(`Error sending to user ${userId}:`, error);
          }
        }

        setResults({
          successful: successCount,
          failed: errorCount,
          total: selectedLeads.length,
        });

        if (errorCount === 0) {
          toast({
            title: "Sucesso",
            description: `Mensagem enviada com sucesso para ${successCount} destinatários.`,
          });
        } else {
          toast({
            title: "Parcialmente concluído",
            description: `Enviado para ${successCount} destinatários. Falha em ${errorCount} destinatários.`,
            variant: "destructive",
          });
        }
      }
      // For larger batches, use the batch API
      else {
        const response = await fetch("/api/webhooks/telegram/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userIds: selectedLeads,
            message,
            buttons: newButtons,
            image,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setResults({
            successful: result.successful,
            failed: result.failed,
            total: result.total,
          });

          if (result.failed === 0) {
            toast({
              title: "Sucesso",
              description: `Mensagem enviada com sucesso para ${result.successful} destinatários.`,
            });
          } else {
            toast({
              title: "Parcialmente concluído",
              description: `Enviado para ${result.successful} destinatários. Falha em ${result.failed} destinatários.`,
              variant: "destructive",
            });
          }
        } else {
          const error = await response.json();
          toast({
            title: "Erro",
            description:
              error.message || "Ocorreu um erro ao enviar as mensagens.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error sending messages:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar as mensagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setProgress(100);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmação de Envio</DialogTitle>
        </DialogHeader>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Prévia da Mensagem</TabsTrigger>
            <TabsTrigger value="buttons">
              Botões ({newButtons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4 pt-4">
            <Card className="border-none shadow-none">
              <CardHeader className="p-0">
                <h3 className="text-sm font-medium">
                  Prévia da mensagem para {selectedLeads.length} destinatário(s)
                </h3>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <div className="w-full bg-[url('/bg-telegram.svg')] bg-cover rounded-lg p-4">
                  {image && (
                    <div className="mb-2">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="rounded-lg w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="bg-[#212121] p-3 rounded-lg rounded-bl-none shadow-sm mb-4">
                    <p className="text-white text-base whitespace-pre-wrap">
                      {message}
                    </p>
                  </div>

                  {newButtons.length > 0 && (
                    <div className="mt-2">
                      <div className={`grid gap-2 ${getButtonGridClass()}`}>
                        {newButtons.map((button, index) => (
                          <button
                            key={index}
                            className={`
                              ${getButtonClass(index)}
                              bg-[#0088cc] bg-opacity-60 text-white py-2 px-4 rounded-lg text-sm font-medium 
                              hover:bg-[#006bb3] hover:shadow-lg transition-all duration-200 
                              focus:outline-none focus:ring-2 focus:ring-[#006bb3] focus:ring-opacity-50
                            `}
                          >
                            {button.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 px-0">
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("buttons")}
                >
                  {newButtons.length > 0 ? "Editar Botões" : "Adicionar Botões"}
                </Button>
                <Button onClick={sendMessages} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensagem
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="buttons" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-medium">Gerenciar Botões</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Nome do botão:
                    </label>
                    <Input
                      placeholder="Ex: Adquira agora!"
                      value={newButtonName}
                      onChange={(e: {
                        target: { value: SetStateAction<string> };
                      }) => setNewButtonName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Tipo de botão:
                    </label>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="type-link"
                          checked={buttonType === "link"}
                          onCheckedChange={() => setButtonType("link")}
                        />
                        <label
                          htmlFor="type-link"
                          className="text-sm font-medium leading-none"
                        >
                          Link
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="type-route"
                          checked={buttonType === "Rota do bot"}
                          onCheckedChange={() => setButtonType("Rota do bot")}
                        />
                        <label
                          htmlFor="type-route"
                          className="text-sm font-medium leading-none"
                        >
                          Rota do bot
                        </label>
                      </div>
                    </div>
                  </div>

                  {buttonType === "link" ? (
                    <div>
                      <label className="text-sm font-medium">URL:</label>
                      <Input
                        type="url"
                        placeholder="https://exemplo.com.br"
                        value={newButtonCommand}
                        onChange={(e: {
                          target: { value: SetStateAction<string> };
                        }) => setNewButtonCommand(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium">Rota:</label>
                      <Select onValueChange={setNewButtonCommand}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma rota" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Rotas disponíveis</SelectLabel>
                            {botRoutes.map((route) => (
                              <SelectItem key={route.key} value={route.value}>
                                {route.text}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button onClick={addButton} className="w-full">
                    Adicionar Botão
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {newButtons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Botões adicionados:
                    </h4>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md max-h-[150px] overflow-y-auto">
                      {newButtons.map((button, index) => (
                        <div key={index} className="flex items-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="pr-0 text-xs"
                          >
                            <span className="px-2">{button.name}</span>
                            <span
                              className="border-l pl-1 pr-2 hover:bg-destructive hover:text-destructive-foreground rounded-r-md"
                              onClick={() => removeButton(index)}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentTab("preview")}
                >
                  <MoveRight className="mr-2 h-4 w-4" />
                  Ver prévia
                </Button>
                <Button onClick={sendMessages} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensagem
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {isSending && (
          <div className="space-y-4 text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <h3 className="font-medium">Enviando mensagens...</h3>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {progress < 100
                ? `Processando ${progress}% (${Math.floor(
                    (selectedLeads.length * progress) / 100
                  )} de ${selectedLeads.length})`
                : "Processamento concluído"}
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-4 text-center p-4">
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {results.successful}
                </div>
                <div className="text-sm text-muted-foreground">Enviados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-destructive">
                  {results.failed}
                </div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{results.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Helper functions for button styling
  function getButtonGridClass() {
    if (newButtons.length === 1) return "grid-cols-1";
    if (newButtons.length === 2) return "grid-cols-2";
    if (newButtons.length === 3) return "grid-cols-1";
    if (newButtons.length === 4) return "grid-cols-2";
    return "grid-cols-1";
  }

  function getButtonClass(index: number) {
    if (newButtons.length === 4) {
      if (index === 0) return "col-span-2";
      if (index === 1 || index === 2) return "col-span-1";
      if (index === 3) return "col-span-2";
    }
    return "";
  }
}
