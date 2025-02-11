
import { ButtonsProps } from '@/app/(dashboard)/disparo/page';
import { Telegraf } from 'telegraf';

// Crie uma instância do Telegraf com o token do seu bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const sendMessageToUser = async (
  userId: string,
  message: string,
  buttons: ButtonsProps[],
  image: any
) => {
  try {
    // Cria o teclado inline com os botões
    const inlineKeyboard = buttons.map((button) => [
      {
        text: button.name,
        ...(button.type === "link" ? { url: button.command } : { callback_data: button.command }),
      },
    ]);

    // Verifica se a imagem foi fornecida
    if (image) {
      // Envia uma foto com o texto de mensagem como legenda
      await bot.telegram.sendPhoto(userId, image, {
        caption: message, // A legenda é a mensagem que será enviada
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
      console.log(`Mensagem com foto enviada para o ID: ${userId}`);
    } else {
      // Envia apenas a mensagem, caso não haja imagem
      await bot.telegram.sendMessage(userId, message, {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
      console.log(`Mensagem enviada para o ID: ${userId}`);
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw new Error('Erro ao enviar mensagem');
  }
};

// Função para lidar com a requisição POST
export async function POST(request: any) {
  try {
    // Obtém o body da requisição
    const { userId, message, button,image } = await request.json();

    if (!userId || !message) {
      return new Response('ID do usuário e mensagem são obrigatórios', {
        status: 400,
      });
    }

    // Chama a função para enviar a mensagem
    await sendMessageToUser(userId, message, button, image);

    return new Response('Mensagem enviada com sucesso', { status: 200 });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
