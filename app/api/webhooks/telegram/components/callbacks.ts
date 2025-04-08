import { bot, supabase } from "./config";
import { randomUUID } from "crypto";
import {
  handleListarProdutos,
  handleConfirmarProduto,
  handleComprarProduto,
} from "./product-callbacks";
import { handleListarCombos, handleComprarCombo } from "./combo-callbacks";
import {
  handleSaldo,
  handleGerarPix,
  handleConfirmarPix,
} from "./payment-callbacks";
import { handlePerfil } from "./profile-callbacks";
import {
  handleConfirmarCompra,
  handleConfirmarCompraCombo,
} from "./purchase-callbacks";
import { logMessage } from "./cleanup";

// Wrapper para registrar mensagens enviadas por ctx.reply
async function replyWithLog(ctx: any, text: string, options?: any) {
  const result = await ctx.reply(text, options);
  if (result && result.message_id) {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id.toString();
    logMessage(userId, result.message_id, chatId);
  }
  return result;
}

// Wrapper para registrar mensagens enviadas por ctx.editMessageText
async function editMessageTextWithLog(ctx: any, text: string, options?: any) {
  const result = await ctx.editMessageText(text, options);
  // Não precisamos registrar edições, pois o ID da mensagem permanece o mesmo
  return result;
}

// Wrapper para registrar mensagens enviadas por ctx.replyWithPhoto
async function replyWithPhotoWithLog(ctx: any, photo: any, options?: any) {
  const result = await ctx.replyWithPhoto(photo, options);
  if (result && result.message_id) {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id.toString();
    logMessage(userId, result.message_id, chatId);
  }
  return result;
}

// Função para lidar com o callback bemvindos
async function handleBemVindos(ctx: any) {
  const userId = ctx.from.id;
  const username = ctx.from.first_name;

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
      return replyWithLog(
        ctx,
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

  return editMessageTextWithLog(ctx, message, {
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

// Função para lidar com o callback bemvindos-2
async function handleBemVindos2(ctx: any) {
  const userId = ctx.from.id;
  const username = ctx.from.first_name;

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
      return replyWithLog(
        ctx,
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

  return replyWithLog(ctx, message, {
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

// Função para lidar com o callback de produtos premium
async function handlePremium(ctx: any) {
  const mensagem = `
🛍️ Escolha o que você deseja comprar no momento:

🎁 Produtos

🎉 Combos

Estamos aqui para ajudar você a encontrar a melhor opção para suas necessidades! 😊
`;
  await ctx.deleteMessage();
  const imageUrl = "https://www.n8nworks.shop/banner.jpeg";
  return replyWithPhotoWithLog(ctx, imageUrl, {
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
}

// Função principal para setup dos callbacks
export function setupCallbacks() {
  bot.on("callback_query", async (ctx) => {
    if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
      const callbackData = ctx.callbackQuery.data;

      // Seleção de callbacks baseados nos dados
      if (callbackData === "bemvindos") {
        await handleBemVindos(ctx);
      } else if (callbackData === "bemvindos-2") {
        await handleBemVindos2(ctx);
      } else if (callbackData === "premium") {
        await handlePremium(ctx);
      } else if (callbackData === "produtos") {
        await handleListarProdutos(ctx);
      } else if (callbackData.startsWith("confirma_produto_")) {
        const produtoNome = callbackData.replace("confirma_produto_", "");
        await handleConfirmarProduto(ctx, produtoNome);
      } else if (callbackData.startsWith("comprar_")) {
        const produtoId = callbackData.split("_")[1];
        await handleComprarProduto(ctx, produtoId);
      } else if (callbackData === "combos") {
        await handleListarCombos(ctx);
      } else if (callbackData.startsWith("2comprar_")) {
        const produtoId = callbackData.split("_")[1];
        await handleComprarCombo(ctx, produtoId);
      } else if (callbackData.startsWith("confirmar_compra_")) {
        const produtoId = callbackData.replace("confirmar_compra_", "");
        await handleConfirmarCompra(ctx, produtoId);
      } else if (callbackData.startsWith("2confirmar_compra_")) {
        const produtoId = callbackData.replace("2confirmar_compra_", "");
        await handleConfirmarCompraCombo(ctx, produtoId);
      } else if (callbackData === "saldo") {
        await handleSaldo(ctx);
      } else if (callbackData === "gerar_pix") {
        await handleGerarPix(ctx);
      } else if (callbackData.startsWith("confirmar_pix_")) {
        const rechargeAmount = parseFloat(callbackData.split("_")[2]);
        await handleConfirmarPix(ctx, rechargeAmount);
      } else if (callbackData === "perfil") {
        await handlePerfil(ctx);
      }
    } else {
      console.error("CallbackQuery sem dados ou tipo inválido");
    }
  });
}

// Exportando as funções wrapper para uso em outros módulos
export { replyWithLog, editMessageTextWithLog, replyWithPhotoWithLog };
