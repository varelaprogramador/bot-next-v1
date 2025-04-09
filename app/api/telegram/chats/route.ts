import { NextResponse } from "next/server";
import { supabase } from "@/app/api/webhooks/telegram/components/config";

export async function GET() {
  try {
    // Buscar as últimas conversas do banco de dados
    const { data: chats, error } = await supabase
      .from("message_logs")
      .select(
        `
        user_id,
        chat_id,
        message_id,
        content,
        created_at,
        users!inner (
          username,
          first_name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar chats:", error);
      return NextResponse.json(
        { error: "Erro ao buscar conversas" },
        { status: 500 }
      );
    }

    if (!chats || chats.length === 0) {
      return NextResponse.json([]);
    }

    // Agrupar mensagens por usuário
    const groupedChats = chats.reduce((acc: any, chat: any) => {
      const userId = chat.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: chat.users?.first_name || chat.users?.username || "Usuário",
          lastMessage: chat.content,
          time: new Date(chat.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: 0, // TODO: Implementar contagem de mensagens não lidas
        };
      }
      return acc;
    }, {});

    return NextResponse.json(Object.values(groupedChats));
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
