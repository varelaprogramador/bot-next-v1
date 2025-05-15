"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    image?: string;
    sender: string;
    timestamp: string;
    status?: "enviando" | "enviado" | "falha";
}

interface ChatBubbleProps {
    message: Message;
    isOutgoing: boolean;
}

const ChatBubble = ({ message, isOutgoing }: ChatBubbleProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const getStatusIcon = () => {
        switch (message.status) {
            case "enviando":
                return <div className="h-3 w-3 rounded-full bg-primary/30 animate-pulse"></div>;
            case "enviado":
                return <CheckCheck className="h-3 w-3 text-primary/70" />;
            case "falha":
                return <X className="h-3 w-3 text-destructive" />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col max-w-[85%] space-y-1",
                isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
            )}
        >
            <div
                className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isOutgoing
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                )}
            >
                {message.content}

                {message.image && (
                    <div className="mt-2">
                        <img
                            src={message.image}
                            alt="Imagem da mensagem"
                            className={cn(
                                "rounded-md max-h-64 max-w-full object-contain transition-opacity duration-200",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                        />
                        {!imageLoaded && (
                            <div className="h-32 w-32 bg-muted-foreground/20 animate-pulse rounded-md"></div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {format(new Date(message.timestamp), "HH:mm")}
                {isOutgoing && getStatusIcon()}
            </div>
        </div>
    );
};

export default ChatBubble; 