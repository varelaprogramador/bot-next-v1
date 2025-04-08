import { supabase } from "./config";

// Função para exibir perfil do usuário
export async function handlePerfil(ctx: any) {
  const userId = ctx.from.id;

  // Recuperar os dados do usuário do Supabase
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, saldo, saldo_indicacao, historico_produtos, historico_deposito, username"
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    ctx.editMessageText(
      "Desculpe, houve um erro ao buscar suas informações de perfil."
    );
    return;
  }

  // Desestruturar dados do usuário
  const {
    saldo = 0.0,
    saldo_indicacao = 0.0,
    historico_produtos,
    historico_deposito,
    username,
  } = data;

  // Calcular o total de contas adquiridas e o valor total gasto
  const totalCompras = historico_produtos.length || 0;
  const totalGasto = historico_deposito.reduce(
    (total: number, deposito: any) => total + parseFloat(deposito.valor),
    0
  );

  // Criar lista de compras
  const comprasList =
    historico_produtos
      .map(
        (produto: { nome: any; valor: any; data_compra: any }) =>
          `🔹 ${produto.nome} | R$${produto.valor} | ${produto.data_compra}`
      )
      .join("\n") || "Nenhuma compra realizada ainda.";
  const depositoList =
    historico_deposito
      .map(
        (deposito: { tipo: any; valor: any; data_compra: any }) =>
          `🔹 ${deposito.tipo} | R$${deposito.valor} | ${deposito.data_compra}`
      )
      .join("\n") || "Nenhuma deposito realizado ainda.";

  // Mensagem personalizada com a ficha do usuário
  const message = `
💟 Bem-vindo(a) à Recarga Next! 💟  
✨ A melhor loja de streaming do Telegram! ✨

🧾 Sua Ficha de Usuário:
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo.toFixed(2)}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🛍 Compras
🛒 Total de Contas adquiridas: ${totalCompras}
💠 Total em depósitos: R$${totalGasto}

🛍 Histórico de Compras
${comprasList}

💠 Histórico de Deposito
${depositoList}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!
`;

  // Enviar mensagem com as informações do perfil
  ctx.editMessageText(message, {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅ Voltar", callback_data: "bemvindos" }]],
    },
  });
}
