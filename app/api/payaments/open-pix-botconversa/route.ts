"use server";
import { createClient } from "@supabase/supabase-js";
import { v4 } from "uuid";
require("dotenv").config(); // Carregar variáveis de ambiente

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Definir interface para o produto
interface Produto {
  nome: string;
  valor?: number;
}

export async function POST(req: Request) {
  try {
    // Lendo o corpo da requisição apenas uma vez como texto
    const rawText = await req.text();
    console.log("Texto recebido:", rawText);

    // Tentando interpretar o texto como JSON
    let body;
    try {
      body = JSON.parse(rawText);
    } catch (jsonError) {
      console.error("Erro ao processar JSON:", jsonError);

      try {
        // Tentar consertar o JSON - remover aspas simples, adicionar aspas duplas
        const fixedText = rawText
          .replace(/'/g, '"') // Substituir aspas simples por aspas duplas
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Adicionar aspas às chaves

        body = JSON.parse(fixedText);
      } catch (fixError) {
        console.error(
          "Não foi possível converter o texto para JSON:",
          fixError
        );

        // Última tentativa: extrair dados usando expressões regulares
        const nameMatch = rawText.match(
          /["']?(?:name|nome)["']?\s*[:=]\s*["']?([^"',}]*)["']?/i
        );
        const phoneMatch = rawText.match(
          /["']?(?:telefone|phonenumber)["']?\s*[:=]\s*["']?([^"',}]*)["']?/i
        );
        const productMatch = rawText.match(
          /["']?produto_nome["']?\s*[:=]\s*["']?([^"',}]*)["']?/i
        );

        body = {
          nome: nameMatch ? nameMatch[1].trim() : "",
          telefone: phoneMatch ? phoneMatch[1].trim() : "",
          produto_nome: productMatch ? productMatch[1].trim() : "",
        };

        console.log("Dados extraídos manualmente:", body);
      }
    }

    console.log("Dados processados:", body);

    // Verificando formato e adaptando se necessário
    const dadosProcessados = {
      nome: body.nome || body.name || "",
      telefone: body.telefone || body.phonenumber || "",
      produto: {
        nome: body.produto ? body.produto.nome : body.produto_nome || "",
      } as Produto,
    };

    // Validação dos dados básicos
    if (
      !dadosProcessados.nome ||
      !dadosProcessados.telefone ||
      !dadosProcessados.produto.nome
    ) {
      console.error("Dados incompletos:", dadosProcessados);
      return new Response(
        JSON.stringify({
          error:
            "Dados incompletos. Necessário: nome, telefone e produto_nome.",
          dados_recebidos: body,
        }),
        { status: 400 }
      );
    }

    // Buscar produto no banco de dados para obter o valor
    const { data: produtos, error: produtoError } = await supabase
      .from("bot_conversa_com_produto")
      .select("*")
      .eq("nome", dadosProcessados.produto.nome);

    if (produtoError || !produtos || produtos.length === 0) {
      console.error(
        "Produto não encontrado no banco de dados:",
        produtoError || "Sem resultados"
      );
      return new Response(
        JSON.stringify({
          error: "Produto não encontrado. Verifique o nome do produto.",
          produto: dadosProcessados.produto.nome,
        }),
        { status: 404 }
      );
    }

    // Verificar se o produto tem valor definido
    if (!produtos[0].valor_vinculado) {
      return new Response(
        JSON.stringify({
          error: "Produto encontrado, mas sem valor definido no sistema.",
        }),
        { status: 400 }
      );
    }

    // Atribuir o valor do produto encontrado no banco
    const produtoDB = produtos[0];
    dadosProcessados.produto.valor = produtoDB.valor_vinculado;

    const id_transacao = v4();
    const rechargeAmount = dadosProcessados.produto.valor;

    // Verificação adicional (isso não deveria acontecer, mas é uma proteção)
    if (typeof rechargeAmount !== "number") {
      return new Response(
        JSON.stringify({
          error: "Valor do produto inválido ou não numérico.",
        }),
        { status: 400 }
      );
    }

    const novaVenda = {
      id_cliente: "bot_conversa",
      nome_cliente: dadosProcessados.nome,
      id_transacao: id_transacao,
      valor: rechargeAmount,
      status: "pendente",
      tipo_pagamento: "pix",
      origin: "bot-conversa",
    };

    const { error: vendaError } = await supabase
      .from("vendas")
      .insert([novaVenda]);

    if (vendaError) {
      console.error("Erro ao inserir nova venda:", vendaError);
    }

    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `Q2xpZW50X0lkXzM4NmEwYjIxLTRhZTMtNGUzMi05NmMzLTg0NmI1NmRkYzc4ZTpDbGllbnRfU2VjcmV0X0d4WmJZZ0VkUElEbDRobUU3RUxNQW5ybmtuNkhtTkRjNmVRT2JXNVhVT289`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: `${dadosProcessados.produto.nome}+${v4()}`.replace(
            /\s+/g,
            ""
          ),
          value: rechargeAmount * 100,
          comment: dadosProcessados.produto.nome,
          expiresIn: 420,
          additionalInfo: [
            { key: "ID", value: id_transacao },
            { key: "Product", value: produtoDB.id_produto_vinculado },
            { key: "Product-Nome", value: produtoDB.nome_vinculado },
            { key: "Nome", value: dadosProcessados.nome },
            { key: "Telefone", value: dadosProcessados.telefone },
            {
              key: "Email",
              value: "sem@gmail.com",
            },
            { key: "Invoice", value: body.data || Date.now().toString() },
            { key: "Origin", value: "bot-conversa" },
          ],
          payer: {
            name: dadosProcessados.nome,
            email: "",
            phone: dadosProcessados.telefone,
          },
        }),
      }
    );

    const responseData = await response.json();
    console.log("Resposta OpenPix:", responseData);
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      ...response.headers,
      ...responseData,
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao processar a requisição",
        details: String(error),
      }),
      { status: 500 }
    );
  }
}
