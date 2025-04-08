import { supabase } from "./config";
import { replyWithLog, editMessageTextWithLog } from "./callbacks";

// Função para confirmar compra de produto individual
export async function handleConfirmarCompra(ctx: any, produtoId: string) {
  // Recuperar o produto
  const { data: produto, error: produtoError } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .single();

  if (produtoError || !produto) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível encontrar o produto. Tente novamente mais tarde."
    );
  }

  const valorProduto = produto.valor;
  const userId = ctx.from.id;

  // Recuperar saldo do usuário
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("saldo")
    .eq("user_id", userId)
    .single();

  if (userError || !userData || userData.saldo < valorProduto) {
    return editMessageTextWithLog(
      ctx,
      "❌ Saldo insuficiente ou erro ao validar a compra. Tente novamente."
    );
  }

  // Atualizar saldo no Supabase
  const novoSaldo = userData.saldo - valorProduto;
  const { error: updateError } = await supabase
    .from("users")
    .update({ saldo: novoSaldo })
    .eq("user_id", userId);

  if (updateError) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível processar sua compra. Tente novamente mais tarde.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Clique aqui para adicionar saldo",
                callback_data: "saldo",
              },
            ],
          ],
        },
      }
    );
  }

  // Recuperar códigos do produto apenas se o status for "ativo"
  const { data: codigos, error: codigoError } = await supabase
    .from("codigos")
    .select("*")
    .eq("id_produto", produtoId);

  // Filtrar códigos ativos
  const codigosAtivos = codigos?.filter(
    (codigo) => codigo.status.toLowerCase() === "ativo"
  );

  if (codigoError || !codigosAtivos || codigosAtivos.length === 0) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível processar o código do produto. Solicite um chamado e envie o seu id." +
        `\nSeu id: ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Clique aqui para chamar o suporte",
                url: "https://t.me/nextrecarga",
              },
            ],
          ],
        },
      }
    );
  }

  // Atualizar o status do primeiro código ativo para "resgatado"
  const codigoData = codigosAtivos[0]; // Usar o primeiro código ativo
  const { error: updateCodigoError } = await supabase
    .from("codigos")
    .update({ status: "Resgatado" }) // Ou "inativo", dependendo da sua lógica
    .eq("id_codigo", codigoData.id_codigo); // Atualizando pelo ID do código

  if (updateCodigoError) {
    console.error(
      `Erro ao atualizar o código ${codigoData.codigo}:`,
      updateCodigoError
    );
    // Você pode optar por notificar o usuário ou registrar o erro
  }

  await editMessageTextWithLog(
    ctx,
    `🎉 Compra realizada com sucesso!\n` +
      `🔹 Produto: ${produto.nome}\n` + // Corrigido para exibir o nome do produto
      `💵 Preço: R$${valorProduto}\n` +
      `💰 Saldo restante: R$${novoSaldo.toFixed(2)}\n\n` +
      `Aproveite seu novo produto!`
  );

  return replyWithLog(
    ctx,
    `
🎉 PARABÉNS! SEU GIFT CARD ESTÁ PRONTO! 🎉
      
✨ Aproveite agora mesmo o seu presente exclusivo! ✨  
Copie o código abaixo e ative para desbloquear seu giftcard:
      
📜 Seu Código: ${codigoData.codigo}
      
🔗 Como ativar:  
  1️⃣ Copie o código acima.  
  2️⃣ Acesse o seu aplicativo.  
  3️⃣ Insira o código no campo de ativação.  
  4️⃣ Curta sua experiência ao máximo! 🎁
      
