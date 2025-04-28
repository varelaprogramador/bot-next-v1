import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// GET /api/contacts
export async function GET() {
  try {
    const { data: contacts, error } = await supabase
      .from("users")
      .select("id, user_id, username, saldo, saldo_indicacao, created_at")
      .order("username");

    if (error) {
      console.error("Erro ao buscar contatos:", error);
      return new NextResponse(
        JSON.stringify({ error: "Erro ao buscar contatos" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(JSON.stringify({ contacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/contacts
export async function POST(req: Request) {
  try {
    const { name, username } = await req.json();

    if (!name || !username) {
      return new NextResponse(
        JSON.stringify({ error: "Nome e username são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert([{ name, username }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar contato:", error);
      return new NextResponse(
        JSON.stringify({ error: "Erro ao adicionar contato" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(JSON.stringify({ contact: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
