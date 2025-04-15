import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Chave de API para autenticação simples
const API_KEY = process.env.WEBHOOK_API_KEY;

// Função para normalizar texto (remove espaços e converte para minúsculas)
const normalizeText = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, "");
};

export async function POST(req: Request) {
  try {
    // Verificação simples de API key
    const apiKey = req.headers.get("x-api-key");

    // Verificar se a API key é válida apenas em produção
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && apiKey !== API_KEY) {
      console.log("API key inválida");
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    // Converter o corpo da requisição para JSON
    const data = await req.json();

    // Extrair dados do pedido
    const { nome_produto, tipo } = data;

    if (!nome_produto) {
      return NextResponse.json(
        { success: false, error: "Nome do produto não fornecido" },
        { status: 400 }
      );
    }

    // Normalizar o nome do produto para busca
    const nomeBusca = normalizeText(nome_produto);
    console.log(
      "Buscando produto:",
      nome_produto,
      "- Normalizado:",
      nomeBusca,
      "- Tipo:",
      tipo
    );

    // Normalizar tipo (mensal/anual) se fornecido
    let tipoNormalizado = null;
    if (tipo) {
      tipoNormalizado = normalizeText(tipo);
      // Padronizar para "mensal" ou "anual"
      if (
        tipoNormalizado.includes("mes") ||
        tipoNormalizado.includes("month")
      ) {
        tipoNormalizado = "mensal";
      } else if (
        tipoNormalizado.includes("ano") ||
        tipoNormalizado.includes("anual") ||
        tipoNormalizado.includes("year")
      ) {
        tipoNormalizado = "anual";
      }
    }

    console.log("Tipo normalizado:", tipoNormalizado);

    // Buscar todos os produtos para filtrar com JavaScript
    const { data: todosProdutos, error: produtosError } = await supabase
      .from("produtos")
      .select("*");

    if (produtosError) {
      console.error("Erro ao buscar produtos:", produtosError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao buscar produtos: " + produtosError.message,
        },
        { status: 500 }
      );
    }

    // Filtrar produtos com base no nome normalizado
    let produtosFiltrados = todosProdutos.filter(
      (p) =>
        normalizeText(p.nome).includes(nomeBusca) ||
        nomeBusca.includes(normalizeText(p.nome))
    );

    // Se tipo foi fornecido, filtrar também por tipo
    if (tipoNormalizado) {
      produtosFiltrados = produtosFiltrados.filter((p) => {
        const categoriaNormalizada = normalizeText(p.categoria || "");

        if (tipoNormalizado === "mensal") {
          return (
            categoriaNormalizada.includes("mensal") ||
            categoriaNormalizada.includes("mes") ||
            categoriaNormalizada.includes("month") ||
            categoriaNormalizada === "1"
          );
        } else if (tipoNormalizado === "anual") {
          return (
            categoriaNormalizada.includes("anual") ||
            categoriaNormalizada.includes("ano") ||
            categoriaNormalizada.includes("year") ||
            categoriaNormalizada === "12"
          );
        }

        return true;
      });
    }

    console.log("Produtos encontrados após filtros:", produtosFiltrados.length);

    // Verificar se encontrou algum produto
    if (produtosFiltrados.length === 0) {
      console.log("Produto não encontrado:", nome_produto, "com tipo:", tipo);

      // Listar os primeiros 5 produtos disponíveis para diagnóstico
      const primeiros5 = todosProdutos
        .slice(0, 5)
        .map((p) => ({ id: p.id, nome: p.nome, categoria: p.categoria }));
      console.log("Primeiros 5 produtos disponíveis:", primeiros5);

      return NextResponse.json(
        {
          success: false,
          message: tipo
            ? `Produto ${nome_produto} não encontrado com tipo ${tipo}`
            : `Produto ${nome_produto} não encontrado`,
          debug: {
            busca: nome_produto,
            normalizado: nomeBusca,
            tipo: tipo,
            tipo_normalizado: tipoNormalizado,
            produtos_disponiveis: primeiros5,
          },
        },
        { status: 404 }
      );
    }

    // Usar o primeiro produto encontrado
    const produto = produtosFiltrados[0];
    console.log("Produto encontrado:", produto);

    // Primeiro, vamos consultar todos os códigos para diagnóstico
    const { data: todosCodigos, error: todoCodigosError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id)
      .limit(10);

    console.log("Consulta diagnóstica - todos os códigos do produto:", {
      total: todosCodigos?.length || 0,
      codigos: todosCodigos,
      erro: todoCodigosError?.message,
    });

    // Consultar códigos ativos para o produto - versão mais flexível
    const { data: codigos, error: codigoError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id)
      .or(`status.eq.ativo,status.eq.Ativo,status.eq.ATIVO`);

    console.log("Códigos ativos encontrados:", codigos?.length || 0);

    if (codigoError) {
      console.error("Erro ao consultar códigos:", codigoError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao consultar banco de dados: " + codigoError.message,
        },
        { status: 500 }
      );
    }

    // Verificar se existem códigos disponíveis
    if (!codigos || codigos.length === 0) {
      // Tentar entender qual é o valor real do status
      const { data: statusValores, error: statusError } = await supabase
        .from("codigos")
        .select("status")
        .eq("id_produto", produto.id)
        .limit(5);

      console.log("Valores de status encontrados:", {
        valores: statusValores,
        erro: statusError?.message,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Produto indisponível no momento",
          debug: {
            produto_id: produto.id,
            status_valores: statusValores,
          },
        },
        { status: 200 }
      );
    }

    // Retornar informações do produto e disponibilidade
    return NextResponse.json({
      success: true,
      disponivel: true,
      produto: {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        valor: produto.valor,
        categoria: produto.categoria,
        quantidade_disponivel: codigos.length,
        tipo: tipoNormalizado || "não especificado",
      },
    });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
