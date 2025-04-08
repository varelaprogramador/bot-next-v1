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
        const data = await req.json(); // Receber a atualização do Telegram
        console.log("Atualização recebida:", data);
        if (data.disparo) {
            const { userId, message, button, image } = data;
            await sendMessageToUser(userId, message, button, image);

            return new NextResponse(
                JSON.stringify({
                    message: "Webhook POST disparo processado com sucesso!",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }
        // Passar a atualização para o Telegraf processar
        await bot.handleUpdate(data);

        return new NextResponse(
            JSON.stringify({ message: "Webhook POST processado com sucesso!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Erro no POST:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}