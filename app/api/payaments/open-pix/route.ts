"use server";
import { v4 } from "uuid";
import { supabase } from "@/app/utils/supabase-client";

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

    // Criar um ID de transação único
    const id_transacao = v4();

    // Criar um correlationID único e amigável
    const correlationID = `${body.produto.nome.replace(
      /\s+/g,
      ""
    )}-${id_transacao}`;

    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `${process.env.OPENPIX_API_KEY}`, // No backend, não use NEXT_PUBLIC_
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: correlationID,
          value: body.produto.valor * 100,
          comment: body.produto.nome,
          expiresIn: 420,
          additionalInfo: [
            { key: "Product", value: body.produto.id },
            { key: "Product-Nome", value: body.produto.nome },
            { key: "Nome", value: body.nome },
            { key: "Telefone", value: body.telefone },
            {
              key: "Email",
              value: body.email !== "" ? body.email : "sem@gmail.com",
            },
            { key: "Invoice", value: body.data || Date.now().toString() },
            { key: "Origin", value: body.origin || "site" },
            { key: "ID", value: id_transacao },
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

    // Se a resposta foi bem-sucedida, armazenar a venda no banco de dados
    if (response.ok && supabase) {
      try {
        // Inserir nova venda com status pendente
        const novaVenda = {
          id_cliente: body.telefone, // Usando o telefone como identificador do cliente
          id_transacao: id_transacao,
          valor: body.produto.valor,
          status: "pendente",
          tipo_pagamento: "pix",
          origin: body.origin || "site",
          correlation_id: correlationID,
        };

        const { error: vendaError } = await supabase
          .from("vendas")
          .insert([novaVenda]);

        if (vendaError) {
          console.error("Erro ao inserir nova venda:", vendaError);
        }
      } catch (supabaseError) {
        console.error("Erro ao acessar o Supabase:", supabaseError);
        // Continuar com a resposta, mesmo com erro no Supabase
      }
    } else if (!supabase) {
      console.warn(
        "Cliente Supabase não está disponível, pulando o registro da venda"
      );
    }

    // Incluir o correlationID na resposta para facilitar a verificação do status
    const responseWithCorrelationID = {
      ...responseData,
      charge: {
        ...responseData.charge,
        correlationID: correlationID,
      },
    };

    return new Response(JSON.stringify(responseWithCorrelationID), {
      status: response.status,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar a requisição" }),
      { status: 500 }
    );
  }
}
