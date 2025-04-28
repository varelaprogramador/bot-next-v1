"use client";

import { useState } from "react";
import ConversationList from "./_components/conversation-list";
import ChatWindow from "./_components/chat-window";

export default function ConversationsPage() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

    const handleSelectConversation = (userId: string, username: string) => {
        setSelectedUserId(userId);
        setSelectedUsername(username);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full">
            <ConversationList
                onSelectConversation={(userId, username) =>
                    handleSelectConversation(userId, username)
                }
            />
            {selectedUserId && selectedUsername ? (
                <ChatWindow userId={selectedUserId} username={selectedUsername} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-muted/50">
                    <p className="text-muted-foreground">Selecione uma conversa para começar</p>
                </div>
            )}
        </div>
    );
} 