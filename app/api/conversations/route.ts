import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET() {
  try {
    // Buscar todas as mensagens agrupadas por usuário
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Agrupar mensagens por usuário e pegar a última mensagem de cada
    const conversations = messages.reduce((acc: any[], message) => {
      const existingConversation = acc.find(
        (conv) => conv.user_id === message.user_id
      );

      if (!existingConversation) {
        acc.push({
          user_id: message.user_id,
          username: message.username,
          last_message: message.message,
          last_message_date: message.created_at,
          unread_count: message.status === "received" ? 1 : 0,
        });
      } else if (message.status === "received") {
        existingConversation.unread_count++;
      }

      return acc;
    }, []);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar conversas" },
      { status: 500 }
    );
  }
}
