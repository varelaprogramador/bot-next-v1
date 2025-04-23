import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Criar cliente Supabase para o servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and API key are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para validar os dados do contato
const validateContactData = (data: any) => {
  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    return { valid: false, message: "Nome do contato é obrigatório" };
  }

  if (
    !data.telegram_id ||
    typeof data.telegram_id !== "string" ||
    !/^\d+$/.test(data.telegram_id)
  ) {
    return {
      valid: false,
      message: "ID do Telegram inválido (deve conter apenas números)",
    };
  }

  return { valid: true };
};

// Rota POST para criar um novo contato
export async function POST(request: Request) {
  try {
    // Obtém os dados da requisição
    const data = await request.json();

    // Valida os dados
    const validation = validateContactData(data);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // Insere o contato no banco de dados
    const { data: contact, error } = await supabase
      .from("telegram_contacts")
      .insert([
        {
          name: data.name.trim(),
          telegram_id: data.telegram_id,
        },
      ])
      .select()
      .single();

    if (error) {
      // Verifica se é um erro de duplicação
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este ID do Telegram já está cadastrado" },
          { status: 409 }
        );
      }

      console.error("Erro ao inserir contato:", error);
      return NextResponse.json(
        { error: "Falha ao salvar o contato" },
        { status: 500 }
      );
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Rota GET para listar todos os contatos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("telegram_contacts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar contatos:", error);
      return NextResponse.json(
        { error: "Falha ao buscar contatos" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
