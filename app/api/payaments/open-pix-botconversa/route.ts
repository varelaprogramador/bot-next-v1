"use server";
import { createClient } from "@supabase/supabase-js";
import { v4 } from "uuid";
require("dotenv").config(); // Carregar variáveis de ambiente

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Interfaces for products and combos
interface Produto {
  nome: string;
  valor?: number;
  id?: string;
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
        const typeProductMatch = rawText.match(
          /["']?type[-_]product["']?\s*[:=]\s*["']?([^"',}]*)["']?/i
        );

        body = {
          nome: nameMatch ? nameMatch[1].trim() : "",
          telefone: phoneMatch ? phoneMatch[1].trim() : "",
          produto_nome: productMatch ? productMatch[1].trim() : "",
          type_product: typeProductMatch
            ? typeProductMatch[1].trim()
            : "produto",
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
      type_product: "", // Adicionando o campo type_product na definição
    };

    // Determina se é combo ou produto com base na presença do "+" no nome
    dadosProcessados.type_product = dadosProcessados.produto.nome.includes("+")
      ? "combo"
      : "produto";

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

    let rechargeAmount = 0;
    let productDetails: any = {};
    let productComment = "";
    let additionalProductInfo: any[] = [];

    // Based on type_product, fetch from appropriate table and process accordingly
    if (dadosProcessados.type_product === "combo") {
      // Fetching combo details from the combo table
      const { data: combos, error: comboError } = await supabase
        .from("bot_conversa_com_combos")
        .select("*")
        .ilike("nome_combo", dadosProcessados.produto.nome);

      console.log("Combos encontrados:", combos);
      if (comboError || !combos || combos.length === 0) {
        console.error(
          "Combo não encontrado no banco de dados:",
          comboError || "Sem resultados"
        );
        return new Response(
          JSON.stringify({
            error: "Combo não encontrado. Verifique o nome do combo.",
            combo: dadosProcessados.produto.nome,
          }),
          { status: 404 }
        );
      }

      const comboDB = combos[0];

      // Verificar se o combo tem valor definido
      if (!comboDB.valor_combo_vinculado) {
        return new Response(
          JSON.stringify({
            error: "Combo encontrado, mas sem valor definido no sistema.",
          }),
          { status: 400 }
        );
      }

      // Usar o valor do combo
      rechargeAmount = comboDB.valor_combo_vinculado;

      // Parse produtos array if it's a string
      let produtosArray = comboDB.produtos;
      if (typeof produtosArray === "string") {
        try {
          produtosArray = JSON.parse(produtosArray);
        } catch (e) {
          console.error("Erro ao processar array de produtos do combo:", e);
          produtosArray = [];
        }
      }

      // Add product info for each product in the combo
      if (Array.isArray(produtosArray)) {
        productComment = `Combo: ${comboDB.nome_combo}`;

        // Add combo info
        additionalProductInfo = [
          { key: "Combo-ID", value: comboDB.id || "" },
          { key: "Combo-Nome", value: comboDB.nome_combo || "" },
          {
            key: "Combo-Valor",
            value: comboDB.valor_combo_vinculado.toString() || "",
          },
        ];

        // Add each product in the combo
        produtosArray.forEach((produto, index) => {
          additionalProductInfo.push(
            { key: `Produto-${index + 1}-ID`, value: produto.id || "" },
            { key: `Produto-${index + 1}-Nome`, value: produto.nome || "" },
            {
              key: `Produto-${index + 1}-Valor`,
              value: produto.valor?.toString() || "",
            }
          );
        });
      }

      productDetails = {
        id: comboDB.id,
        nome: comboDB.nome_combo,
        valor: comboDB.valor_combo_vinculado,
        tipo: "combo",
      };
    } else {
      // Original logic for single product
      const { data: produtos, error: produtoError } = await supabase
        .from("bot_conversa_com_produto")
        .select("*")
        .ilike("nome", dadosProcessados.produto.nome);

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
      rechargeAmount = produtoDB.valor_vinculado;
      productComment =
        produtoDB.nome_vinculado || dadosProcessados.produto.nome;

      additionalProductInfo = [
        { key: "Product", value: produtoDB.id_produto_vinculado },
        { key: "Product-Nome", value: produtoDB.nome_vinculado },
      ];

      productDetails = {
        id: produtoDB.id_produto_vinculado,
        nome: produtoDB.nome_vinculado,
        valor: produtoDB.valor_vinculado,
        tipo: "produto",
      };
    }

    const id_transacao = v4();

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
      tipo_produto: dadosProcessados.type_product,
      detalhes_produto: productDetails,
    };

    const { error: vendaError } = await supabase
      .from("vendas")
      .insert([novaVenda]);

    if (vendaError) {
      console.error("Erro ao inserir nova venda:", vendaError);
    }

    // Concatenar informações básicas com informações de produtos
    const allAdditionalInfo = [
      { key: "ID", value: id_transacao },
      { key: "Nome", value: dadosProcessados.nome },
      { key: "Telefone", value: dadosProcessados.telefone },
      { key: "Email", value: "sem@gmail.com" },
      { key: "Invoice", value: body.data || Date.now().toString() },
      { key: "Origin", value: "bot-conversa" },
      { key: "Tipo", value: dadosProcessados.type_product },
      ...additionalProductInfo,
    ];

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
          comment: productComment,
          expiresIn: 420,
          additionalInfo: allAdditionalInfo,
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

    if (dadosProcessados.telefone) {
      const response = await fetch(
        "https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/107090/1MkfIW9naU7u/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: dadosProcessados.nome,
            phone: dadosProcessados.telefone,
            produto: dadosProcessados.produto.nome,
            codigo: responseData.charge.brCode,
            message: `🔔 ${dadosProcessados.nome}, seu acesso está quase liberado!
Para concluir seu pedido de IPTV, siga as instruções abaixo:

💳 Pagamento via PIX:
Acesse o link abaixo para efetuar o pagamento de forma rápida e segura:

🔗 ${responseData.charge.paymentLinkUrl}`,
            message2: `📋 Ou copie e cole o código abaixo no app do seu banco:

${responseData.charge.brCode}`,
          }),
        }
      );
    }
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
