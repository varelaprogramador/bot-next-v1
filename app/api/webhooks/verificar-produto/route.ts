import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Chave secreta para verificar a assinatura do webhook
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret";

// Função para verificar a assinatura do webhook
const verificarAssinatura = (
  signature: string | null,
  body: string
): boolean => {
  if (!signature) return false;

  const hmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  // Comparação simples de strings ao invés de usar timingSafeEqual
  return hmac === signature;
};

export async function POST(req: Request) {
  try {
    // Verificar se estamos em ambiente de produção para aplicar a verificação
    const isProduction = process.env.NODE_ENV === "production";

    // Obter corpo da requisição
    const requestBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    // Verificar assinatura apenas em produção
    if (isProduction && !verificarAssinatura(signature, requestBody)) {
      console.log("Assinatura inválida:", {
        recebida: signature,
        esperada: crypto
          .createHmac("sha256", WEBHOOK_SECRET)
          .update(requestBody)
          .digest("hex"),
      });

      return NextResponse.json(
        { success: false, error: "Assinatura inválida" },
        { status: 401 }
      );
    }

    // Converter o corpo da requisição para JSON
    const data = JSON.parse(requestBody);

    // Extrair dados do pedido
    const { nome_produto } = data;

    if (!nome_produto) {
      return NextResponse.json(
        { success: false, error: "Nome do produto não fornecido" },
        { status: 400 }
      );
    }

    // Buscar o produto pelo nome
    const { data: produto, error: produtoError } = await supabase
      .from("produtos")
      .select("*")
      .ilike("nome", `%${nome_produto}%`)
      .limit(1)
      .single();

    if (produtoError) {
      console.error("Erro ao buscar produto:", produtoError.message);
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Consultar códigos ativos para o produto
    const { data: codigos, error: codigoError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id_produto)
      .eq("status", "ativo");

    if (codigoError) {
      console.error("Erro ao consultar códigos:", codigoError.message);
      return NextResponse.json(
        { success: false, error: "Erro ao consultar banco de dados" },
        { status: 500 }
      );
    }

    // Verificar se existem códigos disponíveis
    if (!codigos || codigos.length === 0) {
      return NextResponse.json(
        { success: false, message: "Produto indisponível no momento" },
        { status: 200 }
      );
    }

    // Retornar informações do produto e disponibilidade
    return NextResponse.json({
      success: true,
      disponivel: true,
      produto: {
        id: produto.id_produto,
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
