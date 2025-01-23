require('dotenv').config();  // Carregar variáveis de ambiente do .env
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Inicializando o Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Inicializando o Bot do Telegram
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Função para enviar os botões embutidos
const sendActionButtonsInline = async (ctx) => { 
  const chatId = ctx.chat.id;
  const username = ctx.from.username || 'None'; 
  const userId = ctx.from.id;

  // Verificar se o usuário já existe no banco de dados
  const { data, error } = await supabase
    .from('users')
    .select('id, saldo, saldo_indicacao')
    .eq('user_id', userId)
    .single();

  // Se o usuário não existir, criar um novo registro
  if (error || !data) {
    const { data: insertedData, error: insertError } = await supabase
      .from('users')
      .insert([{
        user_id: userId,
        username: username,
        saldo: 0.00, // saldo inicial
        saldo_indicacao: 0.00, // saldo de indicação inicial
      }])
      .single();

    if (insertError) {
      console.error('Erro ao inserir usuário no Supabase:', insertError);
      return ctx.reply("Desculpe, houve um erro ao registrar suas informações.");
    }

    console.log('Novo usuário inserido no Supabase:', insertedData);
  }

  // Exibir a ficha do usuário
  const { saldo, saldo_indicacao } = data || {};
  console.log(data);

  const message = `
💟 Bem-vindo(a) à Recarga Next! 💟
✨ A melhor loja de streaming do Telegram! ✨

🧾 Sua Ficha de Usuário:
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!
`;

  // Enviar mensagem de boas-vindas com a ficha do usuário
  bot.telegram.sendMessage(chatId,message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Contas Premium', callback_data: 'premium' }],
        [{ text: '💰 Saldo', callback_data: 'saldo' }, { text: '👤 Perfil', callback_data: 'perfil' }],
        [{ text: '🛠️ Suporte', callback_data: 'suporte' }],
      ],
    },
  }); 
};

// Bot começa
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.from.username || 'None'; 
  const userId = ctx.from.id;

  // Verificar se o usuário já existe no banco de dados
  const { data, error } = await supabase
    .from('users')
    .select('id, saldo, saldo_indicacao')
    .eq('user_id', userId)
    .single();

  // Se o usuário não existir, criar um novo registro
  if (error || !data) {
    const { data: insertedData, error: insertError } = await supabase
      .from('users')
      .insert([{
        user_id: userId,
        username: username,
        saldo: 0.00, // saldo inicial
        saldo_indicacao: 0.00, // saldo de indicação inicial
      }])
      .single();

    if (insertError) {
      console.error('Erro ao inserir usuário no Supabase:', insertError);
      return ctx.reply("Desculpe, houve um erro ao registrar suas informações.");
    }

    console.log('Novo usuário inserido no Supabase:', insertedData);
  }

  // Exibir a ficha do usuário
  const { saldo, saldo_indicacao } = data || {};
  console.log(data);

  const message = `
💟 Bem-vindo(a) à Recarga Next! 💟
✨ A melhor loja de streaming do Telegram! ✨

🧾 Sua Ficha de Usuário:
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!
`;

  // Enviar mensagem de boas-vindas com a ficha do usuário
  bot.telegram.sendMessage(chatId,message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Contas Premium', callback_data: 'premium' }],
        [{ text: '💰 Saldo', callback_data: 'saldo' }, { text: '👤 Perfil', callback_data: 'perfil' }],
        [{ text: '🛠️ Suporte', callback_data: 'suporte' }],
      ],
    },
  }); 
});

