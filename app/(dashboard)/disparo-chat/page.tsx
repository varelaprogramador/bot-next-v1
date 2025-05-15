"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/app/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/app/components/ui/tabs";
import {
    Send,
    Search,
    PlusCircle,
    Image as ImageIcon,
    Users,
    Save,
    FileText,
    Paperclip,
    Trash,
    Plus,
    UserPlus,
    Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import GaleriaPopup from "@/app/components/popup-imagens";
import ChatBubble from "./_components/chat-bubble";
import ContactList from "./_components/contact-list";
import MessagePreview from "./_components/message-preview";

interface Contact {
    id: string;
    name: string;
    user_id: string;
    avatar?: string;
    last_message?: string;
    last_message_time?: string;
}

interface MessageTemplate {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    created_at: string;
}

export default function DisparoChatPage() {
    const supabase = createClientSupabaseClient();
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Estados
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [message, setMessage] = useState("");
    const [image, setImage] = useState("");
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [templateTitle, setTemplateTitle] = useState("");
    const [showAddContactDialog, setShowAddContactDialog] = useState(false);
    const [newContactName, setNewContactName] = useState("");
    const [newContactId, setNewContactId] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [showMultipleContactsDialog, setShowMultipleContactsDialog] = useState(false);

    // Carrega contatos
    useEffect(() => {
        loadContacts();
        loadTemplates();
    }, []);

    // Filtra contatos com base na pesquisa
    useEffect(() => {
        if (searchQuery) {
            const filtered = contacts.filter(contact =>
                contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.user_id.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredContacts(filtered);
        } else {
            setFilteredContacts(contacts);
        }
    }, [searchQuery, contacts]);

    // Rola para a última mensagem quando novas mensagens são adicionadas
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadContacts = async () => {
        setLoadingContacts(true);
        try {
            const { data, error } = await supabase.from("users").select("*");

            if (error) throw error;

            const formattedContacts = data.map(user => ({
                id: user.id,
                name: user.username,
                user_id: user.user_id,
                avatar: user.avatar_url || undefined,
                last_message: 'Clique para enviar uma mensagem',
                last_message_time: new Date().toISOString()
            }));

            setContacts(formattedContacts);
            setFilteredContacts(formattedContacts);
        } catch (error) {
            console.error("Erro ao carregar contatos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os contatos",
                variant: "destructive",
            });
        } finally {
            setLoadingContacts(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from("message_templates")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error("Erro ao carregar templates:", error);
        }
    };

    const handleLoadTemplate = (template: MessageTemplate) => {
        setMessage(template.content);
        if (template.image_url) {
            setImage(template.image_url);
        }
        setShowTemplatesDialog(false);

        toast({
            title: "Template carregado",
            description: `Template "${template.title}" carregado com sucesso`,
        });
    };

    const handleSaveTemplate = async () => {
        if (!templateTitle.trim()) {
            toast({
                title: "Erro",
                description: "Por favor, forneça um título para o template",
                variant: "destructive",
            });
            return;
        }

        if (message.length < 5) {
            toast({
                title: "Erro",
                description: "A mensagem deve conter pelo menos 5 caracteres",
                variant: "destructive",
            });
            return;
        }

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

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Template salvo com sucesso",
            });

            setShowSaveTemplateDialog(false);
            setTemplateTitle("");
            loadTemplates();
        } catch (error) {
            console.error("Erro ao salvar template:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar o template",
                variant: "destructive",
            });
        }
    };

    const handleAddContact = async () => {
        if (!newContactName.trim() || !newContactId.trim()) {
            toast({
                title: "Erro",
                description: "Por favor, preencha todos os campos",
                variant: "destructive",
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from("users")
                .insert([
                    {
                        username: newContactName,
                        user_id: newContactId,
                    },
                ])
                .select();

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Contato adicionado com sucesso",
            });

            setShowAddContactDialog(false);
            setNewContactName("");
            setNewContactId("");
            loadContacts();
        } catch (error) {
            console.error("Erro ao adicionar contato:", error);
            toast({
                title: "Erro",
                description: "Não foi possível adicionar o contato",
                variant: "destructive",
            });
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() && !image) {
            toast({
                title: "Erro",
                description: "Digite uma mensagem ou adicione uma imagem",
                variant: "destructive",
            });
            return;
        }

        if (!selectedContact && selectedContacts.length === 0) {
            toast({
                title: "Erro",
                description: "Selecione pelo menos um contato para enviar a mensagem",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Se tiver um contato selecionado, adiciona ele à lista
            const recipients = selectedContact
                ? [selectedContact.user_id]
                : selectedContacts;

            // Adiciona a mensagem simulada antes para feedback visual
            for (const userId of recipients) {
                const newMessage = {
                    id: Date.now().toString(),
                    content: message,
                    image: image,
                    sender: "me",
                    timestamp: new Date().toISOString(),
                    status: "enviando"
                };

                setMessages(prev => [...prev, newMessage]);
            }

            // Usa o novo endpoint otimizado
            const response = await fetch("/api/disparo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    recipients,
                    message,
                    image,
                    platform: "telegram", // Ou adicione opção para escolher a plataforma
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Erro ao enviar mensagens");
            }

            // Atualiza o status das mensagens
            setMessages(prev => prev.map(msg => {
                if (msg.status === "enviando") {
                    return { ...msg, status: "enviado" };
                }
                return msg;
            }));

            if (result.failed > 0) {
                toast({
                    title: "Atenção",
                    description: `${result.successful} mensagens enviadas com sucesso. ${result.failed} falhas.`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Sucesso",
                    description: `${result.successful} ${result.successful === 1 ? 'mensagem enviada' : 'mensagens enviadas'} com sucesso.`,
                });
            }

            // Se houver mensagens ignoradas devido ao limite de taxa
            if (result.skipped > 0) {
                toast({
                    title: "Aviso de limite",
                    description: `${result.skipped} mensagens não foram enviadas devido ao limite de taxa. Restam ${result.remaining} mensagens disponíveis.`,
                    variant: "destructive",
                });
            }

            // Limpa os campos
            setMessage("");
            setImage("");

            // Se estava em modo de múltiplos contatos, limpa a seleção
            if (selectedContacts.length > 0) {
                setSelectedContacts([]);
                setShowMultipleContactsDialog(false);
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Não foi possível enviar a mensagem",
                variant: "destructive",
            });

            // Marca as mensagens como falha
            setMessages(prev => prev.map(msg => {
                if (msg.status === "enviando") {
                    return { ...msg, status: "falha" };
                }
                return msg;
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[80vh]">
                {/* Lista de contatos */}
                <Card className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle>Contatos</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowAddContactDialog(true)}
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowMultipleContactsDialog(true)}
                                >
                                    <Users className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar contato..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ContactList
                            contacts={filteredContacts}
                            loading={loadingContacts}
                            selectedContact={selectedContact}
                            onSelectContact={setSelectedContact}
                        />
                    </CardContent>
                </Card>

                {/* Área de chat */}
                <Card className="lg:col-span-8 flex flex-col h-full">
                    {selectedContact || selectedContacts.length > 0 ? (
                        <>
                            <CardHeader className="pb-2 border-b">
                                <div className="flex items-center">
                                    {selectedContact ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                                                {selectedContact.name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle>{selectedContact.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">ID: {selectedContact.user_id}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle>Disparo em massa</CardTitle>
                                                <Badge variant="outline">{selectedContacts.length} contatos selecionados</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                <ScrollArea className="h-full">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                                <Send className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-medium">Envie uma mensagem</h3>
                                            <p className="text-muted-foreground max-w-sm mt-2">
                                                Comece enviando uma mensagem para {selectedContact ? selectedContact.name : "os contatos selecionados"}.
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <ChatBubble
                                                key={msg.id}
                                                message={msg}
                                                isOutgoing={msg.sender === "me"}
                                            />
                                        ))
                                    )}
                                    <div ref={messageEndRef} />
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 border-t">
                                {image && (
                                    <div className="absolute bottom-20 left-4 right-4 p-2 bg-background border rounded-md">
                                        <div className="relative">
                                            <img
                                                src={image}
                                                alt="Imagem"
                                                className="h-32 object-contain rounded-md"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setImage("")}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center w-full gap-2">
                                    <div className="flex-none flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowImagePicker(true)}
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowTemplatesDialog(true)}
                                        >
                                            <FileText className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 min-h-10 max-h-32"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <Button
                                        disabled={loading}
                                        onClick={handleSendMessage}
                                        size="icon"
                                        className="flex-none"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>
                            </CardFooter>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <Send className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Disparador de Mensagens</h2>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                Selecione um contato para iniciar uma conversa ou use a opção de disparo em massa.
                            </p>
                            <div className="flex gap-4">
                                <Button onClick={() => setShowAddContactDialog(true)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Adicionar contato
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowMultipleContactsDialog(true)}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Disparo em massa
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialog de templates */}
            <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Templates de mensagem</DialogTitle>
                        <DialogDescription>
                            Selecione um template para carregar ou crie um novo.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] mt-2">
                        <div className="space-y-4 pr-4">
                            {templates.length === 0 ? (
                                <p className="text-center py-4 text-muted-foreground">
                                    Nenhum template encontrado.
                                </p>
                            ) : (
                                templates.map((template) => (
                                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleLoadTemplate(template)}>
                                        <CardContent className="p-4">
                                            <h3 className="font-medium mb-2">{template.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {template.content}
                                            </p>
                                            {template.image_url && (
                                                <div className="mt-2">
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <ImageIcon className="h-3 w-3" />
                                                        Contém imagem
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex items-center justify-between sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowTemplatesDialog(false);
                                setShowSaveTemplateDialog(true);
                            }}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar atual como template
                        </Button>
                        <Button variant="secondary" onClick={() => setShowTemplatesDialog(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para salvar template */}
            <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Salvar template</DialogTitle>
                        <DialogDescription>
                            Dê um nome ao seu template para salvá-lo para uso futuro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título do template</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Boas-vindas"
                                value={templateTitle}
                                onChange={(e) => setTemplateTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Prévia da mensagem</Label>
                            <MessagePreview content={message} image={image} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowSaveTemplateDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveTemplate}>Salvar template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para adicionar contato */}
            <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adicionar novo contato</DialogTitle>
                        <DialogDescription>
                            Preencha os dados para adicionar um novo contato.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                placeholder="Nome do contato"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user_id">ID do usuário</Label>
                            <Input
                                id="user_id"
                                placeholder="ID do contato (pode ser Telegram, WhatsApp, etc)"
                                value={newContactId}
                                onChange={(e) => setNewContactId(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowAddContactDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddContact}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de seleção de contatos para disparo em massa */}
            <Dialog
                open={showMultipleContactsDialog}
                onOpenChange={setShowMultipleContactsDialog}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Disparo em massa</DialogTitle>
                        <DialogDescription>
                            Selecione múltiplos contatos para enviar a mesma mensagem.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-medium">
                                Selecionados: {selectedContacts.length} contatos
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedContacts(contacts.map(c => c.user_id))}
                                >
                                    Selecionar todos
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedContacts([])}
                                >
                                    Limpar
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="h-[40vh] border rounded-md">
                            <div className="p-4 space-y-1">
                                {loadingContacts ? (
                                    <div className="flex justify-center items-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    contacts.map((contact) => (
                                        <div
                                            key={contact.user_id}
                                            className={`flex items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer ${selectedContacts.includes(contact.user_id) ? "bg-muted" : ""
                                                }`}
                                            onClick={() => {
                                                setSelectedContacts(prev =>
                                                    prev.includes(contact.user_id)
                                                        ? prev.filter(id => id !== contact.user_id)
                                                        : [...prev, contact.user_id]
                                                );
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                                                {contact.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{contact.name}</p>
                                                <p className="text-xs text-muted-foreground">ID: {contact.user_id}</p>
                                            </div>
                                            <div className="w-4 h-4 rounded-sm border flex items-center justify-center">
                                                {selectedContacts.includes(contact.user_id) && (
                                                    <div className="w-2 h-2 bg-primary rounded-sm" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowMultipleContactsDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedContacts.length === 0) {
                                    toast({
                                        title: "Erro",
                                        description: "Selecione pelo menos um contato",
                                        variant: "destructive",
                                    });
                                    return;
                                }
                                setSelectedContact(null);
                                setShowMultipleContactsDialog(false);
                            }}
                            disabled={selectedContacts.length === 0}
                        >
                            Continuar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Popup de seleção de imagem */}
            {showImagePicker && (
                <GaleriaPopup
                    defaultValue={image}
                    sendData={(url) => {
                        setImage(url);
                        setShowImagePicker(false);
                    }}
                    onClose={() => setShowImagePicker(false)}
                />
            )}
        </div>
    );
} 