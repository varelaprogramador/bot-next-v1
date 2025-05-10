// pages/api/webhooks/telegram/route.ts

import { Telegraf } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { telegramUsage } from "@/app/utils/telegram-usage";

interface Codigos {
  id_codigo: string; // UUID
  id_produto?: string; // Texto
  codigo?: string; // Texto
  status?: string; // Texto
}

// Interface para a tabela combos
interface Combos {
  id: string; // UUID
  nome?: string; // Texto
  descricao?: string; // Texto
  valor?: number; // Numérico
  produtos?: object; // JSON
  created_at: string; // Timestamp com fuso horário
  status?: string; // Texto
}

// Interface para a tabela produtos
interface Produtos {
  id: string; // UUID
  nome?: string; // Texto
  valor?: number; // Numérico
  created_at: string; // Timestamp com fuso horário
  categoria?: string; // Texto
  descricao?: string; // Texto
}

// Interface para a tabela users
interface Users {
  id: number; // Serial
  user_id?: string; // Texto
  username?: string; // Texto
  saldo?: number; // Numérico
  saldo_indicacao?: number; // Numérico
  created_at?: string; // Timestamp sem fuso horário
  historico_produtos?: object; // JSON
  historico_de_depositos?: object; // JSON
}

// Interface para a tabela vendas
interface Vendas {
  uuid: string; // UUID
  id_cliente?: string; // Texto
  valor?: number; // Numérico
  status?: string; // Texto
  created_at: string; // Timestamp com fuso horário
  id_produto?: string; // Texto
  tipo_pagamento?: string; // Texto
}

interface MessageButton {
  name: string;
  type: string;
  command: string;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  buttons?: MessageButton[];
  image?: string;
  created_at: string;
  status: 'sent' | 'failed' | 'received';
  error?: string;
  chat_type?: string;
  chat_id?: string;
  username?: string;
}

