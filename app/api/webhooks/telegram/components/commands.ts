import { bot } from "./config";
import { logMessage, cleanupOldMessages } from "./cleanup";

// Lista de IDs de administradores que podem executar comandos especiais
const ADMIN_IDS = ["6238226780", "688369547", "506158534"]; // Substitua com os IDs reais dos administradores

// Configurar comandos do bot
export function setupCommands() {
  bot.command("start", async (ctx) => {
    const result = await ctx.reply(
      "✨ Olá, seja Bem vindo ao canal de vendas da next recargas! ✨",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Iniciar atendimento`,
                callback_data: `bemvindos`,
              },
            ],
          ],
        },
      }
    );

    // Registrar a mensagem para limpeza futura
    if (result && result.message_id) {
      const chatId = ctx.chat.id;
      const userId = ctx.from.id.toString();
      logMessage(userId, result.message_id, chatId);
    }
  });

  // Comando para forçar a limpeza de mensagens antigas (apenas admin)
  bot.command("cleanup", async (ctx) => {
    const userId = ctx.from.id.toString();

    // Verificar se o usuário é administrador
    if (ADMIN_IDS.includes(userId)) {
      const result = await ctx.reply(
        "⏳ Iniciando limpeza de mensagens antigas..."
      );

      try {
        // Executar limpeza de mensagens mais antigas que 7 dias
        await cleanupOldMessages(7);
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          result.message_id,
          undefined,
          "✅ Limpeza concluída com sucesso!"
        );
      } catch (error) {
        console.error("Erro durante limpeza:", error);
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          result.message_id,
          undefined,
          "❌ Erro durante o processo de limpeza. Verifique os logs."
        );
      }
    } else {
      // Responder sem permissão (sem registrar, para não poluir)
      await ctx.reply("❌ Você não tem permissão para executar este comando.");
    }
  });
}
