import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and API key are required.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value;
      },
      async set(name: string, value: string, options: any) {
        (await cookieStore).set(name, value, options);
      },
      async remove(name: string, options: any) {
        (await cookieStore).set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}
