require('dotenv').config();  // Carregar variáveis de ambiente do .env
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

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
          [{ text: 'Recarregar R$10', callback_data: 'recarregar_10' }],
          [{ text: 'Recarregar R$20', callback_data: 'recarregar_20' }],
          [{ text: 'Recarregar R$50', callback_data: 'recarregar_50' }],
        ],
      },
    };
    ctx.reply('💰 Escolha o valor para recarregar seu saldo:', options);
  } else if (callbackData.startsWith('recarregar_')) {
    
   let rechargeAmount = parseFloat(callbackData.slice(-2)); // Aqui funciona porque callbackData está no contexto correto
console.log(rechargeAmount);
    // Fazer a requisição para o OpenPix para gerar o link de pagamento
    const response = await fetch('https://api.openpix.com.br/api/v1/charge?return_existing=true', {
      method: 'POST',
      headers: {
        'Authorization': `${process.env.OPENPIX_API_KEY}`,  // Use a chave de API armazenada no .env
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: chatId+"000"+(new Date().getDate()),  // ID de correlação para rastrear a transação
        value: rechargeAmount * 100,  // O valor em centavos (OpenPix usa centavos)
        comment: '@NEXTRECARGAS - ADIÇÃO DE SALDOS!',
      }),
    });

    const data = await response.json();

    console.log(data)
    ctx.reply(
      `💳 Aqui está o link para recarregar R$${rechargeAmount.toFixed(2)} em seu saldo:\n\n${data.charge.paymentLinkUrl}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{
              text: 'Clique aqui para pagar',
              url: data.charge.paymentLinkUrl,
            }]
          ]
        }
      }
    );
    
    
   
   
  } else if (callbackData.startsWith('filme_') || callbackData.startsWith('serie_') || callbackData.startsWith('musica_') || callbackData.startsWith('anime_')) {
    const itemPrices = {
      filme_hd: 29.90,
      serie_exclusiva: 39.90,
      musica_ilimitada: 19.90,
      anime_premium: 24.90,
    };

    const itemName = {
      filme_hd: 'Canal de Filmes HD',
      serie_exclusiva: 'Canal de Séries Exclusivas',
      musica_ilimitada: 'Canal de Música Sem Limite',
      anime_premium: 'Canal de Anime Premium',
    };

    const price = itemPrices[callbackData];
    const name = itemName[callbackData];

    // Obter informações do usuário no banco de dados
    const { data: userData, error } = await supabase
      .from('users')
      .select('saldo')
      .eq('user_id', ctx.from.id)
      .single();

    if (error || !userData) {
      ctx.reply('Erro ao acessar seus dados. Tente novamente.');
      return;
    }

    if (userData.saldo >= price) {
      const newSaldo = parseFloat(userData.saldo) - price;

      // Atualizar o saldo no banco de dados
      const { error: updateError } = await supabase
        .from('users')
        .update({ saldo: newSaldo })
        .eq('user_id', ctx.from.id);

      if (updateError) {
        ctx.reply('Erro ao processar a compra. Tente novamente.');
      } else {
        ctx.reply(
          `✅ Compra realizada com sucesso!\n\n🎥 Você adquiriu: *${name}*.\n💵 Saldo restante: R$${newSaldo.toFixed(2)}.`,
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      ctx.reply(`❌ Saldo insuficiente para adquirir *${name}*.\n💵 Seu saldo: R$${userData.saldo.toFixed(2)}.\n\nRecarregue seu saldo para continuar.`);
    }
  }
});

// Removido o webhook e integração com OpenPix

bot.launch().then(() => {
  console.log('Bot está em execução...');
});
