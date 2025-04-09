"use client"

import { useEffect, useState } from "react"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { ChatItem } from "./components/chat-item"
import { Message } from "./components/message"
import { Button } from "@/app/components/ui/button"
import { Send } from "lucide-react"

interface Chat {
    id: string
    name: string
    lastMessage: string
    time: string
    unread: number
}

interface Message {
    id: string
    content: string
    time: string
    isOwn: boolean
}

export default function CRM() {
    const [chats, setChats] = useState<Chat[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [selectedChat, setSelectedChat] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchChats()
    }, [])

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat)
        }
    }, [selectedChat])

    const fetchChats = async () => {
        try {
            const response = await fetch("/api/telegram/chats")
            const data = await response.json()
            setChats(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Erro ao buscar conversas:", error)
            setChats([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMessages = async (userId: string) => {
        try {
            const response = await fetch(`/api/telegram/chats/${userId}/messages`)
            const data = await response.json()
            setMessages(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error)
            setMessages([])
        }
    }

    const sendMessage = async () => {
        if (!selectedChat || !newMessage.trim()) return

        try {
            const response = await fetch("/api/webhooks/telegram", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: selectedChat,
                    message: newMessage,
                }),
            })

            if (response.ok) {
                setNewMessage("")
                fetchMessages(selectedChat)
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error)
        }
    }

    const ChatList = () => {
        return (
            <div className="w-1/3 border-r">
                <div className="p-4 border-b">
                    <Input placeholder="Pesquisar conversas..." />
                </div>
                <ScrollArea className="h-[calc(100vh-4rem)]">
                    <div className="space-y-2 p-2">
                        {isLoading ? (
                            <div className="text-center text-muted-foreground">
                                Carregando conversas...
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                                Nenhuma conversa encontrada
                            </div>
                        ) : (
                            chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat.id)}
                                    className="cursor-pointer"
                                >
                                    <ChatItem
                                        name={chat.name}
                                        lastMessage={chat.lastMessage}
                                        time={chat.time}
                                        unread={chat.unread}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        )
    }

    const ChatWindow = () => {
        if (!selectedChat) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">
                        Selecione uma conversa para começar
                    </p>
                </div>
            )
        }

        const selectedChatData = chats.find(chat => chat.id === selectedChat)

        return (
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">{selectedChatData?.name}</h2>
                </div>
                <ScrollArea className="flex-1 p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                            Nenhuma mensagem encontrada
                        </div>
                    ) : (
                        messages.map(message => (
                            <Message
                                key={message.id}
                                content={message.content}
                                time={message.time}
                                isOwn={message.isOwn}
                            />
                        ))
                    )}
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                    <Input
                        placeholder="Digite uma mensagem..."
                        value={newMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex">
            <Card className="flex-1 m-4 flex">
                <ChatList />
                <ChatWindow />
            </Card>
        </div>
    )
} 