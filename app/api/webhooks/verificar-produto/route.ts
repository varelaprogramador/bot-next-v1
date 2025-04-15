import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Chave de API para autenticação simples
const API_KEY = process.env.WEBHOOK_API_KEY;

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
    const { nome_produto } = data;

    if (!nome_produto) {
      return NextResponse.json(
        { success: false, error: "Nome do produto não fornecido" },
        { status: 400 }
      );
    }

    console.log("Buscando produto:", nome_produto);

    // Buscar o produto pelo nome
    const { data: produtos, error: produtoError } = await supabase
      .from("produtos")
      .select("*")
      .ilike("nome", `%${nome_produto}%`)
      .limit(1);

    // Log do resultado da consulta
    console.log("Resultado da consulta:", {
      produtos,
      erro: produtoError?.message,
    });

    if (produtoError) {
      console.error("Erro ao buscar produto:", produtoError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao buscar produto: " + produtoError.message,
        },
        { status: 500 }
      );
    }

    // Verificar se encontrou algum produto
    if (!produtos || produtos.length === 0) {
      console.log("Produto não encontrado:", nome_produto);
      return NextResponse.json(
        { success: false, message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Usar o primeiro produto encontrado
    const produto = produtos[0];
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
