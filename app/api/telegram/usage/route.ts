import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Busca o total de mensagens
    const { data: totalMessages, error: totalError } = await supabase
      .from("telegram_usage")
      .select("message_count")
      .single();

    if (totalError) throw totalError;

    // Busca o número de usuários conhecidos e desconhecidos
    const { data: userStats, error: userError } = await supabase
      .from("telegram_usage")
      .select("is_known_user")
      .eq("date", new Date().toISOString().split("T")[0]);

    if (userError) throw userError;

    const knownUsers =
      userStats?.filter((user) => user.is_known_user).length || 0;
    const unknownUsers =
      userStats?.filter((user) => !user.is_known_user).length || 0;

    // Busca o uso por dia dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: usageByDate, error: usageError } = await supabase
      .from("telegram_usage")
      .select("*")
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (usageError) throw usageError;

    // Agrupa os dados por dia
    const groupedUsage = usageByDate.reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          message_count: 0,
          known_users: 0,
          unknown_users: 0,
        };
      }
      acc[date].message_count += curr.message_count;
      if (curr.is_known_user) {
        acc[date].known_users++;
      } else {
        acc[date].unknown_users++;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      total_messages: totalMessages?.message_count || 0,
      known_users: knownUsers,
      unknown_users: unknownUsers,
      usage_by_date: Object.values(groupedUsage),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
