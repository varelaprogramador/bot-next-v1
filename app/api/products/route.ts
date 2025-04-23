import { NextResponse } from "next/server";
import { verifySecretHeader } from "../middlewares/authMiddleware";
import { createClient } from "@supabase/supabase-js";

// Criar cliente Supabase para o servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and API key are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  // Verificar autenticação
  const authResult = verifySecretHeader(req);
  if (authResult) {
    return authResult; // Retorna a resposta de erro se a autenticação falhar
  }

  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const tipo = url.searchParams.get("tipo");
    const status = url.searchParams.get("status");

    // Configurar a query base
    let query = supabase.from("produtos").select("*");

    // Aplicar filtros se especificados
    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Executar a consulta para obter produtos
    const { data: produtos, error: produtosError } = await query;

    if (produtosError) {
      console.error("Erro ao buscar produtos:", produtosError);
      return NextResponse.json(
        { success: false, message: "Erro ao buscar produtos" },
        { status: 500 }
      );
    }

    // Se o tipo não for combo, ou se nenhum tipo for especificado, buscar também combos
    let combos = [];
    if (!tipo || tipo === "combo") {
      // Consultar combos
      let combosQuery = supabase
        .from("combos")
        .select("*, itens:produtos(id, nome)");

      if (status) {
        combosQuery = combosQuery.eq("status", status);
      }

      const { data: combosData, error: combosError } = await combosQuery;

      if (combosError) {
        console.error("Erro ao buscar combos:", combosError);
        return NextResponse.json(
          { success: false, message: "Erro ao buscar combos" },
          { status: 500 }
        );
      }

      // Adicionar os combos à lista se existirem
      if (combosData && combosData.length > 0) {
        combos = combosData;
      }
    }

    // Combinar produtos e combos se necessário
    const resultados =
      tipo === "produto"
        ? produtos
        : tipo === "combo"
        ? combos
        : [...(produtos || []), ...(combos || [])];

    // Informações de paginação
    const total = resultados.length;
    const pagina = 1;
    const totalPaginas = 1;

    return NextResponse.json(
      {
        success: true,
        produtos: resultados,
        total,
        pagina,
        totalPaginas,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao processar a requisição",
      },
      { status: 500 }
    );
  }
}
