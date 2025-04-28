"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Send, Image as ImageIcon, Smile, Loader2, Check, X, Mic, Paperclip, MoreVertical, Video, Phone, ChevronLeft, Clock, CheckCheck, Trash2 } from "lucide-react";
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
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [buttons, setButtons] = useState<MessageButton[]>([])
    const [isAddingButtons, setIsAddingButtons] = useState(false)
    const [newButtonName, setNewButtonName] = useState("")
    const [newButtonCommand, setNewButtonCommand] = useState("")
    const [buttonType, setButtonType] = useState<"link" | "command">("command")
    const [isTyping, setIsTyping] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout>()
    const [isSmallScreen, setIsSmallScreen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768)
        }

        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)

        return () => {
            window.removeEventListener("resize", checkScreenSize)
        }
    }, [])

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
    useEffect(() => {
        if (userId) {
            fetchMessages()
        }
    }, [userId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])



    const simulateReply = (text: string) => {
        // Show typing indicator
        setIsTyping(true)

        // Simulate typing delay
        setTimeout(() => {
            setIsTyping(false)

            const replyMessage: Message = {
                id: Date.now().toString(),
                user_id: userId,
                message: text,
                created_at: new Date().toISOString(),
                status: "received",
                username: username,
            }

            setMessages((prev) => [...prev, replyMessage])
        }, 2000)
    }





    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups: { date: string; messages: Message[] }[] = []
        let currentDate = ""

        // Ordena as mensagens da mais antiga para a mais nova
        const sortedMessages = [...messages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        sortedMessages.forEach((message) => {
            const messageDate = new Date(message.created_at).toLocaleDateString()

            if (messageDate !== currentDate) {
                currentDate = messageDate
                groups.push({
                    date: messageDate,
                    messages: [message],
                })
            } else {
                groups[groups.length - 1].messages.push(message)
            }
        })

        return groups
    }

    const messageGroups = groupMessagesByDate()

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return "Hoje"
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Ontem"
        } else {
            return date.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
        }
    }

    const handleClearChat = async () => {
        if (!confirm("Tem certeza que deseja limpar esta conversa?")) return;

        try {
            setError(null);
            const response = await fetch(`/api/webhooks/telegram/clear?userId=${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setMessages([]);
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Erro ao limpar conversa");
                console.error("Erro ao limpar conversa:", errorData);
            }
        } catch (error) {
            setError("Erro ao conectar com o servidor");
            console.error("Erro ao limpar conversa:", error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0e1621] border-r border-b rounded-br-lg">
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 text-sm">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="float-right text-red-500 hover:text-red-400"
                    >
                        ×
                    </button>
                </div>
            )}
            <div className="bg-[#17212b] p-3 border-b border-[#0e1621] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isSmallScreen && (
                        <button className="text-[#8ab4f8] hover:bg-[#1c2a3a] p-1.5 rounded-full">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${username}`} />
                        <AvatarFallback className="bg-[#2b5278] text-white">
                            {username
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-medium text-white">{username}</h2>
                        <p className="text-xs text-[#6d7883]">{isTyping ? "digitando..." : "online"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="text-[#8ab4f8] hover:bg-[#1c2a3a] p-1.5 rounded-full">
                        <Phone size={20} />
                    </button>
                    <button className="text-[#8ab4f8] hover:bg-[#1c2a3a] p-1.5 rounded-full">
                        <Video size={20} />
                    </button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="text-[#8ab4f8] hover:bg-[#1c2a3a] p-1.5 rounded-full">
                                <MoreVertical size={20} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0 bg-[#1c2a3a] border-[#0e1621]" align="end">
                            <div className="p-1">
                                <button
                                    onClick={handleClearChat}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-[#2b5278] rounded-md transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Limpar conversa</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <ScrollArea
                ref={scrollRef}
                className="flex-1 p-4 bg-[#0e1621]"
            >
                <div className="space-y-4 max-w-3xl mx-auto">
                    {messageGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-2">
                            <div className="flex justify-center">
                                <div className="bg-[#182533] text-[#6d7883] text-xs px-3 py-1 rounded-full">
                                    {formatDateHeader(group.date)}
                                </div>
                            </div>

                            {group.messages.map((message, index) => {
                                const isCurrentUser = message.status === "sent"
                                const showAvatar =
                                    !isCurrentUser && (index === 0 || group.messages[index - 1].status !== message.status)

                                return (
                                    <div key={message.id} className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
                                        {!isCurrentUser && showAvatar && (
                                            <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${username}`} />
                                                <AvatarFallback className="bg-[#2b5278] text-white">
                                                    {username
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        {!isCurrentUser && !showAvatar && <div className="w-10"></div>}

                                        <div
                                            className={cn(
                                                "max-w-[75%] rounded-lg p-2 relative group",
                                                isCurrentUser
                                                    ? "bg-[#2b5278] text-white rounded-tr-none"
                                                    : "bg-[#182533] text-white rounded-tl-none",
                                            )}
                                        >
                                            {message.image && (
                                                <div className="mb-2 relative group">
                                                    <Image
                                                        src={message.image || "/placeholder.svg"}
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
                                                            onClick={() => window.open(message.image, "_blank")}
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
                                                                isCurrentUser
                                                                    ? "bg-[#3a6999] hover:bg-[#4a7aaa] border-[#4a7aaa]"
                                                                    : "bg-[#232e3c] hover:bg-[#2c3a4c] border-[#2c3a4c]",
                                                                "text-white",
                                                            )}
                                                            onClick={() => {
                                                                if (button.type === "link") {
                                                                    window.open(button.command, "_blank")
                                                                }
                                                            }}
                                                        >
                                                            {button.name}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 mt-1 text-right">
                                                <span className="text-xs opacity-70">{formatMessageTime(message.created_at)}</span>
                                                {isCurrentUser && <span className="ml-1">{getMessageStatus(message.status)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-[#182533] text-white rounded-lg rounded-tl-none p-3 max-w-[75%]">
                                <div className="flex gap-1">
                                    <div
                                        className="w-2 h-2 bg-[#6d7883] rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-[#6d7883] rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-[#6d7883] rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="bg-[#17212b] p-3 border-t border-[#0e1621]">
                {isAddingButtons ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do botão"
                                value={newButtonName}
                                onChange={(e) => setNewButtonName(e.target.value)}
                                className="bg-[#242f3d] border-none text-white placeholder:text-[#6d7883]"
                            />
                            <Input
                                placeholder="Comando ou URL"
                                value={newButtonCommand}
                                onChange={(e) => setNewButtonCommand(e.target.value)}
                                className="bg-[#242f3d] border-none text-white placeholder:text-[#6d7883]"
                            />
                            <select
                                value={buttonType}
                                onChange={(e) => setButtonType(e.target.value as "link" | "command")}
                                className="px-3 py-2 bg-[#242f3d] text-white border-none rounded-md"
                            >
                                <option value="command">Comando</option>
                                <option value="link">Link</option>
                            </select>
                            <Button onClick={addButton} className="bg-[#2b5278] hover:bg-[#3a6999] text-white">
                                Adicionar
                            </Button>
                        </div>
                        {buttons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {buttons.map((button, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" className="bg-[#242f3d] text-white border-[#3a6999]">
                                            {button.name}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeButton(index)}
                                            className="text-[#6d7883] hover:text-white hover:bg-[#3a6999]"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddingButtons(false)}
                                className="border-[#3a6999] text-[#8ab4f8] hover:bg-[#3a6999] hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button onClick={() => setIsAddingButtons(false)} className="bg-[#2b5278] hover:bg-[#3a6999] text-white">
                                Concluir
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {selectedImage && (
                            <div className="relative w-32 h-32 group">
                                <Image
                                    src={selectedImage || "/placeholder.svg"}
                                    alt="Imagem selecionada"
                                    fill
                                    className="object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="sm" onClick={() => setSelectedImage(null)}>
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#8ab4f8] hover:bg-[#1c2a3a] rounded-full h-10 w-10"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#1c2a3a] border-[#0e1621]" align="start" side="top">
                                    <div className="p-1 flex flex-col gap-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label htmlFor="image-upload">
                                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-[#2b5278]">
                                                <ImageIcon className="h-4 w-4 mr-2" />
                                                Foto ou Vídeo
                                            </Button>
                                        </label>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-white hover:bg-[#2b5278]"
                                            onClick={() => setIsAddingButtons(true)}
                                        >
                                            <span className="mr-2">📋</span>
                                            Botões
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    placeholder="Mensagem"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value)
                                        handleTyping()
                                    }}
                                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                    className="bg-[#242f3d] border-none text-white placeholder:text-[#6d7883] rounded-full pr-10"
                                />

                                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#6d7883] hover:text-[#8ab4f8] hover:bg-transparent p-1 h-auto"
                                        >
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#1c2a3a] border-[#0e1621]" align="end" side="top">
                                        <div className="emoji-picker-container">
                                            {/* Emoji picker would go here - using a placeholder */}
                                            <div className="p-4 grid grid-cols-6 gap-2">
                                                {["😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "❤️", "🔥", "👏", "🎉", "🙏"].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        className="text-2xl hover:bg-[#2b5278] p-1 rounded"
                                                        onClick={() => {
                                                            setNewMessage((prev) => prev + emoji)
                                                            setShowEmojiPicker(false)
                                                        }}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {newMessage.trim() || selectedImage ? (
                                <Button
                                    onClick={handleSendMessage}
                                    className="bg-[#2b5278] hover:bg-[#3a6999] text-white rounded-full h-10 w-10 p-0"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            ) : (
                                <Button className="bg-[#2b5278] hover:bg-[#3a6999] text-white rounded-full h-10 w-10 p-0">
                                    <Mic className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
