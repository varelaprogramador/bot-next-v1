import { Telegraf } from "telegraf";
import { createClient } from "@supabase/supabase-js";

// Inicializando o Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Inicializando o Bot do Telegram
export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
