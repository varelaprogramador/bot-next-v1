import { supabase } from "./config";
import { randomUUID } from "crypto";

// Função para exibir o menu de saldo
export async function handleSaldo(ctx: any) {
  console.log("[TELEGRAM] Menu de saldo solicitado:", {
    userId: ctx.from.id,
    username: ctx.from.first_name,
  });

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Gerar Pix 💠", callback_data: "gerar_pix" }],
        [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
      ],
    },
  };

  ctx.editMessageText(
    "💰 Escolha o valor para recarregar seu saldo💰",
    options
  );
}

// Função para gerar Pix
export async function handleGerarPix(ctx: any) {
  console.log("[TELEGRAM] Solicitação de geração de PIX:", {
    userId: ctx.from.id,
    username: ctx.from.first_name,
  });

  // Solicitar ao usuário que insira o valor para recarga
  ctx.editMessageText("Digite o valor da recarga (de R$1 a R$999):", {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅ Voltar", callback_data: "bemvindos" }]],
    },
  });
}

// Função para confirmar geração do Pix
export async function handleConfirmarPix(ctx: any, rechargeAmount: number) {
  const userId = ctx.from.id;
  const username = ctx.from.first_name;
  const id_transacao = randomUUID();

  console.log("[TELEGRAM] Confirmando geração de PIX:", {
    userId,
    username,
    rechargeAmount,
    transactionId: id_transacao,
  });

  // Fazer a requisição para o OpenPix para gerar o link de pagamento
  const response = await fetch(
    "https://api.openpix.com.br/api/v1/charge?return_existing=true",
    {
      method: "POST",
      headers: {
        Authorization: `${process.env.OPENPIX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID: `${userId}-${id_transacao}`,
        value: rechargeAmount * 100,
        comment: "ADIÇÃO DE SALDOS - NEXT",
        additionalInfo: [
          { key: "UserID", value: userId },
          { key: "ID", value: id_transacao },
          { key: "Product", value: "Saldo" },
          { key: "Invoice", value: `${new Date().getTime()}` },
          { key: "Origin", value: `bot` },
        ],
        payer: {
          name: `telegram - ${userId}`,
          email: "",
          phone: "",
          correlationID: userId,
        },
      }),
    }
  );

  const data = await response.json();
  console.log("[TELEGRAM] Resposta do OpenPix:", {
    userId,
    transactionId: id_transacao,
    status: response.status,
    paymentLink: data.charge?.paymentLinkUrl,
  });

  ctx.reply(
    `💳 Aqui está o link para recarregar R$${rechargeAmount.toFixed(
      2
    )} em seu saldo:\n\n${data.charge.paymentLinkUrl}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Clique aqui para pagar",
              url: data.charge.paymentLinkUrl,
            },
          ],
        ],
      },
    }
  );

  const novaVenda = {
    id_cliente: userId,
    id_transacao: id_transacao,
    valor: rechargeAmount,
    status: "pendente",
    tipo_pagamento: "pix",
  };

  console.log("[TELEGRAM] Registrando nova venda:", {
    userId,
    transactionId: id_transacao,
    amount: rechargeAmount,
  });

  const { error: vendaError } = await supabase
    .from("vendas")
    .insert([novaVenda]);

  if (vendaError) {
    console.error("[TELEGRAM] Erro ao registrar venda:", {
      userId,
      transactionId: id_transacao,
      error: vendaError.message,
    });
  } else {
    console.log("[TELEGRAM] Venda registrada com sucesso:", {
      userId,
      transactionId: id_transacao,
    });
  }
}
