"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Contact {
    id: number;
    user_id: string;
    username: string;
    saldo: number;
    saldo_indicacao: number;
    created_at: string;
}

interface ContactsListProps {
    onSelectContact: (userId: string, username: string) => void;
}

export default function ContactsList({ onSelectContact }: ContactsListProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/contacts");
                const data = await response.json();
                setContacts(data.contacts);
            } catch (error) {
                console.error("Erro ao buscar contatos:", error);
            }
        };

        fetchContacts();
    }, []);

    const filteredContacts = contacts.filter(contact =>
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-80 border-r border-border bg-background h-full">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar contatos"
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="h-[calc(100%-4rem)]">
                <div className="p-2">
                    {filteredContacts.map((contact) => (
                        <div
                            key={contact.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                            onClick={() => onSelectContact(contact.user_id, contact.username)}
                        >
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.username}`} />
                                <AvatarFallback>{contact.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">@{contact.username}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                    Saldo: R${contact.saldo.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <Button className="w-full" onClick={() => { }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Contato
                </Button>
            </div>
        </div>
    );
} 