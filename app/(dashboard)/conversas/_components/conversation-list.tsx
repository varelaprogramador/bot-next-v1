"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Search } from "lucide-react";

interface Conversation {
    user_id: string;
    username: string;
    last_message: string;
    last_message_date: string;
    unread_count: number;
}

interface ConversationListProps {
    onSelectConversation: (userId: string, username: string) => void;
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch("/api/conversations");
                const data = await response.json();
                setConversations(data.conversations);
            } catch (error) {
                console.error("Erro ao buscar conversas:", error);
            }
        };

        fetchConversations();
    }, []);

    const filteredConversations = conversations.filter(conv =>
        conv.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-80 border-r border-border bg-background h-full">
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar conversa..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="h-[calc(100%-4rem)]">
                {filteredConversations.map((conversation) => (
                    <div
                        key={conversation.user_id}
                        className="flex items-center gap-3 p-4 hover:bg-muted cursor-pointer"
                        onClick={() => onSelectConversation(conversation.user_id, conversation.username)}
                    >
                        <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.username}`} />
                            <AvatarFallback>{conversation.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conversation.username}</p>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(conversation.last_message_date).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {conversation.unread_count}
                            </div>
                        )}
                    </div>
                ))}
            </ScrollArea>
        </div>
    );
} 