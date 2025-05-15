"use client";

import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Contact {
    id: string;
    name: string;
    user_id: string;
    avatar?: string;
    last_message?: string;
    last_message_time?: string;
}

interface ContactListProps {
    contacts: Contact[];
    loading: boolean;
    selectedContact: Contact | null;
    onSelectContact: (contact: Contact) => void;
}

const ContactList = ({
    contacts,
    loading,
    selectedContact,
    onSelectContact,
}: ContactListProps) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Carregando contatos...</p>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <p className="text-muted-foreground mb-2">Nenhum contato encontrado</p>
                <p className="text-xs text-muted-foreground">
                    Adicione novos contatos ou ajuste sua busca
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div>
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        className={cn(
                            "flex items-center p-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors",
                            selectedContact?.id === contact.id && "bg-muted"
                        )}
                        onClick={() => onSelectContact(contact)}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3 flex-shrink-0">
                            {contact.avatar ? (
                                <img
                                    src={contact.avatar}
                                    alt={contact.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                contact.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium truncate">{contact.name}</h3>
                                {contact.last_message_time && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {format(new Date(contact.last_message_time), "HH:mm")}
                                    </span>
                                )}
                            </div>
                            {contact.last_message && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {contact.last_message}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};

export default ContactList; 