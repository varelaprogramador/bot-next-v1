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
    const { nome_produto, tipo, customer } = data;

    if (!nome_produto) {
      return NextResponse.json(
        { success: false, error: "Nome do produto não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se os dados do cliente foram fornecidos
    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json(
        { success: false, error: "Dados do cliente incompletos" },
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

    // Consultar códigos ativos para o produto - versão mais flexível
    const { data: codigos, error: codigoError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id)
      .or(`status.eq.ativo,status.eq.Ativo,status.eq.ATIVO`)
      .limit(1); // Pegamos apenas um código

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
      return NextResponse.json(
        {
          success: false,
          message: "Produto indisponível no momento",
        },
        { status: 200 }
      );
    }

    // Pegar o primeiro código disponível
    const codigoParaDistribuir = codigos[0];

    // Atualizar o código para status "distribuído" e adicionar info do cliente
    const { error: updateError } = await supabase
      .from("codigos")
      .update({
        status: "Resgatado",
      })
      .eq("id_codigo", codigoParaDistribuir.id_codigo);

    if (updateError) {
      console.error("Erro ao atualizar código:", updateError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao distribuir código: " + updateError.message,
        },
        { status: 500 }
      );
    }

    // Retornar o código distribuído
    return NextResponse.json({
      success: true,
      produto: {
        id: produto.id,
        nome: produto.nome,
      },
      codigo: {
        id: codigoParaDistribuir.id_codigo,
        codigo: codigoParaDistribuir.codigo,
      },
      cliente: {
        nome: customer.name,
        telefone: customer.phone,
        correlationID: customer.correlationID,
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
