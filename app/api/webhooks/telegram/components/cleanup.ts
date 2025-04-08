import { bot, supabase } from "./config";

/**
 * Registra uma mensagem no Supabase para futura limpeza
 * @param userId ID do usuário
 * @param messageId ID da mensagem
 * @param chatId ID do chat
 * @param content Conteúdo da mensagem (opcional)
 */
export async function logMessage(
  userId: string,
  messageId: number,
  chatId: number,
  content?: string
) {
  try {
    const { error } = await supabase.from("message_logs").insert({
      user_id: userId,
      message_id: messageId,
      chat_id: chatId,
      content: content || null,
    });

    if (error) {
      console.error(`Erro ao registrar mensagem no Supabase: ${error.message}`);
    } else {
      console.log(
        `Mensagem registrada: usuário ${userId}, mensagem ${messageId}, chat ${chatId}`
      );
    }
  } catch (err) {
    console.error("Erro ao registrar mensagem:", err);
  }
}

/**
 * Limpa todas as mensagens mais antigas que o período definido
 * @param daysToKeep Número de dias para manter mensagens (padrão: 7 dias)
 */
export async function cleanupOldMessages(daysToKeep: number = 7) {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToKeep));

    console.log(
      `Iniciando limpeza de mensagens anteriores a: ${cutoffDate.toISOString()}`
    );

    // Buscar mensagens que precisam ser excluídas
    const { data: messagesToDelete, error: fetchError } = await supabase
      .from("message_logs")
      .select("*")
      .lt("created_at", cutoffDate.toISOString())
      .eq("is_deleted", false);

    if (fetchError) {
      console.error(
        `Erro ao buscar mensagens para exclusão: ${fetchError.message}`
      );
      return;
    }

    if (!messagesToDelete || messagesToDelete.length === 0) {
      console.log("Nenhuma mensagem antiga para excluir");
      return;
    }

    console.log(
      `Total de mensagens a serem excluídas: ${messagesToDelete.length}`
    );

    // Processa as mensagens em lotes para evitar sobrecarregar a API do Telegram
    for (const message of messagesToDelete) {
      try {
        // Tentar excluir a mensagem do Telegram
        await bot.telegram.deleteMessage(message.chat_id, message.message_id);
        console.log(`Mensagem ${message.message_id} excluída com sucesso`);

        // Marcar como excluída no banco
        const { error: updateError } = await supabase
          .from("message_logs")
          .update({
            is_deleted: true,
            deleted_at: new Date(),
          })
          .eq("id", message.id);

        if (updateError) {
          console.error(
            `Erro ao atualizar status da mensagem: ${updateError.message}`
          );
        }

        // Pequeno delay para evitar limitações da API do Telegram
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error: any) {
        console.error(
          `Erro ao excluir mensagem ${message.message_id}: ${error.message}`
        );

        // Atualizar status mesmo com erro (pode ser que a mensagem já tenha sido excluída manualmente)
        await supabase
          .from("message_logs")
          .update({
            is_deleted: true,
            deleted_at: new Date(),
            content: `Erro na exclusão: ${error.message}`,
          })
          .eq("id", message.id);
      }
    }

    console.log(
      `Processo de limpeza concluído. ${messagesToDelete.length} mensagens processadas.`
    );
  } catch (err) {
    console.error("Erro durante o processo de limpeza:", err);
  }
}

/**
 * Configura a limpeza periódica de mensagens
 */
export function setupMessageCleanup() {
  // Executa a cada 7 dias (em milissegundos)
  const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;

  console.log("Agendador de limpeza de mensagens iniciado");

  // Executa uma limpeza inicial depois de 1 hora
  setTimeout(() => {
    cleanupOldMessages()
      .then(() => console.log("Limpeza inicial concluída"))
      .catch((err) => console.error("Erro na limpeza inicial:", err));

    // Configura execução periódica após a primeira limpeza
    setInterval(cleanupOldMessages, CLEANUP_INTERVAL);
  }, 60 * 60 * 1000); // 1 hora
}
