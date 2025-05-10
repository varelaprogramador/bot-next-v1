import { NextResponse } from "next/server";
import { telegramUsage } from "@/app/utils/telegram-usage";

export async function POST(req: Request) {
  try {
    const { userIds, message, buttons, image } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de usuários inválida" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem não fornecida" },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      total: userIds.length,
      errors: [] as string[],
    };

    // Processa cada usuário individualmente para verificar o limite
    for (const userId of userIds) {
      try {
        const { canSend, remaining } = await telegramUsage.checkAndUpdateUsage(
          userId
        );

        if (!canSend) {
          results.failed++;
          results.errors.push(
            `Usuário ${userId}: Limite diário de mensagens atingido`
          );
          continue;
        }

        const response = await fetch("/api/webhooks/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            message,
            buttons,
            image,
            disparo: true,
          }),
        });

        if (response.ok) {
          results.successful++;
        } else {
          const error = await response.json();
          results.failed++;
          results.errors.push(
            `Usuário ${userId}: ${error.message || "Erro desconhecido"}`
          );
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Usuário ${userId}: ${error.message || "Erro desconhecido"}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Erro no envio em lote:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
