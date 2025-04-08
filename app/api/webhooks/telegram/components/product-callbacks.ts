import { supabase } from "./config";
import { replyWithLog, editMessageTextWithLog } from "./callbacks";

// Função para listar produtos
export async function handleListarProdutos(ctx: any) {
  // Obter produtos do Supabase
  const { data: produtos, error } = await supabase.from("produtos").select("*"); // Busca todas as colunas

  console.log("ETAPA ", produtos);
  if (error) {
    return replyWithLog(
      ctx,
      "❌ Não foi possível carregar os produtos. Tente novamente mais tarde."
    );
  }

  const produtosUnique = produtos.filter(
    (item, index, self) => index === self.findIndex((t) => t.nome === item.nome)
  );

  const options = () => {
    return produtosUnique.map((item) => [
      {
        text: `${item.nome}`,
        callback_data: `confirma_produto_${item.nome}`,
      },
    ]);
  };

  const mensagem = `🎖️ PERFIL | PREMIUM 🎖️
Escolha um produto para confirmar a compra:\n\n${produtosUnique
    .map((item) => `🔹 ${item.nome}`)
    .join("\n")}

=====================

🏷️ Garantia Total:
Confiamos na qualidade dos nossos serviços e oferecemos garantia em todos eles.

💎 Experiência Premium, feita para você!`;
  await ctx.deleteMessage();
  return replyWithLog(ctx, mensagem, {
    reply_markup: {
      inline_keyboard: [
        ...options(), // Espalha os arrays gerados pela função options
        [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
      ],
    },
  });
}

// Função para confirmar produtos
export async function handleConfirmarProduto(ctx: any, produtoNome: string) {
  // Obter produtos do Supabase
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("nome", produtoNome);

  console.log("ETAPA ", produtos);
  if (error) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível carregar os produtos. Tente novamente mais tarde."
    );
  }

  const options = () => {
    return produtos.map((item) => [
      {
        text: `${item.nome} - ${item.categoria} - (R$${item.valor})`,
        callback_data: `comprar_${item.id}`,
      },
    ]);
  };

  const mensagem = `🎖️ PRODUTOS | PREMIUM 🎖️
Você selecionou o produto: ${produtoNome}\n\nEscolha a opção para compra:\n\n${produtos
    .map((item) => `🔹 ${item.nome} - ${item.categoria}`)
    .join("\n")}

=====================

🏷️ Garantia Total:
Confiamos na qualidade dos nossos serviços e oferecemos garantia em todos eles.

💎 Experiência Premium, feita para você!`;

  return editMessageTextWithLog(ctx, mensagem, {
    reply_markup: {
      inline_keyboard: [
        ...options(), // Espalha os arrays gerados pela função options
        [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
      ],
    },
  });
}

// Função para comprar produto
export async function handleComprarProduto(ctx: any, produtoId: string) {
  // Obter detalhes do produto
  const { data: produto, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .single(); // Adicionando .single() para garantir que apenas um produto seja retornado

  if (error || !produto) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível encontrar o produto. Tente novamente mais tarde."
    );
  }
  console.log(produto);

  // Verificar se há códigos disponíveis para o produto
  const { data: codigos, error: codigosError } = await supabase
    .from("codigos")
    .select("*")
    .eq("id_produto", produtoId);

  // Verificar se há códigos disponíveis e se estão ativos
  if (codigosError) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível verificar a disponibilidade de códigos. Tente novamente mais tarde."
    );
  }

  // Filtrar códigos ativos
  const codigosAtivos = codigos.filter(
    (codigo) => codigo.status.toLowerCase() === "ativo"
  );

  if (codigosAtivos.length <= 0) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não há códigos ativos disponíveis para este produto no momento. Tente novamente mais tarde."
    );
  }

  // Recuperar informações do usuário no Supabase
  const userId = ctx.from.id;
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("saldo")
    .eq("user_id", userId)
    .single();

  if (userError || !userData) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível recuperar suas informações. Tente novamente mais tarde."
    );
  }

  const saldoAtual = userData.saldo;
  const valorProduto = produto.valor;

  if (saldoAtual < valorProduto) {
    return editMessageTextWithLog(
      ctx,
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
  }

  // Mensagem de confirmação
  const confirmacaoOptions = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Confirmar compra de R$${valorProduto}`,
            callback_data: `confirmar_compra_${produtoId}`,
          },
        ],
        [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
      ],
    },
  };

  return editMessageTextWithLog(
    ctx,
    `🛒 Você está prestes a adquirir o produto:\n\n` +
      `🔹 ${produto.nome}\n\n` +
      `💵 Preço: R$${valorProduto.toFixed(2)}\n` +
      `💰 Saldo atual: R$${saldoAtual.toFixed(2)}\n\n` +
      `Deseja confirmar a compra?`,
    confirmacaoOptions
  );
}
