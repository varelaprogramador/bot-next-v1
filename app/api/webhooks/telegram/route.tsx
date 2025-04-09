// pages/api/webhooks/telegram/route.ts

import { NextResponse } from "next/server";
import { bot } from "./components/config";
import { setupCommands } from "./components/commands";
import { setupCallbacks } from "./components/callbacks";
import { sendMessageToUser } from "./components/utils";
import { setupMessageCleanup } from "./components/cleanup";

// Configurar comandos do bot
setupCommands();

// Configurar os callbacks do bot
setupCallbacks();

// Configurar a limpeza automática de mensagens a cada semana
setupMessageCleanup();

// Configurar a resposta para o método GET
export async function GET(req: Request) {
    try {
        return new NextResponse(
            JSON.stringify({ message: "Webhook configurado corretamente!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Erro no GET:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

// Método POST para receber as atualizações do Telegram
export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log("[TELEGRAM] Webhook recebido:", {
            timestamp: new Date().toISOString(),
            type: data.disparo ? "disparo" : "update",
            userId: data.userId,
            message: data.message?.substring(0, 100) + "...",
            hasImage: !!data.image,
            buttonCount: data.button?.length || 0
        });

        if (data.disparo) {
            const { userId, message, button, image } = data;
            console.log("[TELEGRAM] Iniciando disparo para usuário:", {
                userId,
                messageLength: message.length,
                hasImage: !!image,
                buttonCount: button?.length || 0
            });

            const result = await sendMessageToUser(userId, message, button, image);
            console.log("[TELEGRAM] Resultado do disparo:", {
                userId,
                success: result.success,
                messageId: result.messageId,
                error: result.error
            });

            return new NextResponse(
                JSON.stringify({
                    message: "Webhook POST disparo processado com sucesso!",
                    result
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("[TELEGRAM] Processando atualização do Telegram");
        await bot.handleUpdate(data);
        console.log("[TELEGRAM] Atualização processada com sucesso");

        return new NextResponse(
            JSON.stringify({ message: "Webhook POST processado com sucesso!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[TELEGRAM] Erro no processamento do webhook:", {
            error: error instanceof Error ? error.message : "Erro desconhecido",
            stack: error instanceof Error ? error.stack : undefined
        });
        return new NextResponse(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}