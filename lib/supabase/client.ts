import { createBrowserClient } from "@supabase/ssr";

export function createClientSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase URL e API key são necessários. Verifique suas variáveis de ambiente."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
