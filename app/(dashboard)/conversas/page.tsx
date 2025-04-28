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
        <div className="flex h-screen">
            <ConversationList
                onSelectConversation={(userId, username) =>
                    handleSelectConversation(userId, username)
                }
            />
            {selectedUserId && selectedUsername ? (
                <ChatWindow userId={selectedUserId} username={selectedUsername} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Selecione uma conversa para começar</p>
                </div>
            )}
        </div>
    );
} 