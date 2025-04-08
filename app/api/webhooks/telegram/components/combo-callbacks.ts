import { supabase } from "./config";

// Função para listar combos
export async function handleListarCombos(ctx: any) {
  const { data: combos, error } = await supabase.from("combos").select("*");

  console.log("ETAPA ", combos);
  if (error) {
    ctx.editMessageText(
      "❌ Não foi possível carregar os combos. Tente novamente mais tarde."
    );
    return;
  }

  const options = {
    reply_markup: {
      inline_keyboard: [
        ...combos.map((item) => [
          {
            text: `${item.nome} (R$${item.valor})`,
            callback_data: `2comprar_${item.id}`,
          },
        ]),
        [{ text: "⬅ Voltar", callback_data: "bemvindos-2" }],
      ],
    },
  };
  console.log(combos, "TESTE");

  const produtos = combos.flatMap((item) => {
    return item.produtos;
  });
  console.log(produtos);

  const mensagem = "Escolha um dos combos acima:";
  const imageUrl = "https://www.n8nworks.shop/banner.jpeg";
  await ctx.deleteMessage();
  ctx.replyWithPhoto(imageUrl, {
    caption: mensagem,
    ...options,
  });
}

// Função para comprar combo
export async function handleComprarCombo(ctx: any, produtoId: string) {
  ctx.deleteMessage();

  // Obter detalhes do produto
  const { data: combo, error } = await supabase
    .from("combos")
    .select("*")
    .eq("id", produtoId)
    .single();
  if (error || !combo) {
    ctx.reply(
      "❌ Não foi possível encontrar o produto. Tente novamente mais tarde."
    );
    return;
  }
  console.log(combo);

  // Verificar se há códigos disponíveis para o produto
  // Verificar se todos os produtos do combo têm códigos ativos
  const produtosCombo = combo.produtos; // Acessando a lista de produtos do combo
  const codigosAtivos = [];

  for (const produto of produtosCombo) {
    const { data: codigos, error: codigosError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id) // Supondo que id_produto se refere ao produto
      .eq("status", "Ativo"); // Filtrando apenas códigos ativos

    if (codigosError || !codigos || codigos.length === 0) {
      ctx.reply(
        `❌ O produto ${produto.nome} não possui códigos ativos disponíveis. Tente novamente mais tarde.`
      );
      return;
    }

    // Adiciona o primeiro código ativo à lista
    codigosAtivos.push(codigos[0]);
  }

  // Recuperar informações do usuário no Supabase
  const userId = ctx.from.id;
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("saldo")
    .eq("user_id", userId)
    .single();

  if (userError || !userData) {
    ctx.reply(
      "❌ Não foi possível recuperar suas informações. Tente novamente mais tarde."
    );
    return;
  }

  const saldoAtual = userData.saldo;
  const valorProduto = combo.valor;

  if (saldoAtual < valorProduto) {
    ctx.reply(
      `⚠️ Saldo insuficiente! Você possui R$${saldoAtual}, mas o produto custa R$${valorProduto}.\n` +
        `💰 Recarregue seu saldo para continuar.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Clique aqui para adicionar saldo",
                callback_data: "saldo",
              },
            ],
            [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
          ],
        },
      }
    );
    return;
  }

  // Mensagem de confirmação
  const confirmacaoOptions = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Confirmar compra de R$${valorProduto}`,
            callback_data: `2confirmar_compra_${produtoId}`,
          },
        ],
        [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
      ],
    },
  };

  ctx.reply(
    `🛒 Você está prestes a adquirir o produto:\n\n` +
      `🔹 ${combo.nome}\n\n` + // Corrigido para exibir o nome do produto
      `💵 Preço: R$${valorProduto}\n` +
      `💰 Saldo atual: R$${saldoAtual.toFixed(2) || 0}\n\n` +
      `Deseja confirmar a compra?`,
    confirmacaoOptions
  );
}
