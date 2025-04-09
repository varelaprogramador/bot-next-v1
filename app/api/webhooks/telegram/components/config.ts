import { Telegraf } from "telegraf";
import { createClient } from "@supabase/supabase-js";

// Inicializando o Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Inicializando o Bot do Telegram
export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Adiciona middleware para logar todas as atualizações
bot.use((ctx, next) => {
  console.log(`[TELEGRAM] Nova atualização recebida:`, {
    updateId: ctx.update.update_id,
    type: ctx.updateType,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    messageId: ctx.message?.message_id,
    callbackData:
      ctx.callbackQuery && "data" in ctx.callbackQuery
        ? ctx.callbackQuery.data
        : undefined,
  });
  return next();
});
