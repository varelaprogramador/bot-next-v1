import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "@supabase/supabase-js";
import { instanceManager } from "./instance-manager";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

interface SendMessageParams {
  phone: string;
  message: string;
}
// No seu endpoint evo
const defaultInstance = await instanceManager.getDefaultInstance();
// Use o defaultInstance.instance_id para fazer a chamada para o Evolution API
export const evolutionApi = {
  sendMessage: async ({ phone, message }: SendMessageParams) => {
    try {
      const config: AxiosRequestConfig = {
        method: "post",
        url: `${process.env.EVOLUTION_API_URL}/message/sendText/${defaultInstance.instance_id}`,
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
      };

      const response = await axios({
        ...config,
        data: JSON.stringify({
          delay: 500,
          number: phone,
          text: message,
          linkPreview: true,
        }),
      });

      await supabase.from("whatsapp_logs").insert({
        phone,
        message,
        status: "success",
        metadata: response.data,
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao enviar mensagem via WhatsApp:", error);

      await supabase.from("whatsapp_logs").insert({
        phone,
        message,
        status: "error",
        error_message: (error as any).message,
        metadata: error,
      });

      throw error;
    }
  },
};
