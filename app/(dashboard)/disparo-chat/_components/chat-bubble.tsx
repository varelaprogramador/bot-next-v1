"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Check, X, AlertCircle, Clock, ImageIcon } from 'lucide-react';
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";

interface ButtonAction {
    id: string;
    text: string;
    url?: string;
    callback_data?: string;
    type: "url" | "command";
}

interface ChatBubbleProps {
    message: {
        id: string;
        content: string;
        sender: string;
        recipient?: string;
        recipient_name?: string;
        timestamp: string;
        status?: "enviando" | "enviado" | "falha" | string;
        image?: string;
        buttons?: ButtonAction[];
    };
    isOutgoing: boolean;
}

const ChatBubble = React.memo(({ message, isOutgoing }: ChatBubbleProps) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);
    const [showDetails, setShowDetails] = React.useState(false);

    // Formatação da hora da mensagem
    const formattedTime = React.useMemo(() => {
        try {
            const date = new Date(message.timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    }, [message.timestamp]);

    // Status da mensagem
    const statusIcon = React.useMemo(() => {
        if (!message.status) return null;

        switch (message.status) {
            case 'enviando':
                return <Clock className="h-3 w-3 text-blue-400" />;
            case 'enviado':
                return <Check className="h-3 w-3 text-green-500" />;
            case 'falha':
                return <X className="h-3 w-3 text-red-500" />;
            default:
                return <AlertCircle className="h-3 w-3 text-amber-500" />;
        }
    }, [message.status]);

    const getStatusText = () => {
        switch (message.status) {
            case "enviando":
                return "Enviando";
            case "enviado":
                return "Entregue";
            case "falha":
                return "Falha no envio";
            default:
                return "Enviado";
        }
    };

    const formatFullDate = (timestamp: string) => {
        try {
            return format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss");
        } catch (error) {
            return "Data inválida";
        }
    };

    return (
        <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex items-start ${isOutgoing ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[85%]`}>
                {/* Avatar - só mostrar se não for mensagem enviada por mim */}
                {!isOutgoing && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt={message.recipient_name || "Contato"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {(message.recipient_name || "?").charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Conteúdo da mensagem */}
                <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                    {/* Nome do destinatário - mostrar apenas se for mensagem enviada para multiplos contatos */}
                    {isOutgoing && message.recipient_name && (
                        <span className="text-xs text-muted-foreground mb-1">
                            Para: {message.recipient_name}
                        </span>
                    )}

                    {/* Corpo da mensagem */}
                    <div
                        className={`rounded-lg px-3 py-2 shadow-sm ${isOutgoing
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                            }`}
                    >
                        {/* Imagem, se houver */}
                        {message.image && (
                            <div className="mb-2 relative rounded-md overflow-hidden">
                                <Image
                                    src={message.image}
                                    alt="Imagem da mensagem"
                                    width={250}
                                    height={150}
                                    className="object-cover rounded"
                                    loading="lazy"
                                />
                            </div>
                        )}

                        {/* Texto da mensagem */}
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>

                        {/* Botões, se houver */}
                        {message.buttons && message.buttons.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 gap-1.5">
                                {message.buttons.map((button) => (
                                    <div
                                        key={button.id}
                                        className={`px-2 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 justify-center ${isOutgoing
                                            ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                                            : 'bg-background text-foreground hover:bg-background/90'
                                            } cursor-pointer transition-colors`}
                                    >
                                        {button.type === 'url' ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link">
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                </svg>
                                                {button.text}
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
                                                </svg>
                                                {button.text}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Horário e status */}
                    <div className={`flex items-center text-xs text-muted-foreground mt-1 ${isOutgoing ? 'justify-end' : 'justify-start'} gap-1.5`}>
                        {formattedTime}
                        {isOutgoing && statusIcon}
                        {message.image && <ImageIcon className="h-3 w-3" />}
                    </div>
                </div>
            </div>
        </div>
    );
});

// Definindo um displayName para o componente
ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;
