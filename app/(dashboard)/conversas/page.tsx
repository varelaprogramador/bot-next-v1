"use client";

import { useState } from "react";
import ConversationList from "./_components/conversation-list";
import ChatWindow from "./_components/chat-window";
import ContactsList from "./_components/contacts-list";

export default function ConversationsPage() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
    const [showContacts, setShowContacts] = useState(false);

    const handleSelectConversation = (userId: string, username: string) => {
        setSelectedUserId(userId);
        setSelectedUsername(username);
        setShowContacts(false);
    };

    const handleSelectContact = (contactId: string, name: string) => {
        setSelectedUserId(contactId);
        setSelectedUsername(name);
        setShowContacts(false);
    };

    return (
        <div className="flex h-full">
            {showContacts ? (
                <ContactsList onSelectContact={handleSelectContact} />
            ) : (
                <ConversationList onSelectConversation={handleSelectConversation} />
            )}
            {selectedUserId && selectedUsername ? (
                <ChatWindow userId={selectedUserId} username={selectedUsername} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <p className="text-muted-foreground">Selecione uma conversa para começar</p>
                </div>
            )}
        </div>
    );
} 