// Inicializando o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Inicializando o Bot do Telegram
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Configurar a resposta para o método GET
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (userId) {
      const messages = await getUserMessages(userId, limit);
      return new NextResponse(
        JSON.stringify({ messages }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: "Webhook configurado corretamente!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no GET:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Função para enviar mensagem para o usuário
async function sendMessageToUser(
  userId: string,
  message: string,
  buttons: MessageButton[] = [],
  image?: string
) {
  try {
    // Verifica o limite de uso
    const { canSend, remaining } = await telegramUsage.checkAndUpdateUsage(userId);

    if (!canSend) {
      throw new Error(`Limite diário de mensagens atingido. Tente novamente amanhã.`);
    }

    // Create inline keyboard with buttons
    const inlineKeyboard = buttons.map((button) => [
      {
        text: button.name,
        ...(button.type === "link"
          ? { url: button.command }
          : { callback_data: button.command }),
      },
    ]);

    // Common options for both message types
    const options = {
      reply_markup:
        inlineKeyboard.length > 0
          ? { inline_keyboard: inlineKeyboard }
          : undefined,
      parse_mode: "HTML" as const,
    };

    let result;

    // Send message with image if provided
    if (image) {
      result = await bot.telegram.sendPhoto(userId, image, {
        caption: message,
        ...options,
      });
      console.log(`Message with photo sent to user ID: ${userId}`);
    } else {
      // Send text-only message
      result = await bot.telegram.sendMessage(userId, message, options);
      console.log(`Text message sent to user ID: ${userId}`);
    }

    // Incrementa o contador de uso
    await telegramUsage.incrementUsage(userId);

    // Salvar mensagem no Supabase
    await saveMessage({
      user_id: userId,
      message,
      buttons,
      image,
      status: 'sent'
    });

    return { success: true, messageId: result.message_id, remaining };
  } catch (error: any) {
    console.error(`Error sending message to user ${userId}:`, error.message);

    // Salvar mensagem com erro no Supabase
    await saveMessage({
      user_id: userId,
      message,
      buttons,
      image,
      status: 'failed',
      error: error.message
    });

    // Return detailed error information
    return {
      success: false,
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
      description: error.description || "An unknown error occurred",
    };
  }
}

// Função para salvar mensagem no Supabase
async function saveMessage(message: Omit<Message, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...message,
        id: randomUUID(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar mensagem:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    return null;
  }
}

// Função para buscar mensagens do usuário
async function getUserMessages(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return [];
  }
}

// Função para limpar mensagens do usuário
async function clearUserMessages(userId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao limpar mensagens:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar mensagens:', error);
    return false;
  }
}

// Método POST para receber as atualizações do Telegram
export async function POST(req: Request) {
  try {
    const data = await req.json(); // Receber a atualização do Telegram

    // Salvar mensagem no Supabase se for uma mensagem válida
    if (data.message?.from?.id && data.message?.chat?.type && data.message?.chat?.type !== "supergroup") {
      const messageData: Omit<Message, 'id' | 'created_at'> = {
        user_id: data.message.from.id.toString(),
        message: data.message.text || '',
        chat_type: data.message.chat.type,
        chat_id: data.message.chat.id.toString(),
        username: data.message.from.username || data.message.from.first_name,
        status: 'received' as const
      };

      await saveMessage(messageData);
      console.log("Mensagem salva:", messageData);
    }

    if (data.disparo) {
      const { userId, message, button, image } = data;
      await sendMessageToUser(userId, message, button, image);

      return new NextResponse(
        JSON.stringify({
          message: "Webhook POST disparo processado com sucesso!",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Passar a atualização para o Telegraf processar
    await bot.handleUpdate(data);

    return new NextResponse(
      JSON.stringify({ message: "Webhook POST processado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no POST:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Método DELETE para limpar mensagens
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "ID do usuário não fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = await clearUserMessages(userId);

    if (success) {
      return new NextResponse(
        JSON.stringify({ message: "Mensagens limpas com sucesso" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Erro ao limpar mensagens" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro no DELETE:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Configurar comandos do bot
bot.command("start", async (ctx) => {
  ctx.reply("✨ Olá, seja Bem vindo ao canal de vendas da next recargas! ✨", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Iniciar atendimento`,
            callback_data: `bemvindos`,
          },
        ],
      ],
    },
  });
});

// Configurar handlers de callback_query
bot.on("callback_query", async (ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat?.id;
  const username = ctx.from.first_name;

  if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
    const callbackData = ctx.callbackQuery.data;
    if (callbackData === "bemvindos") {
      // Verificar se o usuário já existe no banco de dados
      const { data, error } = await supabase
        .from("users")
        .select("id, saldo, saldo_indicacao")
        .eq("user_id", userId)
        .single();

      // Se o usuário não existir, criar um novo
      if (error || !data) {
        const { data: insertedData, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              user_id: userId,
              username: username,
              saldo: 0.0,
              saldo_indicacao: 0.0,
            },
          ])
          .single();

        if (insertError) {
          console.error("Erro ao inserir usuário no Supabase:", insertError);
          return ctx.reply(
            "Desculpe, houve um erro ao registrar suas informações."
          );
        }
      }

      // Mensagem com a ficha do usuário
      const { saldo, saldo_indicacao } = data || {};

      const message = `💟 Bem-vindo(a) à Recarga Next! 💟
✨ A melhor loja de streaming do Telegram! ✨

 🧾 Sua Ficha de Usuário:
 ├ 👤 Username: @${username}
 ├ 🆔 ID do usuário: ${userId}
 ├ 💵 Saldo disponível: R$${saldo.toFixed(2)}
 └ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!`;

      ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "💎 Contas Premium", callback_data: "premium" }],
            [
              { text: "💰 Saldo", callback_data: "saldo" },
              { text: "👤 Perfil", callback_data: "perfil" },
            ],
            [{ text: "🛠️ Suporte", url: "https://t.me/nextrecarga" }],
          ],
        },
      });
    }
    if (callbackData === "bemvindos-2") {
      await ctx.deleteMessage();
      // Verificar se o usuário já existe no banco de dados
      const { data, error } = await supabase
        .from("users")
        .select("id, saldo, saldo_indicacao")
        .eq("user_id", userId)
        .single();

      // Se o usuário não existir, criar um novo
      if (error || !data) {
        const { data: insertedData, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              user_id: userId,
              username: username,
              saldo: 0.0,
              saldo_indicacao: 0.0,
            },
          ])
          .single();

        if (insertError) {
          console.error("Erro ao inserir usuário no Supabase:", insertError);
          return ctx.reply(
            "Desculpe, houve um erro ao registrar suas informações."
          );
        }
      }

      // Mensagem com a ficha do usuário
      const { saldo, saldo_indicacao } = data || {};

      const message = `💟 Bem-vindo(a) à Recarga Next! 💟
✨ A melhor loja de streaming do Telegram! ✨

 🧾 Sua Ficha de Usuário:
 ├ 👤 Username: @${username}
 ├ 🆔 ID do usuário: ${userId}
 ├ 💵 Saldo disponível: R$${saldo.toFixed(2)}
 └ 🔘 Saldo de Indicação: R$${saldo_indicacao}

🎉 Explore nossas opções premium e aproveite o melhor do entretenimento com facilidade e segurança!`;

      ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "💎 Contas Premium", callback_data: "premium" }],
            [
              { text: "💰 Saldo", callback_data: "saldo" },
              { text: "👤 Perfil", callback_data: "perfil" },
            ],
            [{ text: "🛠️ Suporte", url: "https://t.me/nextrecarga" }],
          ],
        },
      });
    } else if (callbackData === "premium") {
      const mensagem = `
    🛍️ Escolha o que você deseja comprar no momento:
    
   🎁 Produtos

   🎉 Combos
   
   Estamos aqui para ajudar você a encontrar a melhor opção para suas necessidades! 😊
    `;
      await ctx.deleteMessage();
      const imageUrl = "https://nextgiftcards.com/banner.jpeg";
      ctx.replyWithPhoto(imageUrl, {
        caption: mensagem,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Ver produtos |PREMIUM|",
                callback_data: "produtos",
              },
            ],
            [
              {
                text: "Ver combos |PREMIUM|",
                callback_data: "combos",
              },
            ],
            [{ text: "⬅ Voltar", callback_data: "bemvindos-2" }],
          ],
        },
      });
    } else if (callbackData === "produtos") {
      // Obter produtos do Supabase
      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("*"); // Busca todas as colunas

      console.log("ETAPA ", produtos);
      if (error) {
        ctx.reply(
          "❌ Não foi possível carregar os produtos. Tente novamente mais tarde."
        );
        return;
      }

      const produtosUnique = produtos.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.nome === item.nome)
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
      await ctx.reply(mensagem, {
        reply_markup: {
          inline_keyboard: [
            ...options(), // Espalha os arrays gerados pela função options
            [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
          ],
        },
      });
    } else if (callbackData.startsWith("confirma_produto_")) {
      const produtoNome = callbackData.replace("confirma_produto_", "");

      // Obter produtos do Supabase
      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("nome", produtoNome);

      console.log("ETAPA ", produtos);
      if (error) {
        ctx.editMessageText(
          "❌ Não foi possível carregar os produtos. Tente novamente mais tarde."
        );
        return;
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

      await ctx.editMessageText(mensagem, {
        reply_markup: {
          inline_keyboard: [
            ...options(), // Espalha os arrays gerados pela função options
            [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
          ],
        },
      });
    } else if (callbackData === "combos") {
      const { data: combos, error } = await supabase.from("combos").select("*"); // Busca todas as colunas

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

      {
        /*const mensagem = `🎖️ PERFIL | PREMIUM 🎖️\n${produtos.length > 0
        ? combos
          .map((combo) => {
            return `🔹 ${combo.nome} \n${combo.produtos.length > 0
              ? combo.produtos
                .map((item: { nome: any; descricao: any; }) => (item.nome ? ` 🔸 ${item.nome} \n ${item.descricao}\n` : "❌ Produto sem nome"))
                .join("\n")
              : "❌ Nenhum produto disponível."}`;
          })
          .join("\n\n")
        : "❌ Nenhum combo disponível."}
    
    =====================
    
    🏷️ Garantia Total:
    
    Confiamos na qualidade dos nossos serviços e oferecemos garantia em todos eles.
    
    💎 Experiência Premium, feita para você!`;*/
      }
      const mensagem = "Escolha um dos combos acima:";
      const imageUrl = "https://nextgiftcards.com/banner.jpeg";
      await ctx.deleteMessage();
      ctx.replyWithPhoto(imageUrl, {
        caption: mensagem,
        ...options,
      });
    } else if (callbackData.startsWith("comprar_")) {
      const produtoId = callbackData.split("_")[1];
      console.log(produtoId);

      // Obter detalhes do produto
      const { data: produto, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoId)
        .single(); // Adicionando .single() para garantir que apenas um produto seja retornado

      if (error || !produto) {
        ctx.editMessageText(
          "❌ Não foi possível encontrar o produto. Tente novamente mais tarde."
        );
        return;
      }
      console.log(produto);

      // Verificar se há códigos disponíveis para o produto
      const { data: codigos, error: codigosError } = await supabase
        .from("codigos")
        .select("*")
        .eq("id_produto", produtoId);

      // Verificar se há códigos disponíveis e se estão ativos
      if (codigosError) {
        ctx.editMessageText(
          "❌ Não foi possível verificar a disponibilidade de códigos. Tente novamente mais tarde."
        );
        return;
      }

      // Filtrar códigos ativos
      const codigosAtivos = codigos.filter(
        (codigo) => codigo.status.toLowerCase() === "ativo"
      );

      if (codigosAtivos.length <= 0) {
        ctx.editMessageText(
          "❌ Não há códigos ativos disponíveis para este produto no momento. Tente novamente mais tarde."
        );
        return;
      }

      // Recuperar informações do usuário no Supabase
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("saldo")
        .eq("user_id", userId)
        .single();

      if (userError || !userData) {
        ctx.editMessageText(
          "❌ Não foi possível recuperar suas informações. Tente novamente mais tarde."
        );
        return;
      }

      const saldoAtual = userData.saldo;
      const valorProduto = produto.valor;

      if (saldoAtual < valorProduto) {
        ctx.editMessageText(
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
                callback_data: `confirmar_compra_${produtoId}`,
              },
            ],
            [{ text: "⬅ Voltar", callback_data: "bemvindos" }],
          ],
        },
      };

      ctx.editMessageText(
        `🛒 Você está prestes a adquirir o produto:\n\n` +
        `🔹 ${produto.nome}\n\n` + // Corrigido para exibir o nome do produto
        `💵 Preço: R$${valorProduto.toFixed(2)}\n` +
        `💰 Saldo atual: R$${saldoAtual.toFixed(2)}\n\n` +
        `Deseja confirmar a compra?`,
        confirmacaoOptions
      );
    } else if (callbackData.startsWith("2comprar_")) {
      ctx.deleteMessage();
      const produtoId = callbackData.split("_")[1];
      console.log(produtoId);

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
    } else if (callbackData.startsWith("confirmar_compra_")) {
      const produtoId = callbackData.replace("confirmar_compra_", "");

      // Recuperar o produto
      const { data: produto, error: produtoError } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoId)
        .single();

      if (produtoError || !produto) {
        await ctx.editMessageText(
          "❌ Não foi possível encontrar o produto. Tente novamente mais tarde."
        );
        return;
      }

      const valorProduto = produto.valor;

      // Recuperar saldo do usuário
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("saldo")
        .eq("user_id", userId)
        .single();

      if (userError || !userData || userData.saldo < valorProduto) {
        await ctx.editMessageText(
          "❌ Saldo insuficiente ou erro ao validar a compra. Tente novamente."
        );
        return;
      }

      // Atualizar saldo no Supabase
      const novoSaldo = userData.saldo - valorProduto;
      const { error: updateError } = await supabase
        .from("users")
        .update({ saldo: novoSaldo })
        .eq("user_id", userId);

      if (updateError) {
        await ctx.editMessageText(
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
        return;
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
        await ctx.editMessageText(
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
        return;
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

      await ctx.editMessageText(
        `🎉 Compra realizada com sucesso!\n` +
        `🔹 Produto: ${produto.nome}\n` + // Corrigido para exibir o nome do produto
        `💵 Preço: R$${valorProduto}\n` +
        `💰 Saldo restante: R$${novoSaldo.toFixed(2)}\n\n` +
        `Aproveite seu novo produto!`
      );

      await ctx.reply(`
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
        `);
    } else if (callbackData.startsWith("2confirmar_compra_")) {
      const produtoId = callbackData.replace("2confirmar_compra_", "");

      // Obter detalhes do combo
      const { data: combo, error } = await supabase
        .from("combos")
        .select("*")
        .eq("id", produtoId)
        .single();

      if (error || !combo) {
        ctx.editMessageText(
          "❌ Não foi possível encontrar o combo. Tente novamente mais tarde."
        );
        return;
      }

      const valorProduto = combo.valor;

      // Recuperar saldo do usuário
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("saldo")
        .eq("user_id", userId)
        .single();

      if (userError || !userData || userData.saldo < valorProduto) {
        ctx.editMessageText(
          "❌ Saldo insuficiente ou erro ao validar a compra. Tente novamente."
        );
        return;
      }

      // Atualizar saldo no Supabase
      const novoSaldo = userData.saldo - valorProduto;
      const { error: updateError } = await supabase
        .from("users")
        .update({ saldo: novoSaldo })
        .eq("user_id", userId);

      if (updateError) {
        ctx.editMessageText(
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
        return;
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
          await ctx.editMessageText(
            `❌ O produto ${produto.nome} não possui códigos disponíveis. Tente novamente mais tarde.`
          );
          return;
        }

        // Filtrar códigos ativos antes de adicionar
        const codigosAtivosFiltrados = codigos.filter(
          (codigo) => codigo.status.toLowerCase() === "ativo"
        );

        if (codigosAtivosFiltrados.length === 0) {
          await ctx.editMessageText(
            `❌ O produto ${produto.nome}não possui códigos ativos disponíveis. Tente novamente mais tarde.`
          );
          return;
        }

        // Adiciona o primeiro código ativo à lista
        codigosAtivos.push(codigosAtivosFiltrados[0]);
      }

      // Se todos os códigos estão ativos, prosseguir com a compra
      ctx.editMessageText(
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
          return `📜 ${produto ? produto.nome : "Produto Desconhecido"}: ${codigo.codigo
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

      ctx.reply(`
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
    `);
      // Atualizar o status dos códigos resgatados
    } else if (callbackData === "saldo") {
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
    } else if (callbackData === "gerar_pix") {
      // Solicitar ao usuário que insira o valor para recarga
      ctx.editMessageText("Digite o valor da recarga (de R$1 a R$999):", {
        reply_markup: {
          inline_keyboard: [[{ text: "⬅ Voltar", callback_data: "bemvindos" }]],
        },
      });

      // Espera pelo texto da resposta
      bot.on("text", async (messageCtx) => {
        const valorInput = parseFloat(messageCtx.message.text);
        if (isNaN(valorInput) || valorInput < 1 || valorInput > 999) {
          messageCtx.reply(
            "⚠️ Valor inválido. Por favor, insira um valor entre R$1 e R$999."
          );
          return;
        }

        // Pergunta de confirmação
        const confirmationOptions = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Confirmar recargar de R$${valorInput.toFixed(2)}`,
                  callback_data: `confirmar_pix_${valorInput}`,
                },
              ],
              [{ text: "Cancelar", callback_data: "bemvindos" }],
            ],
          },
        };
        messageCtx.reply(
          `Você escolheu R$${valorInput.toFixed(
            2
          )}. Confirme o valor para gerar o link de pagamento:`,
          confirmationOptions
        );
      });
    } else if (callbackData.startsWith("confirmar_pix_")) {
      const rechargeAmount = parseFloat(callbackData.split("_")[2]);
      const id_transacao = randomUUID();
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
        id_cliente: userId, // Usando o user_id como id_cliente
        id_transacao: id_transacao,
        valor: rechargeAmount,
        status: "pendente", // Status da venda
        tipo_pagamento: "pix", // Tipo de pagamento
      };

      const { error: vendaError } = await supabase
        .from("vendas")
        .insert([novaVenda]);

      if (vendaError) {
        console.error("Erro ao inserir nova venda:", vendaError);
      }
    } else if (callbackData === "perfil") {
      // Recuperar os dados do usuário do Supabase
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, saldo, saldo_indicacao, historico_produtos,historico_deposito, username"
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
  } else {
    console.error("CallbackQuery sem dados ou tipo inválido");
  }
});
