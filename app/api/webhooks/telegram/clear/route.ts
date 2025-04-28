import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Telegraf } from "telegraf";

// Inicializando o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Inicializando o Bot do Telegram
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Função para limpar mensagens do usuário
async function clearUserMessages(userId: string) {
  try {
    // Primeiro, buscar as mensagens do usuário
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select("chat_id, id")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Erro ao buscar mensagens:", fetchError);
      return false;
    }

    // Excluir mensagens no Telegram
    for (const message of messages) {
      try {
        // Enviar comando para limpar o chat
        await bot.telegram.sendMessage(message.chat_id, "/clear");
      } catch (telegramError) {
        console.error("Erro ao limpar mensagens no Telegram:", telegramError);
        // Continua mesmo se houver erro em uma mensagem específica
      }
    }

    // Excluir mensagens no Supabase
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Erro ao limpar mensagens no Supabase:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao limpar mensagens:", error);
    return false;
  }
}

// Método DELETE para limpar mensagens
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "ID do usuário não fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await clearUserMessages(userId);

    if (success) {
      return new NextResponse(
        JSON.stringify({ message: "Mensagens limpas com sucesso" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Erro ao limpar mensagens" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro no DELETE:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
