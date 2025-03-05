import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  require('dotenv').config();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
  console.log(supabaseKey,supabaseUrl)
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and API key are required.');
  }

  // Use a função correta para criar o cliente no navegador
  return createBrowserClient(supabaseUrl, supabaseKey);
}
