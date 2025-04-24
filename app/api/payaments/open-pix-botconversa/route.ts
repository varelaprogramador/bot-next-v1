"use server";
import { createClient } from "@supabase/supabase-js";
import { v4 } from "uuid";
require("dotenv").config(); // Carregar variáveis de ambiente

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: Request) {
  try {
    // Pegando os dados do request
    const body = await req.json();
    console.log(body);
    if (!body.produto || !body.nome || !body.telefone) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
      });
    }
    // Buscar itens do bot_conversa
    const { data: bot_conversa, error: botError } = await supabase
      .from("bot_conversa_com_produto")
      .select("*")
      .eq("nome", body.produto.nome);

    const id_transacao = v4();
    const rechargeAmount = body.produto.valor;
    const novaVenda = {
      id_cliente: "bot_conversa", // Usando o user_id como id_cliente
      nome_cliente: body.nome,
      id_transacao: id_transacao,
      valor: rechargeAmount,
      status: "pendente", // Status da venda
      tipo_pagamento: "pix", // Tipo de pagamento
      origin: "bot-conversa",
    };

    const { error: vendaError } = await supabase
      .from("vendas")
      .insert([novaVenda]);

    if (vendaError) {
      console.error("Erro ao inserir nova venda:", vendaError);
    }

    if (botError) {
      throw botError;
    }
    const produto = bot_conversa[0];
    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `Q2xpZW50X0lkXzM4NmEwYjIxLTRhZTMtNGUzMi05NmMzLTg0NmI1NmRkYzc4ZTpDbGllbnRfU2VjcmV0X0d4WmJZZ0VkUElEbDRobUU3RUxNQW5ybmtuNkhtTkRjNmVRT2JXNVhVT289`, // No backend, não use NEXT_PUBLIC_
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: `${body.produto.nome}+${v4()}`.replace(/\s+/g, ""), // Remove espaços
          value: body.produto.valor * 100,
          comment: body.produto.nome,
          expiresIn: 420,
          additionalInfo: [
            { key: "ID", value: id_transacao },
            { key: "Product", value: produto.id_produto_vinculado },
            { key: "Product-Nome", value: produto.nome_vinculado },
            { key: "Nome", value: body.nome },
            { key: "Telefone", value: body.telefone }, //
            // Corrigido
            {
              key: "Email",
              value: body.email != "" ? body.email : "sem@gmail.com",
            }, // Corrigido
            { key: "Invoice", value: body.data || Date.now().toString() }, // Se não tiver `data`, usa timestamp
            { key: "Origin", value: "bot-conversa" },
          ],
          payer: {
            name: body.nome,
            email: body.email || "",
            phone: body.telefone,
          },
        }),
      }
    );

    const responseData = await response.json();
    console.log(responseData);
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      ...response.headers,
      ...responseData,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao processar a requisição" }),
      { status: 500 }
    );
  }
}
