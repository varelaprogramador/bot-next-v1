"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCheck, Check, X, ImageIcon, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Badge } from "@/app/components/ui/badge";

interface Message {
    id: string;
    content: string;
    image?: string;
    sender: string;
    recipient?: string;
    recipient_name?: string;
    timestamp: string;
    status?: "enviando" | "enviado" | "falha";
}

interface ChatBubbleProps {
    message: Message;
    isOutgoing: boolean;
}

const ChatBubble = ({ message, isOutgoing }: ChatBubbleProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const getStatusIcon = () => {
        switch (message.status) {
            case "enviando":
                return <Clock className="h-3 w-3 text-muted-foreground/70" />;
            case "enviado":
                return isOutgoing ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : null;
            case "falha":
                return <X className="h-3 w-3 text-destructive" />;
            default:
                return isOutgoing ? <Check className="h-3 w-3 text-muted-foreground/70" /> : null;
        }
    };

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

    const formatMessageTime = (timestamp: string) => {
        try {
            return format(new Date(timestamp), "HH:mm");
        } catch (error) {
            return "--:--";
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
        <div
            className={cn(
                "group flex flex-col max-w-[85%] space-y-1 mb-2",
                isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
            )}
        >
            {/* Message bubble */}
            <div
                className={cn(
                    "relative rounded-2xl px-3  min-w-[80px] py-2 text-sm shadow-sm",
                    isOutgoing
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-none"
                )}
                onClick={() => setShowDetails(!showDetails)}
            >
                {/* Sender name for incoming messages */}
                {!isOutgoing && (
                    <div className="font-medium text-blue-500 dark:text-blue-400 mb-1">
                        {message.sender || "Sistema"}
                    </div>
                )}

                {/* Message content */}
                {message.content && (
                    <div className="mb-1 whitespace-pre-wrap break-words">{message.content}</div>
                )}

                {/* Image */}
                {message.image && !imageError && (
                    <div className={cn("relative rounded-md overflow-hidden",
                        message.content ? "mt-2" : "")}>
                        {!imageLoaded && (
                            <div className="h-48 w-full max-w-xs bg-muted-foreground/10 animate-pulse rounded-md flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        )}
                        <img
                            src={message.image || "/placeholder.svg"}
                            alt="Imagem anexada"
                            className={cn(
                                "rounded-md max-h-80 max-w-full object-contain transition-opacity duration-200",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                        />
                    </div>
                )}

                {message.image && imageError && (
                    <div className="mt-1 flex items-center gap-1 text-xs italic px-2 py-1 bg-muted/30 rounded">
                        <ImageIcon className="h-3 w-3" />
                        <span>Imagem indisponível</span>
                    </div>
                )}

                {/* Time and status */}
                <div className={cn(
                    "absolute bottom-1 right-2 flex items-center gap-1 text-xs",
                    isOutgoing ? "text-white/70" : "text-muted-foreground"
                )}>
                    <span>{formatMessageTime(message.timestamp)}</span>
                    {getStatusIcon()}
                </div>
            </div>

            {/* Message details (expandable) */}
            {showDetails && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "text-xs px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50 shadow-sm",
                                "transition-all duration-200 cursor-default"
                            )}>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div><span className="text-muted-foreground">De:</span> <span className="font-medium">{message.sender || "sistema"}</span></div>
                                    <div><span className="text-muted-foreground">Para:</span> <span className="font-medium">{message.recipient_name || message.recipient || 'usuário'}</span></div>
                                    <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{formatFullDate(message.timestamp)}</span></div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant={
                                            message.status === "enviado" ? "default" :
                                                message.status === "falha" ? "destructive" : "outline"
                                        } className="text-[10px] px-1 py-0">
                                            {getStatusText()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Clique na mensagem para ocultar detalhes</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default ChatBubble;
