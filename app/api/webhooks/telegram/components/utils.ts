import { bot } from "./config";
import { MessageButton } from "./interfaces";
import { logMessage } from "./cleanup";

/**
 * Função para enviar mensagem para o usuário
 * @param userId ID do usuário do Telegram
 * @param message Mensagem a ser enviada
 * @param buttons Botões interativos (opcional)
 * @param image URL da imagem a ser enviada (opcional)
 * @returns Objeto com status do envio e ID da mensagem
 */
export async function sendMessageToUser(
  userId: string,
  message: string,
  buttons: MessageButton[] = [],
  image?: string
) {
  try {
    console.log("[TELEGRAM] Preparando envio de mensagem:", {
      userId,
      messageLength: message.length,
      hasImage: !!image,
      buttonCount: buttons.length,
    });

    // Create inline keyboard with buttons
    const inlineKeyboard = buttons.map((button) => [
      {
        text: button.name,
        ...(button.type === "link"
          ? { url: button.command }
          : { callback_data: button.command }),
      },
    ]);

    // Common options for both message types
    const options = {
      reply_markup:
        inlineKeyboard.length > 0
          ? { inline_keyboard: inlineKeyboard }
          : undefined,
      parse_mode: "HTML" as const, // Enable HTML formatting
    };

    let result;
    console.log("[TELEGRAM] Enviando mensagem...");

    // Send message with image if provided
    if (image) {
      console.log("[TELEGRAM] Enviando mensagem com imagem");
      result = await bot.telegram.sendPhoto(userId, image, {
        caption: message,
        ...options,
      });
      console.log("[TELEGRAM] Mensagem com imagem enviada:", {
        userId,
        messageId: result.message_id,
        imageUrl: image,
      });
    } else {
      console.log("[TELEGRAM] Enviando mensagem de texto");
      result = await bot.telegram.sendMessage(userId, message, options);
      console.log("[TELEGRAM] Mensagem de texto enviada:", {
        userId,
        messageId: result.message_id,
      });
    }

    // Registra a mensagem para limpeza futura
    if (result && result.message_id) {
      console.log("[TELEGRAM] Registrando mensagem para limpeza:", {
        userId,
        messageId: result.message_id,
      });
      logMessage(userId, result.message_id, parseInt(userId));
    }

    return { success: true, messageId: result.message_id };
  } catch (error: any) {
    console.error("[TELEGRAM] Erro ao enviar mensagem:", {
      userId,
      error: error.message,
      code: error.code,
      description: error.description,
      stack: error.stack,
    });

    // Return detailed error information
    return {
      success: false,
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
      description: error.description || "An unknown error occurred",
    };
  }
}
