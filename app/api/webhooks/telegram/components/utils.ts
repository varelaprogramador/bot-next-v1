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

    // Send message with image if provided
    if (image) {
      result = await bot.telegram.sendPhoto(userId, image, {
        caption: message,
        ...options,
      });
      console.log(`Message with photo sent to user ID: ${userId}`);
    } else {
      // Send text-only message
      result = await bot.telegram.sendMessage(userId, message, options);
      console.log(`Text message sent to user ID: ${userId}`);
    }

    // Registra a mensagem para limpeza futura
    if (result && result.message_id) {
      logMessage(userId, result.message_id, parseInt(userId), message);
    }

    return { success: true, messageId: result.message_id };
  } catch (error: any) {
    console.error(`Error sending message to user ${userId}:`, error.message);

    // Return detailed error information
    return {
      success: false,
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
      description: error.description || "An unknown error occurred",
    };
  }
}
