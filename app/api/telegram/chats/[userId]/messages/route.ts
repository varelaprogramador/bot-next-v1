import { NextResponse } from "next/server";
import { supabase } from "@/app/api/webhooks/telegram/components/config";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { data: messages, error } = await supabase
      .from("message_logs")
      .select(
        `
        id,
        content,
        created_at,
        is_deleted,
        users:user_id (
          username,
          first_name
        )
      `
      )
      .eq("user_id", params.userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const formattedMessages = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      time: new Date(message.created_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: false, // TODO: Implementar verificação de mensagem própria
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}
