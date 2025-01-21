require('dotenv').config();  // Carregar variáveis de ambiente do .env
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Inicializando o Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Inicializando o Bot do Telegram
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Função para enviar os botões embutidos
const sendActionButtonsInline = (chatId) => {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💎 Contas Premium', callback_data: 'premium' },
        ],
        [
          { text: '💰 Saldo', callback_data: 'saldo' },
          { text: '👤 Perfil', callback_data: 'perfil' },
        ],
        [
           { text: '🛠️ Suporte', callback_data: 'suporte' },
        ],
      ],
    },
  };
  bot.telegram.sendMessage(chatId, 'Escolha uma opção:', options);
};

// Bot começa
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.from.username || 'None'; // Usar "None" se não houver username
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
  const { saldo = 0.00, saldo_indicacao = 0.00 } = data || {};

  const message = `
💟 Bem-vindo(a) à Recarga Next! 💟
✨ A melhor loja de streaming do Telegram! ✨

🧾 Sua Ficha de Usuário:
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo.toFixed(2)}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao.toFixed(2)}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!
`;

  // Enviar mensagem de boas-vindas com a ficha do usuário
  ctx.reply(message);

  // Enviar os botões inline de ação
  sendActionButtonsInline(chatId);
});

bot.on('callback_query', async (ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const callbackData = ctx.callbackQuery.data;  // Aqui é onde callbackData é definida

  if (callbackData === 'premium') {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Canal de Filmes HD (R$29,90)', callback_data: 'filme_hd' }],
          [{ text: 'Canal de Séries Exclusivas (R$39,90)', callback_data: 'serie_exclusiva' }],
          [{ text: 'Canal de Música Sem Limite (R$19,90)', callback_data: 'musica_ilimitada' }],
          [{ text: 'Canal de Anime Premium (R$24,90)', callback_data: 'anime_premium' }],
        ],
      },
    };
    ctx.reply('💎 Escolha um canal premium:', options);
  } else if (callbackData === 'saldo') {
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
    sendActionButtonsInline(chatId);  // ⬅ Voltar para o menu principal
  } else if (callbackData === 'perfil') {
    // Recuperar os dados do usuário do Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, saldo, saldo_indicacao, historico_produtos, username')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      ctx.reply("Desculpe, houve um erro ao buscar suas informações de perfil.");
      return;
    }

    // Desestruturar dados do usuário
    const { saldo = 0.00, saldo_indicacao = 0.00, historico_produtos, username } = data;

    // Calcular o total de contas adquiridas e o valor total gasto
    const totalCompras = historico_produtos.length;
    const totalGasto = historico_produtos.reduce((total, produto) => total + parseFloat(produto.value), 0);

    // Criar lista de compras
    const comprasList = historico_produtos.map(produto => `🔹 ${produto.key} | R$${produto.value} | ${produto.data_compra}`).join('\n') || 'Nenhuma compra realizada ainda.';

    // Mensagem personalizada com a ficha do usuário
    const message = `
💟 **Bem-vindo(a) à Recarga Next!** 💟  
✨ A melhor loja de streaming do Telegram! ✨

🧾 **Sua Ficha de Usuário:**
├ 👤 Username: @${username}
├ 🆔 ID do usuário: ${userId}
├ 💵 Saldo disponível: R$${saldo.toFixed(2)}
└ 🔘 Saldo de Indicação: R$${saldo_indicacao.toFixed(2)}

🛍 **Compras**
🛒 Total de Contas adquiridas: ${totalCompras}
💠 Total em depósitos: R$${totalGasto.toFixed(2)}

🛍 **Histórico de Compras**
${comprasList}

🎉 **Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!**
    `;

    // Enviar mensagem com as informações do perfil
    ctx.reply(message);

    // Enviar os botões de navegação
    sendActionButtonsInline(chatId);
}})

   


// Bot está em execução
bot.launch().then(() => {
  console.log('Bot está em execução...');
});
