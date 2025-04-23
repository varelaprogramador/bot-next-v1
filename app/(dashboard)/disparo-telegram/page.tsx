"use client";

import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
    Send,
    Trash,
    Upload,
    Loader2,
    FileText,
    Save,
    UserPlus,
} from "lucide-react";
import Image from "next/image";
import GaleriaPopup from "@/app/components/popup-imagens";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
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
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import MessageConfirmation from "./_components/message-confirmation";
interface MessageTemplate {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    created_at: string;
}

interface TelegramContact {
    id: number;
    name: string;
    telegram_id: string;
    created_at: string;
}

export default function DisparoTelegramPage() {
    const [loading, setLoading] = useState(false);
    const [telegramContacts, setTelegramContacts] = useState<string[]>([]);
    const [importingContacts, setImportingContacts] = useState(false);
    const [image, setImage] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
    const [showAddContactDialog, setShowAddContactDialog] = useState(false);
    const [templateTitle, setTemplateTitle] = useState("");
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [contactName, setContactName] = useState("");
    const [contactTelegramId, setContactTelegramId] = useState("");

    const handleImportContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportingContacts(true);
        try {
            const text = await file.text();
            const contacts = text.split('\n')
                .map(contact => contact.trim())
                .filter(contact => contact && /^\d+$/.test(contact)); // Apenas números válidos

            if (contacts.length === 0) {
                throw new Error("Nenhum contato válido encontrado no arquivo");
            }

            setTelegramContacts(contacts);
            toast({
                title: "Sucesso",
                description: `${contacts.length} contatos importados com sucesso.`,
            });
        } catch (error) {
            console.error("Erro ao importar contatos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível importar os contatos. Verifique se o arquivo contém apenas números válidos do Telegram.",
                variant: "destructive",
            });
        } finally {
            setImportingContacts(false);
        }
    };

    const handleSendMessage = () => {
        if (telegramContacts.length === 0) {
            toast({
                title: "Atenção",
                description: "Por favor, importe pelo menos um contato do Telegram.",
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
            const response = await fetch("/api/templates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: templateTitle,
                    content: message,
                    image_url: image || null,
                }),
            });

            if (!response.ok) {
                throw new Error("Falha ao salvar o modelo");
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

    const handleSaveContact = async () => {
        if (!contactName.trim()) {
            toast({
                title: "Erro",
                description: "Por favor, forneça um nome para o contato.",
                variant: "destructive",
            });
            return;
        }

        if (!contactTelegramId.trim() || !/^\d+$/.test(contactTelegramId)) {
            toast({
                title: "Erro",
                description: "Por favor, forneça um ID do Telegram válido (apenas números).",
                variant: "destructive",
            });
            return;
        }

        setSavingContact(true);

        try {
            const response = await fetch("/api/telegram-contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: contactName,
                    telegram_id: contactTelegramId,
                }),
            });

            if (!response.ok) {
                throw new Error("Falha ao salvar o contato");
            }

            toast({
                title: "Sucesso",
                description: "Contato salvo com sucesso.",
            });

            // Adicionar o novo contato à lista local
            setTelegramContacts(prev => [...prev, contactTelegramId]);

            setShowAddContactDialog(false);
            setContactName("");
            setContactTelegramId("");
        } catch (error) {
            console.error("Erro ao salvar contato:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar o contato.",
                variant: "destructive",
            });
        } finally {
            setSavingContact(false);
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

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const response = await fetch("/api/templates");
            if (!response.ok) {
                throw new Error("Falha ao carregar modelos");
            }
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error("Error loading templates:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os modelos de mensagem.",
                variant: "destructive",
            });
        } finally {
            setLoadingTemplates(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Disparo para Lista do Telegram</h1>
                <Badge variant="outline" className="px-3 py-1">
                    {telegramContacts.length} contatos importados
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-[70vh] flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>Lista de Contatos</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAddContactDialog(true)}
                                    className="flex items-center gap-1"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    <span>Adicionar Contato</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="flex items-center gap-1"
                                >
                                    <label>
                                        <Upload className="h-4 w-4" />
                                        <span>Importar Contatos</span>
                                        <input
                                            type="file"
                                            accept=".txt"
                                            className="hidden"
                                            onChange={handleImportContacts}
                                        />
                                    </label>
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {importingContacts ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Importando contatos...</span>
                            </div>
                        ) : telegramContacts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Nenhum contato importado</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="space-y-2 p-4">
                                    {telegramContacts.map((contact, index) => (
                                        <div
                                            key={`telegram-${index}`}
                                            className="flex items-center p-2 bg-muted/30 rounded-md"
                                        >
                                            <span className="text-sm">{contact}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
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
                                    onClick={() => {
                                        loadTemplates();
                                        setShowTemplatesDialog(true);
                                    }}
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
                                sendData={(url) => setImage(url)}
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
                                onChange={(e) => setMessage(e.target.value)}
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
                                disabled={telegramContacts.length === 0 || message.length < 10}
                            >
                                Continuar para Confirmação
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                onChange={(e) => setTemplateTitle(e.target.value)}
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
                            disabled={savingTemplate || !templateTitle.trim() || message.length < 10}
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

            {/* Add Contact Dialog */}
            <Dialog
                open={showAddContactDialog}
                onOpenChange={setShowAddContactDialog}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Contato do Telegram</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo contato para disparo de mensagens.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Nome do Contato</Label>
                            <Input
                                id="contactName"
                                placeholder="Ex: João Silva"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactTelegramId">ID do Telegram</Label>
                            <Input
                                id="contactTelegramId"
                                placeholder="Ex: 123456789"
                                value={contactTelegramId}
                                onChange={(e) => setContactTelegramId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                O ID do Telegram deve conter apenas números.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddContactDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveContact}
                            disabled={savingContact || !contactName.trim() || !contactTelegramId.trim()}
                        >
                            {savingContact ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Salvar Contato
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
                                                <CardTitle className="text-base">
                                                    {template.title}
                                                </CardTitle>
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
                                            <CardContent className="p-2 bg-muted/30 flex justify-end">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleLoadTemplate(template)}
                                                >
                                                    Usar este modelo
                                                </Button>
                                            </CardContent>
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
                    telegramContacts={telegramContacts}
                    message={message}
                    image={image}
                    buttons={[]}
                    onClose={() => setShowConfirmation(false)}
                />
            )}
        </div>
    );
} 