import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

type InlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
};

type DisparoRequest = {
  recipients: string[];
  message: string;
  image?: string;
  platform?: string;
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
};

const RATE_LIMIT_PER_MINUTE = 50;

const sendToPlatform = async (
  platform: string,
  userId: string,
  message: string,
  image?: string,
  reply_markup?: any,
  requestUrl?: string
) => {
  try {
    let endpoint = "";
    switch (platform) {
      case "telegram":
        endpoint = `${process.env.API_URL}/webhooks/telegram`;
        break;
      case "whatsapp":
        endpoint = `${process.env.API_URL}/webhooks/whatsapp`;
        break;
      default:
        endpoint = `${process.env.API_URL}/webhooks/telegram`;
    }

    const payload: Record<string, any> = {
      disparo: true,
      userId,
      message,
      image,
    };

    if (reply_markup) {
      payload.reply_markup = reply_markup;
    }
    console.log("URL", endpoint);
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (
      response.headers["content-type"] &&
      response.headers["content-type"].includes("application/json")
    ) {
      const result = response.data;
      return { userId, success: result.success, details: result };
    } else {
      return {
        userId,
        success: false,
        error: "Resposta não-JSON recebida da API",
        details: response.data,
      };
    }
  } catch (error: any) {
    return {
      userId,
      success: false,
      error: error?.message || "Erro de comunicação com a API",
      details: error?.response?.data || null,
    };
  }
};

export const POST = async (request: Request) => {
  try {
    const supabase = await createServerSupabaseClient();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    const body: DisparoRequest = await request.json();

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

    if (body.recipients.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Máximo de 100 destinatários por requisição",
        },
        { status: 400 }
      );
    }

    const { data: usageData, error: usageError } = await supabase
      .from("messages_sent")
      .select("count")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .single();

    if (usageError && usageError.code !== "PGRST116") {
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

    const remainingMessages = RATE_LIMIT_PER_MINUTE - currentUsage;
    const recipientsToProcess = body.recipients.slice(0, remainingMessages);

    const results = await Promise.all(
      recipientsToProcess.map((recipient) =>
        sendToPlatform(
          body.platform || "telegram",
          recipient,
          body.message,
          body.image,
          body.reply_markup,
          request.url
        )
      )
    );

    await supabase.from("messages_sent").insert({
      user_id: userId,
      count: recipientsToProcess.length,
      platform: body.platform || "telegram",
    });

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;
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
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
};