bot.on('callback_query', async (ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const callbackData = ctx.callbackQuery.data;

  if (callbackData === 'premium') {
    // Obter produtos do Supabase
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('*'); // Busca todas as colunas

    console.log("ETAPA ", produtos);
    if (error) {
      ctx.editMessageText("❌ Não foi possível carregar os produtos. Tente novamente mais tarde.");
      return;
    }

    const options = {
      reply_markup: {
        inline_keyboard: produtos.map(item => [
          { text: `${item.nome} (R$${item.valor})`, callback_data: `comprar_${item.id}` }
        ]),
      },
    };
    ctx.editMessageText('💎 Escolha um canal premium:', options);
  } else if (callbackData.startsWith('comprar_')) {
    const produtoId = callbackData.split('_')[1];
    console.log(produtoId);
    
    // Obter detalhes do produto
    const { data: produto, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', produtoId)
      .single(); // Adicionando .single() para garantir que apenas um produto seja retornado

    if (error || !produto) {
      ctx.editMessageText("❌ Não foi possível encontrar o produto. Tente novamente mais tarde.");
      return;
    }
    console.log(produto);

    // Recuperar informações do usuário no Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('saldo')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      ctx.editMessageText("❌ Não foi possível recuperar suas informações. Tente novamente mais tarde.");
      return;
    }

    const saldoAtual = userData.saldo;
    const valorProduto = produto.valor;

    if (saldoAtual < valorProduto) {
      ctx.editMessageText(
        `⚠️ Saldo insuficiente! Você possui R$${saldoAtual}, mas o produto custa R$${valorProduto}.\n` +
        `💰 Recarregue seu saldo para continuar.`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Clique aqui para adicionar saldo', callback_data: 'saldo' }],
              [{ text: 'Voltar para o menu', callback_data: 'voltar' }]
            ]
          }
        }
      );
      return;
    }

    // Mensagem de confirmação
    const confirmacaoOptions = {
      reply_markup: {
        inline_keyboard: [
          [{ text: `Confirmar compra de R$${valorProduto}`, callback_data: `confirmar_compra_${produtoId}` }],
          [{ text: 'Voltar para o MENU', callback_data: 'voltar' }],
        ],
      },
    };

    ctx.editMessageText(
      `🛒 Você está prestes a adquirir o produto:\n\n` +
      `🔹 ${produto.nome}\n\n` + // Corrigido para exibir o nome do produto
      `💵 Preço: R$${valorProduto}\n` +
      `💰 Saldo atual: R$${saldoAtual}\n\n` +
      `Deseja confirmar a compra?`,
      confirmacaoOptions
    );
  } else if (callbackData.startsWith('confirmar_compra_')) {
    const produtoId = callbackData.replace('confirmar_compra_', '');
    const { data: produto, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', produtoId)
      .single(); // Adicionando .single() para garantir que apenas um produto seja retornado

    if (error || !produto) {
      ctx.editMessageText("❌ Não foi possível encontrar o produto. Tente novamente mais tarde.");
      return;
    }

    const valorProduto = produto.valor;

    // Recuperar saldo novamente para evitar conflitos
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('saldo')
      .eq('user_id', userId)
      .single();

    if (userError || !userData || userData.saldo < valorProduto) {
      ctx.editMessageText("❌ Saldo insuficiente ou erro ao validar a compra. Tente novamente.");
      return;
    }

    // Atualizar saldo no Supabase
    const novoSaldo = userData.saldo - valorProduto;
    const { error: updateError } = await supabase
      .from('users')
      .update({ saldo: novoSaldo })
      .eq('user_id', userId);

    if (updateError) {
      ctx.editMessageText("❌ Não foi possível processar sua compra. Tente novamente mais tarde.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Clique aqui para adicionar saldo', callback_data: 'saldo' }]
          ]
        }
      });
      return;
    }

    // Recuperar código do produto apenas se o status for "ativo"
    const { data: codigoData, error: codigoError } = await supabase
      .from('codigos')
      .select('*')
      .eq('id_produto', produtoId)
      .eq('status', 'ativo') // Filtrando apenas códigos ativos
      .single();

    if (codigoError || !codigoData) {
      ctx.editMessageText("❌ Não foi possível processar o código do produto. Solicite um chamado e envie o seu id." + `\nSeu id:${userId}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Clique aqui para chamar o suporte', callback_data: 'suporte' }]
          ]
        }
      });
      return;
    }

    ctx.editMessageText(
      `🎉 Compra realizada com sucesso!\n` +
      `🔹 Produto: ${produto.nome}\n` + // Corrigido para exibir o nome do produto
      `💵 Preço: R$${valorProduto}\n` +
      `💰 Saldo restante: R$${novoSaldo}\n\n` +
      `Aproveite seu novo produto!`
    );
    ctx.reply(`
      🎉 *PARABÉNS! SEU GIFT CARD ESTÁ PRONTO!* 🎉
      
      ✨ Aproveite agora mesmo o seu presente exclusivo! ✨  
      Copie o código abaixo e ative para desbloquear suas recompensas:
      
      📜 Seu Código: ${codigoData.codigo}
      
      🔗 Como ativar:  
      1️⃣ Copie o código acima.  
      2️⃣ Acesse nosso site ou aplicativo.  
      3️⃣ Insira o código no campo de ativação.  
      4️⃣ Curta sua experiência ao máximo! 🎁
      
      ⏳ Não perca tempo! O código é válido por tempo limitado.  
      Se tiver dúvidas, estamos aqui para ajudar. 💬
      `);
      
  }else if (callbackData === 'saldo') {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Gerar Pix 💠', callback_data: 'gerar_pix' }],
          [{ text: '⬅ Voltar', callback_data: 'voltar' }],
        ],
      },
    };
    
    ctx.reply('💰 Escolha o valor para recarregar seu saldo💰', options);
  } else if (callbackData === 'gerar_pix') {
    // Solicitar ao usuário que insira o valor para recarga
    ctx.reply('Digite o valor da recarga (de R$1 a R$999):');
    
    // Espera pelo texto da resposta
    bot.on('text', async (messageCtx) => {
      const valorInput = parseFloat(messageCtx.message.text);
      if (isNaN(valorInput) || valorInput < 1 || valorInput > 999) {
        messageCtx.reply('⚠️ Valor inválido. Por favor, insira um valor entre R$1 e R$999.');
        return;
      }

      // Pergunta de confirmação
      const confirmationOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: `Confirmar recargar de R$${valorInput.toFixed(2)}`, callback_data: `confirmar_pix_${valorInput}` }],
            [{ text: 'Cancelar', callback_data: 'voltar' }],
          ],
        },
      };
      messageCtx.reply(`Você escolheu R$${valorInput.toFixed(2)}. Confirme o valor para gerar o link de pagamento:`, confirmationOptions);
    });
  } else if (callbackData.startsWith('confirmar_pix_')) {
    const rechargeAmount = parseFloat(callbackData.split('_')[2]);

    // Fazer a requisição para o OpenPix para gerar o link de pagamento
    const response = await fetch('https://api.openpix.com.br/api/v1/charge?return_existing=true', {
      method: 'POST',
      headers: {
        'Authorization': `${process.env.OPENPIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: `${userId}-${randomUUID()}`,
        value: rechargeAmount * 100,
        comment: '@NEXTRECARGAS - ADIÇÃO DE SALDOS!',
        additionalInfo: [
          { key: 'UserID', value: userId },
          { key: 'Product', value: 'Saldo' },
          { key: 'Invoice', value: `${new Date().getTime()}` }
        ],
        payer: {
          name: `telegram - ${userId}`,
          email: '',
          phone: '',
          correlationID: userId
        }
      }),
    });

    const data = await response.json();

    ctx.reply(
      `💳 Aqui está o link para recarregar R$${rechargeAmount.toFixed(2)} em seu saldo:\n\n${data.charge.paymentLinkUrl}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Clique aqui para pagar', url: data.charge.paymentLinkUrl }]
          ]
        }
      }
    );
  } else if (callbackData === 'voltar') {
    sendActionButtonsInline(ctx); 
  } else if (callbackData === 'perfil') {
    // Recuperar os dados do usuário do Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, saldo, saldo_indicacao, historico_produtos, username')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      ctx.editMessageText("Desculpe, houve um erro ao buscar suas informações de perfil.");
      return;
    }

    // Desestruturar dados do usuário
    const { saldo = 0.00, saldo_indicacao = 0.00, historico_produtos, username } = data;

    // Calcular o total de contas adquiridas e o valor total gasto
    const totalCompras = historico_produtos.length||0;
    const totalGasto = historico_produtos.reduce((total, produto) => total + parseFloat(produto.value), 0);

    // Criar lista de compras
    const comprasList = historico_produtos.map(produto => `🔹 ${produto.key} | R$${produto.value} | ${produto.data_compra}`).join('\n') || 'Nenhuma compra realizada ainda.';

    // Mensagem personalizada com a ficha do usuário
    const message = `
💟 Bem-vindo(a) à Recarga Next! 💟  
✨ A melhor loja de streaming do Telegram! ✨

🧾 Sua Ficha de Usuário:
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🛍 Compras
🛒 Total de Contas adquiridas: ${totalCompras}
💠 Total em depósitos: R$${totalGasto}

🛍 Histórico de Compras
${comprasList}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!
    `;

    // Enviar mensagem com as informações do perfil
    ctx.editMessageText(message);

    // Enviar os botões de navegação
    sendActionButtonsInline(ctx);
  }
});

// Bot está em execução
bot.launch().then(() => {
  console.log('Bot está em execução...');
});