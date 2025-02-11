import { Telegraf } from 'telegraf';

// Crie uma instância do Telegraf com o token do seu bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Função para enviar a mensagem
const sendMessageToUser = async (userId:string, message:string) => {
  try {
    // Envia a mensagem para o ID do usuário
    await bot.telegram.sendMessage(userId, message);
    console.log(`Mensagem enviada para o ID: ${userId}`);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw new Error('Erro ao enviar mensagem');
  }
};

export async function POST(request:any) {
  try {
   
    // Obtém o body da requisição
    const { userId, message } = await request.json();

    if (!userId || !message) {
      return new Response('ID do usuário e mensagem são obrigatórios', {
        status: 400,
      });
    }

    // Chama a função para enviar a mensagem
    await sendMessageToUser(userId, message);

    return new Response('Mensagem enviada com sucesso', { status: 200 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
