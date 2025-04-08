"use server";

import { supabase } from "@/app/utils/supabase-client";

export async function POST(req: Request) {
  try {
    // Pegando os dados do request
    const body = await req.json();

    if (!body.correlationID) {
      return new Response(
        JSON.stringify({ error: "correlationID não fornecido" }),
        {
          status: 400,
        }
      );
    }

    // Definir variável para armazenar dados da venda
    let vendaData = null;

    // 1. Verificar no banco de dados primeiro (mais rápido) se o Supabase estiver disponível
    if (supabase) {
      try {
        const { data, error: vendaError } = await supabase
          .from("vendas")
          .select("*")
          .eq("correlation_id", body.correlationID)
          .single();

        if (!vendaError) {
          vendaData = data;

          // Se encontrou a venda e está concluída
          if (vendaData && vendaData.status === "concluida") {
            return new Response(
              JSON.stringify({
                status: "concluida",
                message: "Pagamento concluído com sucesso",
              }),
              {
                status: 200,
              }
            );
          }
        }
      } catch (supabaseError) {
        console.error("Erro ao acessar o Supabase:", supabaseError);
        // Continuar com a verificação no OpenPix
      }
    }

    // 2. Verificar no OpenPix
    try {
      const openPixResponse = await fetch(
        `https://api.openpix.com.br/api/v1/charge?correlationID=${encodeURIComponent(
          body.correlationID
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `${process.env.OPENPIX_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Se o OpenPix responder com sucesso
      if (openPixResponse.ok) {
        const openPixData = await openPixResponse.json();

        // Verificar se existe pelo menos uma cobrança na resposta
        if (openPixData.charges && openPixData.charges.length > 0) {
          const charge = openPixData.charges[0];

          // Se o pagamento foi concluído no OpenPix
          if (charge.status === "COMPLETED") {
            // Atualizar o status na base de dados se a venda existir e o Supabase estiver disponível
            if (vendaData && supabase) {
              try {
                const { error: updateError } = await supabase
                  .from("vendas")
                  .update({ status: "concluida" })
                  .eq("correlation_id", body.correlationID);

                if (updateError) {
                  console.error(
                    "Erro ao atualizar status da venda:",
                    updateError
                  );
                }
              } catch (supabaseError) {
                console.error(
                  "Erro ao atualizar venda no Supabase:",
                  supabaseError
                );
              }
            }

            return new Response(
              JSON.stringify({
                status: "COMPLETED",
                message: "Pagamento concluído com sucesso",
              }),
              {
                status: 200,
              }
            );
          }

          // Se o pagamento ainda está pendente
          return new Response(
            JSON.stringify({
              status: charge.status,
              message: "Pagamento pendente",
            }),
            {
              status: 200,
            }
          );
        }
      }
    } catch (openPixError) {
      console.error("Erro ao verificar no OpenPix:", openPixError);
    }

    // 3. Se não encontrou no OpenPix ou houve erro, retornar o status do banco de dados (ou pendente)
    return new Response(
      JSON.stringify({
        status: vendaData?.status || "pendente",
        message: "Pagamento pendente",
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao processar a requisição",
        status: "ERROR",
      }),
      { status: 500 }
    );
  }
}