Se tiver dúvidas, estamos aqui para ajudar. 💬
    `
  );
}

// Função para confirmar compra de combo
export async function handleConfirmarCompraCombo(ctx: any, produtoId: string) {
  // Obter detalhes do combo
  const { data: combo, error } = await supabase
    .from("combos")
    .select("*")
    .eq("id", produtoId)
    .single();

  if (error || !combo) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível encontrar o combo. Tente novamente mais tarde."
    );
  }

  const valorProduto = combo.valor;
  const userId = ctx.from.id;

  // Recuperar saldo do usuário
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("saldo")
    .eq("user_id", userId)
    .single();

  if (userError || !userData || userData.saldo < valorProduto) {
    return editMessageTextWithLog(
      ctx,
      "❌ Saldo insuficiente ou erro ao validar a compra. Tente novamente."
    );
  }

  // Atualizar saldo no Supabase
  const novoSaldo = userData.saldo - valorProduto;
  const { error: updateError } = await supabase
    .from("users")
    .update({ saldo: novoSaldo })
    .eq("user_id", userId);

  if (updateError) {
    return editMessageTextWithLog(
      ctx,
      "❌ Não foi possível processar sua compra. Tente novamente mais tarde.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Clique aqui para adicionar saldo",
                callback_data: "saldo",
              },
            ],
          ],
        },
      }
    );
  }

  // Verificar se todos os produtos do combo têm códigos ativos
  const produtosCombo = combo.produtos; // Acessando a lista de produtos do combo
  const codigosAtivos = [];

  for (const produto of produtosCombo) {
    const { data: codigos, error: codigosError } = await supabase
      .from("codigos")
      .select("*")
      .eq("id_produto", produto.id); // Supondo que id_produto se refere ao produto

    if (codigosError || !codigos || codigos.length === 0) {
      return editMessageTextWithLog(
        ctx,
        `❌ O produto ${produto.nome} não possui códigos disponíveis. Tente novamente mais tarde.`
      );
    }

    // Filtrar códigos ativos antes de adicionar
    const codigosAtivosFiltrados = codigos.filter(
      (codigo) => codigo.status.toLowerCase() === "ativo"
    );

    if (codigosAtivosFiltrados.length === 0) {
      return editMessageTextWithLog(
        ctx,
        `❌ O produto ${produto.nome}não possui códigos ativos disponíveis. Tente novamente mais tarde.`
      );
    }

    // Adiciona o primeiro código ativo à lista
    codigosAtivos.push(codigosAtivosFiltrados[0]);
  }

  // Se todos os códigos estão ativos, prosseguir com a compra
  await editMessageTextWithLog(
    ctx,
    `🎉 Compra realizada com sucesso!\n` +
      `🔹 Combo: ${combo.nome}\n` + // Exibindo o nome do combo
      `💵 Preço: R$${valorProduto}\n` +
      `💰 Saldo restante: R$${novoSaldo.toFixed(2)}\n\n` +
      `Aproveite seu novo combo!`
  );

  const mensagensCodigos = codigosAtivos
    .map((codigo) => {
      const produto = produtosCombo.find(
        (item: { id: any }) => codigo.id_produto === item.id
      );
      return `📜 ${produto ? produto.nome : "Produto Desconhecido"}: ${
        codigo.codigo
      }`;
    })
    .join("\n");

  for (const codigo of codigosAtivos) {
    const { error: updateCodigoError } = await supabase
      .from("codigos")
      .update({ status: "Resgatado" }) // Ou "inativo", dependendo da sua lógica
      .eq("id_codigo", codigo.id_codigo); // Atualizando pelo ID do código

    if (updateCodigoError) {
      console.error(
        `Erro ao atualizar o código ${codigo.codigo}:`,
        updateCodigoError
      );
      // Você pode optar por notificar o usuário ou registrar o erro
    }
  }

  return replyWithLog(
    ctx,
    `
🎉 PARABÉNS! SEUS CÓDIGOS ESTÃO PRONTOS! 🎉
  
✨ Aproveite agora mesmo os seus presentes exclusivos! ✨  
Copie os códigos abaixo e ative para desbloquear suas recompensas:
  
${mensagensCodigos}
  
🔗 Como ativar:  
1️⃣ Copie o código acima.  
2️⃣ Acesse nosso site ou aplicativo.  
3️⃣ Insira o código no campo de ativação.  
4️⃣ Curta sua experiência ao máximo! 🎁
  
⏳ Não perca tempo! O código é válido por tempo limitado.  
Se tiver dúvidas, estamos aqui para ajudar. 💬
`
  );
}
