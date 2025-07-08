"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    CardDescription,
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
import { Send, Search, ImageIcon, Users, Save, FileText, UserPlus, Loader2, Clock, CheckCircle2, AlertCircle, LinkIcon, X, MessageSquare, BarChart3, Settings, ChevronRight, Info } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import GaleriaPopup from "@/app/components/popup-imagens";
import ChatBubble from "./_components/chat-bubble";
import ContactList from "./_components/contact-list";
import MessagePreview from "./_components/message-preview";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import Image from "next/image";
import dynamic from 'next/dynamic';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";

// Importação dinâmica apenas para o componente Picker que é um componente React
// Carregamento lazy do Picker para melhorar a performance inicial
const Picker = dynamic(() => import('@emoji-mart/react'), {
    ssr: false,
    loading: () => <div className="w-[348px] h-[435px] bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
// Importação normal para os dados
import data from '@emoji-mart/data';

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

interface BatchStatus {
    current: number;
    total: number;
    recipients: string[];
    progress: number;
    status: "pendente" | "enviando" | "concluído" | "erro";
}

interface BatchLog {
    batchNumber: number;
    totalContacts: number;
    successful: number;
    failed: number;
    skipped: number;
    error?: string;
    timestamp: string;
}

interface MessageLog {
    id?: string;
    recipient_id: string;
    recipient_name?: string;
    message_content: string;
    image_url?: string;
    status: string;
    platform: string;
    created_at: string;
    response_data?: any;
}

interface ButtonAction {
    id: string;
    text: string;
    url?: string;
    callback_data?: string;
    type: "url" | "command";
}

export default function DisparoChatPage() {
    const supabase = createClientSupabaseClient();
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Estado para controle de paginação de mensagens
    const [messageDisplayLimit, setMessageDisplayLimit] = useState(50);

    // Estados
    const [contacts, setContacts] = useState<Contact[]>([]);
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
    const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
    const [showBatchProgress, setShowBatchProgress] = useState(false);
    const [batchLogs, setBatchLogs] = useState<BatchLog[]>([]);
    const [showBatchSummary, setShowBatchSummary] = useState(false);
    const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [activeTab, setActiveTab] = useState("resumo");
    const [showButtonDialog, setShowButtonDialog] = useState(false);
    const [buttonText, setButtonText] = useState("");
    const [buttonUrl, setButtonUrl] = useState("");
    const [buttonType, setButtonType] = useState<"url" | "command">("url");
    const [commandData, setCommandData] = useState("");
    const [messageButtons, setMessageButtons] = useState<ButtonAction[]>([]);
    // Novos estados para o editor avançado
    const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [advancedMessage, setAdvancedMessage] = useState("");
    const [showAddContactsBulkDialog, setShowAddContactsBulkDialog] = useState(false);
    const [bulkContactsText, setBulkContactsText] = useState("");

    // Memoizamos a lista de contatos filtrada para evitar recálculos desnecessários
    const filteredContacts = useMemo(() => {
        if (!searchQuery) return contacts;
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.user_id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [contacts, searchQuery]);

    // Memoizamos as mensagens visíveis para melhorar a performance
    const visibleMessages = useMemo(() => {
        if (messages.length <= messageDisplayLimit) return messages;
        return messages.slice(messages.length - messageDisplayLimit);
    }, [messages, messageDisplayLimit]);

    // Carrega mais mensagens quando o usuário rola para cima
    const handleScrollToTop = useCallback(() => {
        if (messages.length > messageDisplayLimit) {
            setMessageDisplayLimit(prev => Math.min(prev + 50, messages.length));
        }
    }, [messages.length, messageDisplayLimit]);

    // Otimizando os useEffects para evitar renderizações excessivas

    // Carrega contatos
    useEffect(() => {
        loadContacts();
        loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rola para a última mensagem quando novas mensagens são adicionadas
    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => {
                messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [messages]);

    // Carrega logs quando a modal é aberta
    useEffect(() => {
        if (showBatchSummary) {
            fetchMessageLogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showBatchSummary]);

    // Sincroniza resumo quando logs são atualizados
    useEffect(() => {
        if (messageLogs.length > 0 && batchLogs.length > 0) {
            syncResumoWithLogs();
        }
    }, [messageLogs]);

    const loadContacts = useCallback(async () => {
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
    }, [supabase, toast]);

    const loadTemplates = useCallback(async () => {
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
    }, [supabase]);

    const handleLoadTemplate = useCallback((template: MessageTemplate) => {
        setMessage(template.content);
        if (template.image_url) {
            setImage(template.image_url);
        }
        setShowTemplatesDialog(false);

        toast({
            title: "Template carregado",
            description: `Template "${template.title}" carregado com sucesso`,
        });
    }, [toast]);

    const handleSaveTemplate = useCallback(async () => {
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
    }, [templateTitle, message, image, supabase, toast, loadTemplates]);

    const handleAddContact = useCallback(async () => {
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
    }, [newContactName, newContactId, supabase, toast, loadContacts]);

    const handleAddContactsBulk = useCallback(async () => {
        const lines = bulkContactsText.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
            toast({ title: "Erro", description: "Insira pelo menos um contato.", variant: "destructive" });
            return;
        }
        // Espera-se: nome;id por linha
        const contactsToAdd = lines.map(line => {
            const [name, id] = line.split(";").map(s => s.trim());
            return { username: name, user_id: id };
        }).filter(c => c.username && c.user_id);
        if (contactsToAdd.length === 0) {
            toast({ title: "Erro", description: "Formato inválido. Use: nome;id por linha.", variant: "destructive" });
            return;
        }
        try {
            const { error } = await supabase.from("users").insert(contactsToAdd);
            if (error) throw error;
            toast({ title: "Sucesso", description: `${contactsToAdd.length} contatos adicionados!` });
            setShowAddContactsBulkDialog(false);
            setBulkContactsText("");
            loadContacts();
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível adicionar os contatos.", variant: "destructive" });
        }
    }, [bulkContactsText, supabase, toast, loadContacts]);

    // Função para salvar logs de mensagens
    const saveMessageLog = useCallback(async (messages: any[], user_id: string) => {
        try {
            // Filtra apenas as mensagens que precisam ser salvas
            const messagesToSave = messages.filter(msg =>
                (msg.status === "enviado" || msg.status === "falha") &&
                msg.recipient // Garante que só salvamos mensagens com destinatário definido
            );

            if (messagesToSave.length === 0) {
                console.log("Nenhuma mensagem para salvar");
                return;
            }

            // Prepara os dados para inserção
            const logsToInsert = messagesToSave.map(msg => ({
                user_id,
                recipient_id: msg.recipient,
                platform: "telegram",
                message_content: msg.content,
                image_url: msg.image || null,
                status: msg.status === "enviado" ? "enviado" : "falha",
                response: JSON.stringify({
                    sent_at: msg.timestamp,
                    message_id: msg.id
                })
            }));

            // Salva o log de mensagens no banco de dados em lotes menores para melhorar performance
            const BATCH_SIZE = 50;
            for (let i = 0; i < logsToInsert.length; i += BATCH_SIZE) {
                const batch = logsToInsert.slice(i, i + BATCH_SIZE);
                await supabase
                    .from("message_logs")
                    .insert(batch);
            }
        } catch (error) {
            console.error("Erro ao salvar logs de mensagens:", error);
        }
    }, [supabase]);

    // Função para carregar logs de mensagens
    const fetchMessageLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            // Consulta os logs de mensagens mais recentes relacionados ao disparo atual
            const { data, error } = await supabase
                .from("message_logs")
                .select("*")
                .order('created_at', { ascending: false })
                .limit(100); // Limitando para melhor performance

            if (error) throw error;

            if (!data || data.length === 0) {
                setMessageLogs([]);
                setLoadingLogs(false);
                return;
            }

            // Busca os nomes dos usuários para os IDs encontrados
            const uniqueRecipientIds = [...new Set(data.map(log => log.recipient_id))];

            // Busca os dados dos usuários
            const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("user_id, username")
                .in('user_id', uniqueRecipientIds);

            // Cria um mapa de IDs para nomes para facilitar o lookup
            const userMap = new Map();
            if (usersData && !usersError) {
                usersData.forEach(user => {
                    userMap.set(user.user_id, user.username);
                });
            }

            // Formata os logs para exibição
            const formattedLogs: MessageLog[] = data.map(log => {
                // Tenta encontrar o nome do usuário no mapa, ou usa o ID como nome
                const userName = userMap.get(log.recipient_id) || 'Desconhecido';

                // Tenta parse do JSON de resposta (se existir)
                let responseData = {};
                try {
                    if (log.response) {
                        responseData = JSON.parse(log.response);
                    }
                } catch (e) {
                    console.log("Erro ao fazer parse da resposta:", e);
                }

                return {
                    id: log.id,
                    recipient_id: log.recipient_id,
                    recipient_name: userName,
                    message_content: log.message_content,
                    image_url: log.image_url,
                    status: log.status,
                    platform: log.platform,
                    created_at: new Date(log.created_at).toLocaleString(),
                    response_data: responseData
                };
            });

            setMessageLogs(formattedLogs);

            // Atualizar resumos após carregar logs
            if (formattedLogs.length > 0 && batchLogs.length > 0) {
                setTimeout(() => syncResumoWithLogs(), 100);
            }
        } catch (error) {
            console.error("Erro ao carregar logs de mensagens:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os logs de mensagens",
                variant: "destructive",
            });
        } finally {
            setLoadingLogs(false);
        }
    }, [supabase, batchLogs, toast]);

    // Função para atualizar os resumos com base nos logs reais
    const syncResumoWithLogs = useCallback(() => {
        // Se não há logs de mensagens ou lotes, não faz nada
        if (messageLogs.length === 0 || batchLogs.length === 0) return;

        // Conta quantas mensagens foram realmente enviadas com sucesso
        const enviadas = messageLogs.filter(log => log.status === "enviado").length;
        const falhas = messageLogs.filter(log => log.status === "falha").length;

        // Se temos apenas 1 lote, atualizamos diretamente
        if (batchLogs.length === 1) {
            const totalContatos = batchLogs[0].totalContacts;
            setBatchLogs([{
                ...batchLogs[0],
                successful: enviadas,
                failed: falhas,
                skipped: Math.max(0, totalContatos - enviadas - falhas)
            }]);
            return;
        }

        // Para múltiplos lotes, calculamos os valores mais eficientemente
        const updatedLogs = [...batchLogs];
        const totalContatos = updatedLogs.reduce((acc, log) => acc + log.totalContacts, 0);

        // Distribuímos proporcionalmente
        let totalSuccessful = 0;
        let totalFailed = 0;

        for (let i = 0; i < updatedLogs.length - 1; i++) {
            const ratio = updatedLogs[i].totalContacts / totalContatos;
            updatedLogs[i].successful = Math.floor(enviadas * ratio);
            updatedLogs[i].failed = Math.floor(falhas * ratio);

            totalSuccessful += updatedLogs[i].successful;
            totalFailed += updatedLogs[i].failed;
        }

        // O último lote recebe o restante para garantir que a soma seja exata
        const lastIndex = updatedLogs.length - 1;
        updatedLogs[lastIndex].successful = enviadas - totalSuccessful;
        updatedLogs[lastIndex].failed = falhas - totalFailed;

        // Atualizamos os valores de skipped para cada lote
        for (let i = 0; i < updatedLogs.length; i++) {
            updatedLogs[i].skipped = Math.max(0,
                updatedLogs[i].totalContacts - updatedLogs[i].successful - updatedLogs[i].failed);
        }

        setBatchLogs(updatedLogs);
    }, [messageLogs, batchLogs]);

    // Modificando a função sendMessageBatch para ser mais eficiente
    const sendMessageBatch = useCallback(async (recipients: string[], messageText: string, imageUrl: string) => {
        // Evitamos mutações de estado dentro de loops que causam renderizações em cascata
        const newMessages: any[] = [];

        // Criamos as mensagens sem atualizar o estado imediatamente
        recipients.forEach(userId => {
            const newMessage = {
                id: Date.now().toString() + Math.random().toString(),
                content: messageText,
                image: imageUrl,
                sender: "me",
                recipient: userId,
                timestamp: new Date().toISOString(),
                status: "enviando",
                buttons: messageButtons.length > 0 ? [...messageButtons] : undefined
            };

            newMessages.push(newMessage);
        });

        // Atualizamos o estado uma única vez com todas as novas mensagens
        setMessages(prev => [...prev, ...newMessages]);

        // Prepara os botões no formato que o Telegram espera
        let replyMarkup = undefined;

        if (messageButtons.length > 0) {
            // Cria um array de linhas com botões
            const inlineKeyboard = [];

            // Agrupa botões em linhas de até 2 botões cada
            for (let i = 0; i < messageButtons.length; i += 2) {
                const row = [];

                // Primeiro botão da linha
                const button1 = messageButtons[i];
                row.push(button1.type === "url"
                    ? { text: button1.text, url: button1.url }
                    : { text: button1.text, callback_data: button1.callback_data || "command" });

                // Segundo botão da linha (se existir)
                if (i + 1 < messageButtons.length) {
                    const button2 = messageButtons[i + 1];
                    row.push(button2.type === "url"
                        ? { text: button2.text, url: button2.url }
                        : { text: button2.text, callback_data: button2.callback_data || "command" });
                }

                inlineKeyboard.push(row);
            }

            replyMarkup = {
                inline_keyboard: inlineKeyboard
            };
        }

        // Monta o payload para envio
        const payload = {
            recipients,
            message: messageText,
            image: imageUrl,
            platform: "telegram",
            reply_markup: replyMarkup
        };

        try {
            // Usa o endpoint de disparo
            const response = await fetch("/api/disparo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Erro ao enviar mensagens");
            }

            // Atualiza o status das mensagens de uma só vez (evita múltiplas renderizações)
            setMessages(prev =>
                prev.map(msg => {
                    if (newMessages.some(newMsg => newMsg.id === msg.id)) {
                        return { ...msg, status: "enviado" };
                    }
                    return msg;
                })
            );

            // Obtém o ID do usuário atual
            const { data: userData } = await supabase.auth.getUser();
            const currentUserId = userData?.user?.id || "sistema";

            // Salva os logs em segundo plano sem bloquear a UI
            setTimeout(() => {
                saveMessageLog(
                    newMessages.map(msg => ({ ...msg, status: "enviado" })),
                    currentUserId
                );
            }, 100);

            return result;
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);

            // Marca as mensagens como falha de uma só vez (evita múltiplas renderizações)
            setMessages(prev =>
                prev.map(msg => {
                    if (newMessages.some(newMsg => newMsg.id === msg.id)) {
                        return { ...msg, status: "falha" };
                    }
                    return msg;
                })
            );

            throw error;
        }
    }, [messageButtons, supabase.auth, saveMessageLog]);

    // Otimizando handleSendMessage para evitar bloqueios da UI
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
        // Limpa logs anteriores
        setBatchLogs([]);

        try {
            // Se tiver um contato selecionado, adiciona ele à lista
            const recipients = selectedContact
                ? [selectedContact.user_id]
                : selectedContacts;

            // Se for apenas um destinatário ou poucos, envia normalmente
            if (recipients.length <= 25) {
                const result = await sendMessageBatch(recipients, message, image);

                // Registra o log deste lote
                const batchLog: BatchLog = {
                    batchNumber: 1,
                    totalContacts: recipients.length,
                    successful: result.successful || 0,
                    failed: result.failed || 0,
                    skipped: result.skipped || 0,
                    timestamp: new Date().toISOString()
                };

                setBatchLogs([batchLog]);

                if (result.failed > 0 || result.skipped > 0) {
                    setShowBatchSummary(true);
                    // Carregamos os logs em um segundo momento para não bloquear a UI
                    setTimeout(() => {
                        fetchMessageLogs();
                    }, 500);
                }
            } else {
                // Dividir em lotes de 25 destinatários cada
                const batches = splitIntoBatches(recipients, 25);
                setShowBatchProgress(true);

                // Configurar estado inicial de lotes
                setBatchStatus({
                    current: 1,
                    total: batches.length,
                    recipients: batches[0],
                    progress: 0,
                    status: "pendente"
                });

                const newBatchLogs: BatchLog[] = [];

                // Processamos lotes de forma mais eficiente para não bloquear a UI
                await processMessageBatches(batches, message, image, newBatchLogs);

                toast({
                    title: "Disparo em massa concluído",
                    description: `Todos os ${recipients.length} destinatários foram processados.`
                });

                // Mostra a modal com o resumo completo
                setShowBatchSummary(true);
                setTimeout(() => {
                    fetchMessageLogs();
                }, 500);
            }

            // Limpa os campos
            setMessage("");
            setImage("");
            setMessageButtons([]);

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
        } finally {
            setLoading(false);
            setTimeout(() => {
                setShowBatchProgress(false);
                setBatchStatus(null);
            }, 3000);
        }
    };

    // Nova função para processar lotes de mensagens sem bloquear a UI
    const processMessageBatches = async (batches: string[][], messageText: string, imageUrl: string, batchLogs: BatchLog[]) => {
        for (let i = 0; i < batches.length; i++) {
            const currentBatch = batches[i];

            // Atualizamos o estado de progresso antes de iniciar o processamento
            setBatchStatus({
                current: i + 1,
                total: batches.length,
                recipients: currentBatch,
                progress: Math.round(((i + 1) / batches.length) * 100),
                status: "enviando"
            });

            // Esperamos um frame de renderização para atualizar a UI
            await new Promise(resolve => requestAnimationFrame(resolve));

            try {
                const result = await sendMessageBatch(currentBatch, messageText, imageUrl);

                // Registra o log deste lote
                const batchLog: BatchLog = {
                    batchNumber: i + 1,
                    totalContacts: currentBatch.length,
                    successful: result.successful || 0,
                    failed: result.failed || 0,
                    skipped: result.skipped || 0,
                    timestamp: new Date().toISOString()
                };

                batchLogs.push(batchLog);
                setBatchLogs(prev => [...prev, batchLog]);

                // Se não for o último lote, espera antes de enviar o próximo
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos entre lotes
                }
            } catch (error) {
                console.error(`Erro no lote ${i + 1}:`, error);

                // Registra o erro no log
                const batchLog: BatchLog = {
                    batchNumber: i + 1,
                    totalContacts: currentBatch.length,
                    successful: 0,
                    failed: currentBatch.length,
                    skipped: 0,
                    error: error instanceof Error ? error.message : "Erro desconhecido",
                    timestamp: new Date().toISOString()
                };

                batchLogs.push(batchLog);
                setBatchLogs(prev => [...prev, batchLog]);

                setBatchStatus(prev => prev ? {
                    ...prev,
                    status: "erro"
                } : null);

                toast({
                    title: "Erro no lote",
                    description: `Falha ao enviar o lote ${i + 1}. Tentando próximo lote...`,
                    variant: "destructive",
                });

                // Espera um pouco antes de tentar o próximo lote
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // Atualizamos o status final quando terminamos todos os lotes
        setBatchStatus(prev => prev ? {
            ...prev,
            progress: 100,
            status: "concluído"
        } : null);
    };

    // Função para dividir os destinatários em lotes menores
    const splitIntoBatches = useCallback((items: string[], batchSize: number): string[][] => {
        const batches: string[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }, []);

    // Função para adicionar um botão à mensagem
    const handleAddButton = useCallback(() => {
        if (!buttonText.trim()) {
            toast({
                title: "Erro",
                description: "Preencha o texto do botão",
                variant: "destructive",
            });
            return;
        }

        if (buttonType === "url") {
            if (!buttonUrl.trim()) {
                toast({
                    title: "Erro",
                    description: "Preencha o URL do botão",
                    variant: "destructive",
                });
                return;
            }

            if (!buttonUrl.startsWith("http://") && !buttonUrl.startsWith("https://")) {
                toast({
                    title: "Aviso",
                    description: "URLs devem começar com http:// ou https://",
                    variant: "default",
                });
                setButtonUrl(`https://${buttonUrl}`);
                return;
            }
        } else if (buttonType === "command") {
            if (!commandData.trim()) {
                toast({
                    title: "Erro",
                    description: "Preencha o comando do botão",
                    variant: "destructive",
                });
                return;
            }
        }

        const newButton: ButtonAction = {
            id: Date.now().toString(),
            text: buttonText,
            type: buttonType,
            ...(buttonType === "url" ? { url: buttonUrl } : { callback_data: commandData }),
        };

        setMessageButtons((prev) => [...prev, newButton]);
        setButtonText("");
        setButtonUrl("");
        setCommandData("");
        setShowButtonDialog(false);

        toast({
            title: "Botão adicionado",
            description: `Botão "${buttonText}" foi adicionado à mensagem`,
        });
    }, [buttonText, buttonType, buttonUrl, commandData, toast]);

    // Função para remover um botão da mensagem
    const handleRemoveButton = useCallback((id: string) => {
        setMessageButtons((prev) => prev.filter((button) => button.id !== id));
    }, []);

    // Modificação na parte da visualização do estado final
    const getStatusText = () => {
        // Verifica se há mensagens nos logs
        if (messageLogs.length > 0) {
            // Se há mensagens nos logs, baseia-se no status real das mensagens
            const falhas = messageLogs.filter(log => log.status === "falha").length;
            if (falhas > 0) {
                return {
                    icon: <AlertCircle className="h-12 w-12 text-amber-500 mb-2" />,
                    title: "Concluído com avisos",
                    description: "Algumas mensagens não puderam ser enviadas"
                };
            } else {
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />,
                    title: "Disparo concluído com sucesso",
                    description: "Todas as mensagens foram enviadas"
                };
            }
        } else {
            // Se não há dados nos logs, baseia-se nas estimativas
            if (batchLogs.some(log => log.failed > 0 || log.error)) {
                return {
                    icon: <AlertCircle className="h-12 w-12 text-amber-500 mb-2" />,
                    title: "Concluído com avisos",
                    description: "Algumas mensagens não puderam ser enviadas"
                };
            } else if (batchLogs.some(log => log.skipped > 0)) {
                return {
                    icon: <AlertCircle className="h-12 w-12 text-amber-500 mb-2" />,
                    title: "Concluído com limitações",
                    description: "Algumas mensagens foram ignoradas devido ao limite de taxa"
                };
            } else {
                return {
                    icon: <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />,
                    title: "Disparo concluído com sucesso",
                    description: "Todas as mensagens foram enviadas"
                };
            }
        }
    };

    // Adicionar função para selecionar comando ao clicar
    const handleSelectCommand = useCallback((command: string) => {
        setCommandData(command);
    }, []);

    // Função para adicionar emoji à mensagem
    const handleEmojiSelect = useCallback((emoji: any) => {
        if (showAdvancedEditor) {
            setAdvancedMessage((prev) => prev + emoji.native);
        } else {
            setMessage((prev) => prev + emoji.native);
        }
        setShowEmojiPicker(false);
    }, [showAdvancedEditor]);

    // Função para abrir editor avançado
    const openAdvancedEditor = useCallback(() => {
        setAdvancedMessage(message);
        setShowAdvancedEditor(true);
    }, [message]);

    // Função para aplicar a mensagem do editor avançado
    const applyAdvancedMessage = useCallback(() => {
        setMessage(advancedMessage);
        setShowAdvancedEditor(false);
    }, [advancedMessage]);

    // Modificando o renderizador de mensagens para usar virtualização
    const renderMessages = useMemo(() => {
        if (visibleMessages.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">Envie uma mensagem</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Comece enviando uma mensagem para {selectedContact ? selectedContact.name : "os contatos selecionados"}.
                    </p>
                </div>
            );
        }

        return (
            <>
                {visibleMessages.length < messages.length && (
                    <div
                        className="text-center py-2 text-sm text-primary cursor-pointer hover:underline"
                        onClick={handleScrollToTop}
                    >
                        Carregar mais mensagens ({messages.length - visibleMessages.length} anteriores)
                    </div>
                )}
                {visibleMessages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        message={{
                            ...msg,
                            recipient_name: contacts.find(c => c.user_id === msg.recipient)?.name
                        }}
                        isOutgoing={msg.sender === "me"}
                    />
                ))}
                <div ref={messageEndRef} />
            </>
        );
    }, [visibleMessages, messages.length, selectedContact, contacts, handleScrollToTop]);

    return (
        <div className="container mx-auto py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Disparador de Mensagens</h1>
                    <p className="text-muted-foreground">Envie mensagens para contatos individuais ou em massa</p>
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Configurações</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setShowBatchSummary(true)}>
                                    <BarChart3 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ver estatísticas</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Indicador de progresso de lotes */}
            {showBatchProgress && batchStatus && (
                <div className="fixed top-4 right-4 bg-background border rounded-lg shadow-lg p-4 z-50 w-80">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Disparo em lotes</h3>
                        <Badge variant={
                            batchStatus.status === "enviando" ? "default" :
                                batchStatus.status === "concluído" ? "outline" : "destructive"
                        }>
                            {batchStatus.status === "enviando" ? "Enviando" :
                                batchStatus.status === "concluído" ? "Concluído" : "Erro"}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <Progress value={batchStatus.progress} className="h-2" />
                        <div className="text-sm text-muted-foreground flex items-center justify-between">
                            <span>Lote {batchStatus.current} de {batchStatus.total}</span>
                            <span>{batchStatus.recipients.length} contatos</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
                {/* Lista de contatos */}
                <Card className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                    <CardHeader className="pb-2 space-y-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Contatos
                            </CardTitle>
                            <div className="flex gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowAddContactDialog(true)}
                                                className="h-8 w-8"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Adicionar contato</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowMultipleContactsDialog(true)}
                                                className="h-8 w-8"
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Disparo em massa</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button onClick={() => setShowAddContactsBulkDialog(true)} variant="outline" className="ml-2">
                                    Adicionar em Massa
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
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
                                            <Avatar className="h-10 w-10 mr-3">
                                                <AvatarImage src={selectedContact.avatar || "/placeholder.svg"} alt={selectedContact.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {selectedContact.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
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
                                                <Badge variant="outline" className="mt-1">{selectedContacts.length} contatos selecionados</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                <ScrollArea className="h-full pr-4">
                                    {renderMessages}
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 border-t flex flex-col">
                                {/* Área de previsualização mais compacta e organizada */}
                                {(messageButtons.length > 0 || image) && (
                                    <div className="w-full flex items-center gap-2 mb-3 flex-wrap">
                                        {image && (
                                            <div className="flex items-center gap-1 bg-muted/20 rounded-md px-2 py-1 border">
                                                <Image width={24} height={24} alt="profile" src={image} className="h-6 w-6 object-cover rounded" />
                                                <span className="text-xs text-muted-foreground">Imagem anexada</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 ml-1 hover:text-destructive p-0"
                                                    onClick={() => setImage("")}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}

                                        {messageButtons.length > 0 && (
                                            <div className="flex items-center gap-1 bg-muted/20 rounded-md px-2 py-1 border">
                                                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-xs text-muted-foreground">
                                                    {messageButtons.length} {messageButtons.length === 1 ? 'botão' : 'botões'}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 ml-1 hover:text-destructive p-0"
                                                    onClick={() => setMessageButtons([])}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}

                                        {messageButtons.map((button) => (
                                            <div key={button.id} className="flex items-center gap-1 bg-primary/10 rounded-md px-2 py-1 border border-primary/20">
                                                {button.type === "url" ? (
                                                    <LinkIcon className="h-3 w-3 text-primary" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                                                    </svg>
                                                )}
                                                <span className="text-xs font-medium">{button.text}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 p-0 hover:text-destructive"
                                                    onClick={() => handleRemoveButton(button.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center w-full gap-2">
                                    <div className="flex-none flex gap-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowImagePicker(true)}
                                                        className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Adicionar imagem</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowButtonDialog(true)}
                                                        className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                    >
                                                        <LinkIcon className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Adicionar botão/link</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowTemplatesDialog(true)}
                                                        className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                    >
                                                        <FileText className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Escolher modelo</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {/* Botão de emoji */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                            >
                                                                <span className="text-xl" role="img" aria-label="emoji">😊</span>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-none" align="start" side="top">
                                                            <div className="bg-background border rounded-lg shadow-lg">
                                                                {data && Picker && (
                                                                    <Picker
                                                                        data={data}
                                                                        onEmojiSelect={handleEmojiSelect}
                                                                        theme="light"
                                                                        set="native"
                                                                    />
                                                                )}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Adicionar emoji</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {/* Botão de editor avançado */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={openAdvancedEditor}
                                                        className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2">
                                                            <polyline points="15 3 21 3 21 9"></polyline>
                                                            <polyline points="9 21 3 21 3 15"></polyline>
                                                            <line x1="21" y1="3" x2="14" y2="10"></line>
                                                            <line x1="3" y1="21" x2="10" y2="14"></line>
                                                        </svg>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Editor avançado</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Textarea
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 min-h-10 max-h-32 resize-none"
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
                                        disabled={loading || (!message.trim() && !image)}
                                        onClick={handleSendMessage}
                                        size="icon"
                                        className="flex-none"
                                        title="Enviar mensagem"
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
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <MessageSquare className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Disparador de Mensagens</h2>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                Selecione um contato para iniciar uma conversa ou use a opção de disparo em massa.
                            </p>
                            <div className="flex gap-4">
                                <Button onClick={() => setShowAddContactDialog(true)} className="bg-primary hover:bg-primary/90">
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
                                <Button onClick={() => setShowAddContactsBulkDialog(true)} variant="outline" className="ml-2">
                                    Adicionar em Massa
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
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                                    <p>Nenhum template encontrado.</p>
                                    <p className="text-sm mt-1">Crie um novo template para facilitar seus envios.</p>
                                </div>
                            ) : (
                                templates.map((template) => (
                                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleLoadTemplate(template)}>
                                        <CardContent className="p-4">
                                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {template.title}
                                            </h3>
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
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(template.created_at).toLocaleDateString()}
                                            </p>
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
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full px-2">
                                    {selectedContacts.length}
                                </Badge>
                                Contatos selecionados
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
                                            className={`flex items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer ${selectedContacts.includes(contact.user_id) ? "bg-primary/5 border border-primary/20" : ""
                                                }`}
                                            onClick={() => {
                                                setSelectedContacts(prev =>
                                                    prev.includes(contact.user_id)
                                                        ? prev.filter(id => id !== contact.user_id)
                                                        : [...prev, contact.user_id]
                                                );
                                            }}
                                        >
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {contact.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{contact.name}</p>
                                                <p className="text-xs text-muted-foreground">ID: {contact.user_id}</p>
                                            </div>
                                            <div className="w-5 h-5 rounded-md border flex items-center justify-center">
                                                {selectedContacts.includes(contact.user_id) && (
                                                    <div className="w-3 h-3 bg-primary rounded-sm" />
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

            {/* Dialog de resumo do disparo em massa */}
            <Dialog open={showBatchSummary} onOpenChange={setShowBatchSummary}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Resumo do Disparo em Massa</DialogTitle>
                        <DialogDescription>
                            Log completo da operação de disparo de mensagens
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 flex-1 flex flex-col">
                        <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="resumo">Resumo por Lotes</TabsTrigger>
                            <TabsTrigger value="mensagens">Mensagens Detalhadas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumo" className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5 text-primary" />
                                                Estatísticas Gerais
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span>Total de lotes:</span>
                                                    <Badge variant="outline">{batchLogs.length}</Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Total de contatos:</span>
                                                    <Badge variant="outline">{batchLogs.reduce((acc, log) => acc + log.totalContacts, 0)}</Badge>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center">
                                                    <span>Mensagens enviadas:</span>
                                                    <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200">
                                                        {batchLogs.reduce((acc, log) => acc + log.successful, 0)}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Falhas:</span>
                                                    <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
                                                        {batchLogs.reduce((acc, log) => acc + log.failed, 0)}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Ignoradas (limite):</span>
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200">
                                                        {batchLogs.reduce((acc, log) => acc + log.skipped, 0)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Info className="h-5 w-5 text-primary" />
                                                Resultado Final
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center h-[140px]">
                                            {(() => {
                                                const status = getStatusText();
                                                return (
                                                    <div className="flex flex-col items-center">
                                                        {status.icon}
                                                        <p className="font-medium">{status.title}</p>
                                                        <p className="text-sm text-muted-foreground">{status.description}</p>
                                                    </div>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="flex-1 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            Detalhamento por Lote
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-hidden">
                                        <ScrollArea className="h-[30vh]">
                                            <table className="w-full">
                                                <thead className="bg-muted/50 sticky top-0">
                                                    <tr>
                                                        <th className="text-left p-3 text-sm font-medium">Lote</th>
                                                        <th className="text-left p-3 text-sm font-medium">Contatos</th>
                                                        <th className="text-left p-3 text-sm font-medium">Enviados</th>
                                                        <th className="text-left p-3 text-sm font-medium">Falhas</th>
                                                        <th className="text-left p-3 text-sm font-medium">Ignorados</th>
                                                        <th className="text-left p-3 text-sm font-medium">Status</th>
                                                        <th className="text-left p-3 text-sm font-medium">Hora</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchLogs.map((log, index) => (
                                                        <tr key={index} className="border-b hover:bg-muted/20">
                                                            <td className="p-3">{log.batchNumber}</td>
                                                            <td className="p-3">{log.totalContacts}</td>
                                                            <td className="p-3 text-green-600">{log.successful}</td>
                                                            <td className="p-3 text-red-600">{log.failed}</td>
                                                            <td className="p-3 text-amber-600">{log.skipped}</td>
                                                            <td className="p-3">
                                                                {log.error ? (
                                                                    <Badge variant="destructive">Erro</Badge>
                                                                ) : log.failed > 0 ? (
                                                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Parcial</Badge>
                                                                ) : log.skipped > 0 ? (
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Limitado</Badge>
                                                                ) : (
                                                                    <Badge className="bg-green-600">Sucesso</Badge>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-muted-foreground">
                                                                {new Date(log.timestamp).toLocaleTimeString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="mensagens" className="flex-1 overflow-hidden">
                            <Card className="flex-1 overflow-hidden flex flex-col h-full">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Log de Mensagens
                                    </CardTitle>
                                    <CardDescription>
                                        Registro detalhado de todas as mensagens enviadas neste disparo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 overflow-hidden flex-1">
                                    {loadingLogs ? (
                                        <div className="flex items-center justify-center h-[40vh]">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : messageLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                                            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                                            <p className="font-medium">Nenhum log encontrado</p>
                                            <p className="text-muted-foreground max-w-xs mt-1">
                                                Não foram encontrados registros de mensagens no banco de dados para este disparo
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <div className="border-b px-3 py-2 bg-muted/40">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium">Total: {messageLogs.length} mensagens</h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={fetchMessageLogs}
                                                        className="h-8 gap-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                                            <path d="M21 3v5h-5" />
                                                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                                            <path d="M3 21v-5h5" />
                                                        </svg>
                                                        Atualizar
                                                    </Button>
                                                </div>
                                            </div>
                                            <ScrollArea className="h-[40vh]">
                                                <table className="w-full">
                                                    <thead className="bg-muted/50 sticky top-0">
                                                        <tr>
                                                            <th className="text-left p-3 text-sm font-medium">Destinatário</th>
                                                            <th className="text-left p-3 text-sm font-medium">Mensagem</th>
                                                            <th className="text-left p-3 text-sm font-medium">Mídia</th>
                                                            <th className="text-left p-3 text-sm font-medium">Status</th>
                                                            <th className="text-left p-3 text-sm font-medium">Plataforma</th>
                                                            <th className="text-left p-3 text-sm font-medium">Data/Hora</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {messageLogs.map((log) => (
                                                            <tr key={log.id} className="border-b hover:bg-muted/20">
                                                                <td className="p-3 max-w-[180px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                                {log.recipient_name?.charAt(0) || log.recipient_id.charAt(0)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-sm truncate">{log.recipient_name}</span>
                                                                            <span className="text-xs text-muted-foreground truncate" title={log.recipient_id}>{log.recipient_id}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 max-w-[250px]">
                                                                    <div
                                                                        className="text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                                                                        title={log.message_content}
                                                                        onClick={() => {
                                                                            // Mostra o conteúdo completo da mensagem em um toast
                                                                            toast({
                                                                                title: "Conteúdo da mensagem",
                                                                                description: log.message_content,
                                                                            });
                                                                        }}
                                                                    >
                                                                        {log.message_content}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    {log.image_url ? (
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <Badge variant="outline" className="flex items-center gap-1 cursor-pointer hover:bg-primary/5" onClick={() => window.open(log.image_url, '_blank')}>
                                                                                <ImageIcon className="h-3 w-3" />
                                                                                Ver imagem
                                                                            </Badge>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-muted-foreground">Texto apenas</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant={
                                                                        log.status === "enviado" ? "default" :
                                                                            log.status === "falha" ? "destructive" : "outline"
                                                                    }>
                                                                        {log.status === "enviado" ? "Enviado" :
                                                                            log.status === "falha" ? "Falha" : log.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline">
                                                                        {log.platform === "telegram" ? "Telegram" :
                                                                            log.platform === "whatsapp" ? "WhatsApp" : log.platform}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3 text-muted-foreground text-sm whitespace-nowrap">
                                                                    {log.created_at}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                console.log("Log completo do disparo:", {
                                    batches: batchLogs,
                                    messages: messageLogs
                                });
                                toast({
                                    title: "Log exportado",
                                    description: "O log completo foi exportado para o console"
                                });
                            }}
                        >
                            Exportar Log
                        </Button>
                        <Button onClick={() => setShowBatchSummary(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para adicionar botão */}
            <Dialog open={showButtonDialog} onOpenChange={setShowButtonDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adicionar botão</DialogTitle>
                        <DialogDescription>
                            Adicione um botão clicável à sua mensagem. Os botões podem abrir links ou executar comandos no bot.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="button-text">Texto do botão</Label>
                            <Input
                                id="button-text"
                                placeholder="Ex: Visite nosso site"
                                value={buttonText}
                                onChange={(e) => setButtonText(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tipo de botão</Label>
                            <div className="flex gap-4">
                                <div
                                    className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${buttonType === "url" ? "border-primary bg-primary/5" : "border-muted"}`}
                                    onClick={() => setButtonType("url")}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${buttonType === "url" ? "border-primary" : "border-muted-foreground"}`}>
                                        {buttonType === "url" && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Link externo</span>
                                        <span className="text-xs text-muted-foreground">Abre uma URL no navegador</span>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${buttonType === "command" ? "border-primary bg-primary/5" : "border-muted"}`}
                                    onClick={() => setButtonType("command")}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${buttonType === "command" ? "border-primary" : "border-muted-foreground"}`}>
                                        {buttonType === "command" && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Comando interno</span>
                                        <span className="text-xs text-muted-foreground">Envia comando para o bot</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {buttonType === "url" ? (
                            <div className="grid gap-2">
                                <Label htmlFor="button-url">URL do link</Label>
                                <Input
                                    id="button-url"
                                    placeholder="Ex: https://exemplo.com.br"
                                    value={buttonUrl}
                                    onChange={(e) => setButtonUrl(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    O URL deve começar com http:// ou https://
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="command-data">Comando para o bot</Label>
                                <Input
                                    id="command-data"
                                    placeholder="Ex: start_tutorial"
                                    value={commandData}
                                    onChange={(e) => setCommandData(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    O comando será enviado para o bot quando o botão for clicado
                                </p>
                                <div className="mt-2">
                                    <Label className="text-xs font-medium">Comandos disponíveis:</Label>
                                    <div className="mt-1 p-2 border rounded-md bg-muted/20 text-xs space-y-1">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="font-medium">Navegação:</span>
                                                <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                                                    <li onClick={() => handleSelectCommand("bemvindos")} className="cursor-pointer hover:text-primary transition-colors">bemvindos - Menu principal</li>
                                                    <li onClick={() => handleSelectCommand("premium")} className="cursor-pointer hover:text-primary transition-colors">premium - Produtos premium</li>
                                                    <li onClick={() => handleSelectCommand("produtos")} className="cursor-pointer hover:text-primary transition-colors">produtos - Lista de produtos</li>
                                                    <li onClick={() => handleSelectCommand("combos")} className="cursor-pointer hover:text-primary transition-colors">combos - Lista de combos</li>
                                                    <li onClick={() => handleSelectCommand("saldo")} className="cursor-pointer hover:text-primary transition-colors">saldo - Adicionar saldo</li>
                                                    <li onClick={() => handleSelectCommand("perfil")} className="cursor-pointer hover:text-primary transition-colors">perfil - Ver perfil</li>
                                                    <li onClick={() => handleSelectCommand("voltar")} className="cursor-pointer hover:text-primary transition-colors">voltar - Voltar ao menu anterior</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-medium">Ações:</span>
                                                <ul className="list-disc pl-4 mt-1 text-muted-foreground">
                                                    <li onClick={() => handleSelectCommand("gerar_pix")} className="cursor-pointer hover:text-primary transition-colors">gerar_pix - Gerar pagamento PIX</li>
                                                    <li onClick={() => handleSelectCommand("start")} className="cursor-pointer hover:text-primary transition-colors">start - Iniciar o bot</li>
                                                    <li onClick={() => handleSelectCommand("bemvindos-2")} className="cursor-pointer hover:text-primary transition-colors">bemvindos-2 - Menu alternativo</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="mt-3 border-t pt-2">
                                            <span className="font-medium">Comandos de Produtos:</span>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <ul className="list-disc pl-4 text-muted-foreground">
                                                    <li onClick={() => handleSelectCommand("confirma_produto_NOME")} className="cursor-pointer hover:text-primary transition-colors">confirma_produto_NOME</li>
                                                    <li onClick={() => handleSelectCommand("comprar_ID")} className="cursor-pointer hover:text-primary transition-colors">comprar_ID - Comprar produto</li>
                                                    <li onClick={() => handleSelectCommand("confirmar_compra_ID")} className="cursor-pointer hover:text-primary transition-colors">confirmar_compra_ID</li>
                                                </ul>
                                                <ul className="list-disc pl-4 text-muted-foreground">
                                                    <li onClick={() => handleSelectCommand("2comprar_ID")} className="cursor-pointer hover:text-primary transition-colors">2comprar_ID - Comprar combo</li>
                                                    <li onClick={() => handleSelectCommand("2confirmar_compra_ID")} className="cursor-pointer hover:text-primary transition-colors">2confirmar_compra_ID</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="text-[11px] bg-muted/30 p-1.5 rounded mt-2">
                                            <span className="font-medium">Dica:</span> Substitua NOME ou ID pelo nome do produto ou ID correspondente. Clique em qualquer comando para adicioná-lo.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Prévia do botão</Label>
                            <div className="mt-2 p-3 border rounded-md bg-muted/20">
                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
                                        {buttonType === "url" ? (
                                            <LinkIcon className="h-3.5 w-3.5" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                                            </svg>
                                        )}
                                        {buttonText || "Texto do botão"}
                                    </div>
                                </div>
                                <div className="mt-2 text-center text-xs text-muted-foreground">
                                    {buttonType === "url"
                                        ? buttonUrl
                                            ? `Abrirá: ${buttonUrl}`
                                            : "O link ainda não foi definido"
                                        : commandData
                                            ? `Enviará o comando: ${commandData}`
                                            : "O comando ainda não foi definido"
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowButtonDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddButton}>Adicionar botão</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para editor avançado de mensagens */}
            <Dialog open={showAdvancedEditor} onOpenChange={setShowAdvancedEditor}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Editor Avançado de Mensagens</DialogTitle>
                        <DialogDescription>
                            Monte sua mensagem com mais espaço e recursos adicionais
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col mt-4 gap-4">
                        <div className="relative">
                            <Textarea
                                placeholder="Digite sua mensagem..."
                                className="min-h-[200px] p-4 resize-none font-medium leading-relaxed"
                                value={advancedMessage}
                                onChange={(e) => setAdvancedMessage(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1"
                                    >
                                        <span role="img" aria-label="emoji">😊</span>
                                        Emojis
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none" align="start">
                                    <div className="bg-background border rounded-lg shadow-lg">
                                        {data && Picker && (
                                            <Picker
                                                data={data}
                                                onEmojiSelect={handleEmojiSelect}
                                                theme="light"
                                                set="native"
                                            />
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowButtonDialog(true)}
                                className="flex items-center gap-1"
                            >
                                <LinkIcon className="h-4 w-4" />
                                Adicionar Botão
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowImagePicker(true)}
                                className="flex items-center gap-1"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Adicionar Imagem
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowTemplatesDialog(true)}
                                className="flex items-center gap-1"
                            >
                                <FileText className="h-4 w-4" />
                                Carregar Template
                            </Button>
                        </div>

                        {/* Prévia da mensagem */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Prévia da Mensagem</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-primary/5 p-3 rounded-lg border">
                                    <ScrollArea className="h-[150px]">
                                        <div className="whitespace-pre-wrap text-sm">
                                            {advancedMessage || <span className="text-muted-foreground italic">Sem conteúdo ainda...</span>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Botões e imagem adicionados */}
                        {(messageButtons.length > 0 || image) && (
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/5">
                                {image && (
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-xs text-muted-foreground mb-1">Imagem anexada:</span>
                                        <div className="relative w-32 h-32">
                                            <Image
                                                width={128}
                                                height={128}
                                                src={image}
                                                alt="Imagem anexada"
                                                className="rounded-md object-cover"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-6 w-6 absolute top-1 right-1 opacity-90"
                                                onClick={() => setImage("")}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {messageButtons.length > 0 && (
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-xs text-muted-foreground mb-1">Botões adicionados:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {messageButtons.map((button) => (
                                                <div key={button.id} className="bg-primary/10 rounded-md px-3 py-1.5 flex items-center gap-2 border border-primary/20">
                                                    {button.type === "url" ? (
                                                        <LinkIcon className="h-3.5 w-3.5 text-primary" />
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                                            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                                                        </svg>
                                                    )}
                                                    <span className="text-sm">{button.text}</span>
                                                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                                                        {button.type === "url" ? "Link" : "Comando"}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 p-0 hover:text-destructive"
                                                        onClick={() => handleRemoveButton(button.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setShowAdvancedEditor(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={applyAdvancedMessage}>
                            Aplicar Mensagem
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showAddContactsBulkDialog} onOpenChange={setShowAddContactsBulkDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Adicionar Contatos em Massa</DialogTitle>
                        <DialogDescription>Insira um contato por linha no formato: Nome;ID</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={bulkContactsText}
                        onChange={e => setBulkContactsText(e.target.value)}
                        rows={8}
                        placeholder="Exemplo:\nJoão;123456\nMaria;654321"
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowAddContactsBulkDialog(false)}>Cancelar</Button>
                        <Button onClick={handleAddContactsBulk}>Adicionar Todos</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
