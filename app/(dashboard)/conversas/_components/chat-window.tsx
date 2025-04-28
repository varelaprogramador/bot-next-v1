"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Send, Image as ImageIcon, Smile, Loader2, Check, X } from "lucide-react";
import Image from "next/image";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/lib/utils";

interface MessageButton {
    name: string;
    type: string;
    command: string;
}

interface Message {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    status: 'sent' | 'received' | 'failed' | 'sending';
    username: string;
    buttons?: MessageButton[];
    image?: string;
}

interface ChatWindowProps {
    userId: string;
    username: string;
}

export default function ChatWindow({ userId, username }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [buttons, setButtons] = useState<MessageButton[]>([]);
    const [isAddingButtons, setIsAddingButtons] = useState(false);
    const [newButtonName, setNewButtonName] = useState("");
    const [newButtonCommand, setNewButtonCommand] = useState("");
    const [buttonType, setButtonType] = useState<"link" | "command">("command");
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/webhooks/telegram?userId=${userId}`);
            const data = await response.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
        }
    };

    useEffect(() => {
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
        if (!newMessage.trim() && !selectedImage) return;

        const tempMessage: Message = {
            id: Date.now().toString(),
            user_id: userId,
            message: newMessage,
            created_at: new Date().toISOString(),
            status: 'sending',
            username,
            buttons: buttons.length > 0 ? buttons : undefined,
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage("");
        setSelectedImage(null);
        setButtons([]);
        setIsAddingButtons(false);

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
                    image: selectedImage,
                    button: buttons,
                }),
            });

            if (response.ok) {
                await fetchMessages();
            } else {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempMessage.id
                            ? { ...msg, status: 'failed' }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === tempMessage.id
                        ? { ...msg, status: 'failed' }
                        : msg
                )
            );
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                alert("A imagem deve ter no máximo 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addButton = () => {
        if (!newButtonName || !newButtonCommand) return;

        setButtons([...buttons, { name: newButtonName, type: buttonType, command: newButtonCommand }]);
        setNewButtonName("");
        setNewButtonCommand("");
    };

    const removeButton = (index: number) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const handleTyping = () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);
    };

    const addEmoji = (emoji: any) => {
        setNewMessage(prev => prev + emoji.native);
        setShowEmojiPicker(false);
    };

    const getMessageStatus = (status: Message['status']) => {
        switch (status) {
            case 'sending':
                return <Loader2 className="h-3 w-3 animate-spin" />;
            case 'sent':
                return <Check className="h-3 w-3 text-green-500" />;
            case 'failed':
                return <X className="h-3 w-3 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-muted/50">
            <div className="bg-background p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
                        <AvatarFallback>{username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-medium">{username}</h2>
                        <p className="text-sm text-muted-foreground">
                            {isTyping ? "Digitando..." : "Online"}
                        </p>
                    </div>
                </div>
            </div>

            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex",
                                message.status === 'received' ? 'justify-start' : 'justify-end'
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-lg p-3 relative group",
                                    message.status === 'received'
                                        ? 'bg-background'
                                        : 'bg-primary text-primary-foreground'
                                )}
                            >
                                {message.image && (
                                    <div className="mb-2 relative group">
                                        <Image
                                            src={message.image}
                                            alt="Imagem da mensagem"
                                            width={300}
                                            height={200}
                                            className="rounded-lg cursor-pointer transition-transform hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-white"
                                                onClick={() => window.open(message.image, '_blank')}
                                            >
                                                Ver em tamanho real
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                {message.buttons && message.buttons.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {message.buttons.map((button, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "text-xs",
                                                    message.status === 'received' ? 'bg-background' : 'bg-primary/10'
                                                )}
                                                onClick={() => {
                                                    if (button.type === "link") {
                                                        window.open(button.command, "_blank");
                                                    }
                                                }}
                                            >
                                                {button.name}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs opacity-70">
                                        {new Date(message.created_at).toLocaleTimeString()}
                                    </span>
                                    {message.status !== 'received' && (
                                        <span className="ml-1">
                                            {getMessageStatus(message.status)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="bg-background p-4 border-t border-border">
                {isAddingButtons ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do botão"
                                value={newButtonName}
                                onChange={(e) => setNewButtonName(e.target.value)}
                            />
                            <Input
                                placeholder="Comando ou URL"
                                value={newButtonCommand}
                                onChange={(e) => setNewButtonCommand(e.target.value)}
                            />
                            <select
                                value={buttonType}
                                onChange={(e) => setButtonType(e.target.value as "link" | "command")}
                                className="px-3 py-2 border rounded-md"
                            >
                                <option value="command">Comando</option>
                                <option value="link">Link</option>
                            </select>
                            <Button onClick={addButton}>Adicionar</Button>
                        </div>
                        {buttons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {buttons.map((button, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                        <Button variant="outline" size="sm">
                                            {button.name}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeButton(index)}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddingButtons(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={() => setIsAddingButtons(false)}>
                                Concluir
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload">
                                <Button variant="outline" type="button">
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                            </label>
                            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" type="button">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Picker
                                        data={data}
                                        onEmojiSelect={addEmoji}
                                        theme="light"
                                        set="twitter"
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button onClick={() => setIsAddingButtons(true)}>
                                Botões
                            </Button>
                            <Button onClick={handleSendMessage}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        {selectedImage && (
                            <div className="relative w-32 h-32 group">
                                <Image
                                    src={selectedImage}
                                    alt="Imagem selecionada"
                                    fill
                                    className="object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setSelectedImage(null)}
                                    >
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 