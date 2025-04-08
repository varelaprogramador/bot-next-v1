import { createClient } from "@supabase/supabase-js";

// Inicializar o cliente Supabase com verificação de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Suporte para ambos os nomes de variáveis que podem existir
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "⚠️ Variáveis de ambiente do Supabase não configuradas corretamente!"
  );
  console.error(`URL: ${supabaseUrl ? "Configurada" : "NÃO CONFIGURADA"}`);
  console.error(`Key: ${supabaseKey ? "Configurada" : "NÃO CONFIGURADA"}`);
}

// Criar o cliente apenas se as variáveis existirem
let supabaseClient: any = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Cliente Supabase inicializado com sucesso");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar cliente Supabase:", error);
  supabaseClient = null;
}

export const supabase = supabaseClient;
