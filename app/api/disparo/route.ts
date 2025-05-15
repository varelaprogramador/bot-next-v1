import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

interface DisparoRequest {
  recipients: string[];
  message: string;
  image?: string;
  platform?: string;
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url?: string;
        callback_data?: string;
      }>
    >;
  };
}

const RATE_LIMIT_PER_MINUTE = 50; // Limite de mensagens por minuto

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verifica se o usuário está autenticado
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    const body: DisparoRequest = await request.json();

    // Log para debug
    console.log("Recebido na API de disparo:", {
      recipients: body.recipients.length,
      hasMessage: !!body.message,
      hasImage: !!body.image,
      hasButtons: !!body.reply_markup,
      platform: body.platform,
    });

    // Valida o corpo da requisição
    if (
      !body.recipients ||
      !Array.isArray(body.recipients) ||
      body.recipients.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Lista de destinatários inválida" },
        { status: 400 }
      );
    }

    if (!body.message && !body.image) {
      return NextResponse.json(
        {
          success: false,
          message: "É necessário fornecer uma mensagem ou imagem",
        },
        { status: 400 }
      );
    }

    // Limita o número de destinatários por requisição
    if (body.recipients.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Máximo de 100 destinatários por requisição",
        },
        { status: 400 }
      );
    }

    // Verifica limite de uso
    const { data: usageData, error: usageError } = await supabase
      .from("messages_sent")
      .select("count")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Últimos 60 segundos
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      // PGRST116 é o código para "no rows returned"
      console.error("Erro ao verificar limite de uso:", usageError);
      return NextResponse.json(
        { success: false, message: "Erro ao verificar limite de uso" },
        { status: 500 }
      );
    }

    const currentUsage = usageData?.count || 0;
    if (currentUsage >= RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json(
        {
          success: false,
          message: `Limite de ${RATE_LIMIT_PER_MINUTE} mensagens por minuto excedido. Tente novamente em breve.`,
        },
        { status: 429 }
      );
    }

    // Calcula quantas mensagens ainda podem ser enviadas
    const remainingMessages = RATE_LIMIT_PER_MINUTE - currentUsage;
    const recipientsToProcess = body.recipients.slice(0, remainingMessages);

    // Função para enviar mensagem para uma plataforma específica
    const sendToPlatform = async (
      platform: string,
      userId: string,
      message: string,
      image?: string,
      reply_markup?: any
    ) => {
      try {
        let endpoint = "";

        switch (platform) {
          case "telegram":
            endpoint = "/api/webhooks/telegram";
            break;
          case "whatsapp":
            endpoint = "/api/webhooks/whatsapp";
            break;
          default:
            endpoint = "/api/webhooks/telegram"; // Padrão para telegram
        }

        // Prepara o payload com botões, se existirem
        const payload: any = {
          disparo: true,
          userId,
          message,
          image,
        };

        // Adiciona reply_markup se existir
        if (reply_markup) {
          payload.reply_markup = reply_markup;
        }

        console.log(
          `Enviando para ${platform}, payload:`,
          JSON.stringify({
            userId,
            hasMessage: !!message,
            hasImage: !!image,
            hasButtons: !!reply_markup,
          })
        );

        const response = await fetch(
          new URL(endpoint, request.url).toString(),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();
        return { userId, success: result.success, details: result };
      } catch (error) {
        console.error(`Erro ao enviar para ${platform}:`, error);
        return {
          userId,
          success: false,
          error: "Erro de comunicação com a API",
        };
      }
    };

    // Processa os disparos em paralelo com limite de concorrência
    const results = await Promise.all(
      recipientsToProcess.map((recipient) =>
        sendToPlatform(
          body.platform || "telegram",
          recipient,
          body.message,
          body.image,
          body.reply_markup
        )
      )
    );

    // Registra uso
    await supabase.from("messages_sent").insert({
      user_id: userId,
      count: recipientsToProcess.length,
      platform: body.platform || "telegram",
    });

    // Calcula estatísticas
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    // Informa se houve destinatários não processados devido ao limite
    const skippedDueToLimit =
      body.recipients.length - recipientsToProcess.length;

    return NextResponse.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failedCount,
      skipped: skippedDueToLimit,
      remaining: remainingMessages - recipientsToProcess.length,
      details: results,
    });
  } catch (error) {
    console.error("Erro ao processar disparo:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
