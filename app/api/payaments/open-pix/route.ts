"use server";
import { v4 } from "uuid";
import { NextResponse } from "next/server";

import { dispararWebhook } from "@/app/utils/webhook";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nome, telefone, valor } = await req.json();

    if (!nome || !telefone || !valor) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    console.log(
      "==================Iniciando processo de nova venda==================="
    );
    const id_transacao = v4();
    const rechargeAmount = valor;
    const novaVenda = {
      id_cliente: "site",
      nome_cliente: nome,
      valor: rechargeAmount,
      status: "pendente",
      tipo_pagamento: "pix",
      origin: "site",
      tipo_produto: "produto",
      detalhes_produto: {
        id: "produto",
        nome: "Pagamento via PIX",
        valor: rechargeAmount,
        tipo: "produto",
      },
    };
    console.log(novaVenda);
    const { error: vendaError } = await supabase
      .from("vendas")
      .insert([novaVenda]);

    if (vendaError) {
      console.error("Erro ao inserir nova venda:", vendaError);
    }
    console.log(
      "==================Disparando webhook de nova venda==================="
    );
    // Disparar webhook de nova venda
    await dispararWebhook("nova_venda", {
      ...novaVenda,
      cliente: {
        nome: nome,
        telefone: telefone,
        email: "",
      },
    });

    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `Q2xpZW50X0lkXzM4NmEwYjIxLTRhZTMtNGUzMi05NmMzLTg0NmI1NmRkYzc4ZTpDbGllbnRfU2VjcmV0X0d4WmJZZ0VkUElEbDRobUU3RUxNQW5ybmtuNkhtTkRjNmVRT2JXNVhVT289`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: `${nome}+${v4()}`.replace(/\s+/g, ""),
          value: valor * 100,
          comment: "Pagamento via PIX",
          expiresIn: 420,
          additionalInfo: [
            { key: "Nome", value: nome },
            { key: "Telefone", value: telefone },
            { key: "Email", value: "sem@gmail.com" },
            { key: "Invoice", value: Date.now().toString() },
          ],
          payer: {
            name: nome,
            email: "",
            phone: telefone,
          },
        }),
      }
    );

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erro no processamento:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar a requisição",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
