"use server";

import { supabase } from "@/app/utils/supabase-client";

export async function POST(req: Request) {
  try {
    // Pegar os dados da requisição
    const data = await req.json();
    console.log("Webhook PIX recebido:", JSON.stringify(data, null, 2));

    // Verificar se é um evento de teste
    if (data?.event === "teste_webhook") {
      console.log("Evento de teste recebido com sucesso.");
      return new Response(
        JSON.stringify({ message: "Evento de teste recebido com sucesso." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se é um evento de pagamento concluído
    if (data?.event === "OPENPIX:CHARGE_COMPLETED" && data?.charge) {
      const { correlationID } = data.charge;

      if (!correlationID) {
        console.error("correlationID não encontrado no webhook");
        return new Response(
          JSON.stringify({ error: "correlationID não encontrado" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Atualizar o status da venda no banco de dados
      if (supabase) {
        try {
          const { error } = await supabase
            .from("vendas")
            .update({ status: "concluida" })
            .eq("correlation_id", correlationID);

          if (error) {
            console.error("Erro ao atualizar status da venda:", error);
            return new Response(
              JSON.stringify({
                error: "Erro ao atualizar status da venda",
                details: error.message,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          console.log(
            `Status da venda atualizado com sucesso para ${correlationID}`
          );
          return new Response(
            JSON.stringify({
              message: "Status da venda atualizado com sucesso.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error: any) {
          console.error("Erro ao processar webhook:", error);
          return new Response(
            JSON.stringify({
              error: "Erro ao processar webhook",
              details: error.message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else {
        console.warn(
          "Cliente Supabase não disponível, não foi possível atualizar a venda"
        );
        return new Response(
          JSON.stringify({
            warning: "Cliente Supabase não disponível",
            message: "Recebido, mas não processado completamente",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Se não for um evento suportado
    return new Response(JSON.stringify({ message: "Evento não suportado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao processar webhook",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
