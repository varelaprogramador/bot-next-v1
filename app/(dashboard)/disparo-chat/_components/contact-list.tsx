"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Loader2 } from 'lucide-react';

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

// Componente de item de contato individualizado e memoizado
const ContactItem = React.memo(({
    contact,
    isSelected,
    onClick
}: {
    contact: Contact;
    isSelected: boolean;
    onClick: () => void
}) => {
    // Formatação da hora da última mensagem
    const formattedTime = React.useMemo(() => {
        if (!contact.last_message_time) return '';
        try {
            const date = new Date(contact.last_message_time);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    }, [contact.last_message_time]);

    return (
        <div
            className={`flex items-center p-3 hover:bg-muted transition-colors cursor-pointer ${isSelected ? 'bg-primary/5 border-r-2 border-primary' : ''
                }`}
            onClick={onClick}
        >
            <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                    {contact.name.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate">{contact.name}</p>
                    {formattedTime && (
                        <span className="text-xs text-muted-foreground ml-1 shrink-0">
                            {formattedTime}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate">
                        {contact.last_message || contact.user_id}
                    </p>
                </div>
            </div>
        </div>
    );
});

ContactItem.displayName = 'ContactItem';

// Componente principal da lista de contatos
const ContactList = React.memo(({ contacts, loading, selectedContact, onSelectContact }: ContactListProps) => {
    // Renderizamos apenas 30 contatos de cada vez com paginação automática
    const [visibleCount, setVisibleCount] = React.useState(30);
    const observerTarget = React.useRef<HTMLDivElement>(null);

    // Observer para carregar mais contatos ao atingir o final da lista
    React.useEffect(() => {
        // Se não houver contatos, não configuramos o observador
        if (loading || contacts.length <= visibleCount) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    // Ao atingir o final, carregamos mais 30 contatos
                    setVisibleCount(prev => Math.min(prev + 30, contacts.length));
                }
            },
            { threshold: 0.5 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [contacts.length, loading, visibleCount]);

    // Limitamos o número de contatos renderizados para melhorar a performance
    const visibleContacts = React.useMemo(() => {
        return contacts.slice(0, visibleCount);
    }, [contacts, visibleCount]);

    return (
        <ScrollArea className="h-full">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando contatos...</p>
                </div>
            ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <p className="font-medium mb-1">Nenhum contato encontrado</p>
                    <p className="text-sm text-muted-foreground">
                        Adicione novos contatos para começar a enviar mensagens
                    </p>
                </div>
            ) : (
                <div className="divide-y">
                    {visibleContacts.map((contact) => (
                        <ContactItem
                            key={contact.id}
                            contact={contact}
                            isSelected={selectedContact?.id === contact.id}
                            onClick={() => onSelectContact(contact)}
                        />
                    ))}
                    {/* Elemento observável para carregar mais ao chegar no final */}
                    {contacts.length > visibleCount && (
                        <div ref={observerTarget} className="py-2 text-center text-xs text-muted-foreground">
                            Carregando mais contatos...
                        </div>
                    )}
                </div>
            )}
        </ScrollArea>
    );
});

ContactList.displayName = 'ContactList';

export default ContactList; 