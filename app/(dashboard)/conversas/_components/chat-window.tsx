"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Send } from "lucide-react";

interface Message {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    status: 'sent' | 'received' | 'failed';
    username: string;
}

interface ChatWindowProps {
    userId: string;
    username: string;
}

export default function ChatWindow({ userId, username }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`/api/webhooks/telegram?userId=${userId}`);
                const data = await response.json();
                setMessages(data.messages);
            } catch (error) {
                console.error("Erro ao buscar mensagens:", error);
            }
        };

        if (userId) {
            fetchMessages();
        }
    }, [userId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch("/api/webhooks/telegram", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    disparo: true,
                    userId,
                    message: newMessage,
                }),
            });

            if (response.ok) {
                setNewMessage("");
                // Atualizar mensagens após envio
                const updatedMessages = await response.json();
                setMessages(updatedMessages.messages);
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="bg-white p-4 border-b">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
                        <AvatarFallback>{username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-medium">{username}</h2>
                        <p className="text-sm text-gray-500">Online</p>
                    </div>
                </div>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.status === 'received' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.status === 'received'
                                        ? 'bg-white'
                                        : 'bg-green-500 text-white'
                                    }`}
                            >
                                <p className="text-sm">{message.message}</p>
                                <span className="text-xs opacity-70">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="bg-white p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
} 