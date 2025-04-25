import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "@supabase/supabase-js";

import { CodigosProps } from "@/app/utils/codigos";
require("dotenv").config(); // Carregar variáveis de ambiente

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(req: any) {
  try {
    console.log(await req.json()); // Corrigido para aguardar a promessa
    return new Response(JSON.stringify({ message: "GET request successful" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    // Caso ocorra algum erro
    console.error("Erro no GET:", error.message);
    return new Response(
      JSON.stringify({ message: "Error", error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function POST(req: any) {
  try {
    const data = await req.json(); // Corpo da requisição

    const isTestEvent = data?.event === "teste_webhook";

    if (isTestEvent) {
      console.log("Evento de teste recebido com sucesso.");

      return new Response(
        JSON.stringify({ message: "Evento de teste recebido com sucesso." }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { additionalInfo } = data?.charge;

    if (!additionalInfo) {
      console.log("Campos adicionais não encontrados");

      return new Response(
        JSON.stringify({ message: "Campos adicionais não encontrados" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const eventType = data?.event;
    const allowedEvents = [
      "OPENPIX:CHARGE_COMPLETED",
      "OPENPIX:TRANSACTION_RECEIVED",
    ];

    if (!allowedEvents.includes(eventType)) {
      console.log("Evento não permitido:", eventType);

      return new Response(JSON.stringify({ error: "Evento não permitido" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // console.log("Corpo da requisição:", JSON.stringify(data, null, 2)); // Log para verificar o corpo da requisição

    // Valida se o evento é o esperado
    if (
      data.event === "OPENPIX:CHARGE_COMPLETED" ||
      data.event === "OPENPIX:TRANSACTION_RECEIVED"
    ) {
      console.log("========Site=========");

      // console.log(data);

      const produtoId = additionalInfo?.find(
        (info: any) => info.key === "Product"
      )?.value;

      // Recuperar códigos do produto apenas se o status for "ativo"
      const { data: codigos, error: codigoError } = await supabase
        .from("codigos")
        .select("*")
        .eq("id_produto", produtoId);

      // Filtrar códigos ativos
      const defaultData = [
        {
          id_codigo: "",
          id_produto: "",
          codigo: "",
          status: "",
        },
      ];
      const codigosAtivos: CodigosProps[] =
        codigos?.filter((codigo) => codigo.status.toLowerCase() === "ativo") ||
        defaultData;

      if (codigoError || !codigosAtivos || codigosAtivos.length <= 0) {
        console.log(
          "❌ Não foi possível processar o código do produto. Solicite um chamado e envie o seu id."
        );
      }

      if (!codigosAtivos || codigosAtivos.length <= 0) {
        console.log("Nenhum código ativo encontrado");

        return new Response(
          JSON.stringify({ error: "Nenhum código ativo encontrado" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
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

      const name =
        additionalInfo.find((info: any) => info.key === "Nome")?.value ||
        "Cliente";
      const code = codigoData.codigo || "N/A";
      const phone = additionalInfo.find(
        (info: any) => info.key === "Telefone"
      )?.value;
      const produto = additionalInfo.find(
        (info: any) => info.key === "Product-Nome"
      )?.value;
      console.log("Nome:", name);
      console.log("Código:", code);
      console.log("Telefone:", phone);

      if (phone) {
        // const message =
        //   `Olá, *${name}*!\nSegue chave de ativação para *${produto}*  ||  *${code}* foi ativado! 🎉\n\n` +
        //   `Agora basta você resgatar.\n\n` +
        //   `Atenciosamente,\nEquipe *NEXTRECARGAS*`;

        // await sendWhatsappNotification({
        //   phone,
        //   message,
        // });
        const response = await fetch(
          "https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/107090/N0zmZuEk8fwK/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              phone: phone,
              codigo: code,
              produto: produto,
            }),
          }
        );
      }

      // Atualizar o status da venda existente
      const idTransacaoField = additionalInfo.find(
        (info: any) => info.key === "ID"
      );
      if (!idTransacaoField) {
        throw new Error(
          "ID da transação não encontrado nos campos adicionais."
        );
      }

      const id_transacao = idTransacaoField.value; // Obtém o ID da transação

      const { error: vendaUpdateError } = await supabase
        .from("vendas")
        .update({ status: "concluida", origin: "bot-conversa" }) // Atualiza o status da venda
        .eq("id_transacao", id_transacao); // Filtra pela ID da transação

      if (vendaUpdateError) {
        console.error(
          "Erro ao atualizar o status da venda:",
          vendaUpdateError.message
        );
        return new Response(
          JSON.stringify({
            message: "Erro ao atualizar o status da venda",
            error: vendaUpdateError.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      console.log("Status da venda atualizado com sucesso.");
      return new Response(
        JSON.stringify({
          message: "Saldo atualizado e status da venda atualizado com sucesso.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Resposta padrão caso nenhum dos eventos específicos seja processado
    return new Response(
      JSON.stringify({
        message: "Requisição processada, mas nenhuma ação específica tomada.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro no processamento do POST:", error);

    return new Response(
      JSON.stringify({ message: "Erro", error: (error as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
