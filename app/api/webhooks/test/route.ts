import axios, { AxiosRequestConfig } from "axios"
import { createClient } from '@supabase/supabase-js';
require('dotenv').config(); // Carregar variáveis de ambiente

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function GET(req:any) {
    const message =
        `Olá, *teste*!\nSua assinatura no *StrikeLead* foi ativada! 🎉\n\n` +
        `Agora você tem acesso completo à plataforma.\n\n` +
        `Atenciosamente,\nEquipe *StrikeLead*`

        await sendWhatsappNotification({
          message,
          phone:"5534984443047",
        })
}

const sendWhatsappNotification = async (
  {
    message,
    phone
  }: {
    phone: string
    message: string
  }
) => {
try {
  const config: AxiosRequestConfig = {
    method: 'post',
    url: `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_ID}`,
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EVOLUTION_API_KEY,
    },
  }

  const response = await axios({
    ...config,
    data: JSON.stringify({
      delay: 120,
      number: phone,
      text: message,
      linkPreview: false,
    })
  })

  return response
} catch (error:any) {
  console.log(error)
  return null
}
}