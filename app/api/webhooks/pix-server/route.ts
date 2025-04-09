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

    const { additionalInfo } = data?.charge || {};

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
    const allowedEvents = ["OPENPIX:CHARGE_COMPLETED"];

    if (!allowedEvents.includes(eventType)) {
      console.log("Evento não permitido:", eventType);
      return new Response(JSON.stringify({ error: "Evento não permitido" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Valida se o evento é o esperado
    if (data.event !== "OPENPIX:CHARGE_COMPLETED") {
      return new Response(JSON.stringify({ error: "Evento não suportado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verifica a origem
    const originField = additionalInfo.find(
      (info: any) => info.key === "Origin"
    );

    const originValue = originField?.value;

    if (!originValue) {
      console.log("Campo Origin não encontrado");
      return new Response(
        JSON.stringify({ error: "Campo Origin não encontrado" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const isBotOrigin = originValue === "bot";
    const isSiteOrigin = originValue === "site";

    if (isBotOrigin) {
      // Para o bot, processamos de forma assíncrona para evitar timeout
      processBotOrigin(data, additionalInfo, originValue).catch((error) => {
        console.error("Erro no processamento do bot:", error);
      });

      // Retornamos resposta imediata para o bot
      return new Response(
        JSON.stringify({
          message:
            "Evento do bot recebido e sendo processado em segundo plano.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else if (isSiteOrigin) {
      // Para o site, processamos de forma síncrona para obter o código
      console.log("========Site=========");

      try {
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
          codigos?.filter(
            (codigo) => codigo.status.toLowerCase() === "ativo"
          ) || defaultData;

        if (codigoError || !codigosAtivos || codigosAtivos.length <= 0) {
          console.log(
            "❌ Não foi possível processar o código do produto. Solicite um chamado e envie o seu id."
          );
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
          .update({ status: "Resgatado" })
          .eq("id_codigo", codigoData.id_codigo);

        if (updateCodigoError) {
          console.error(
            `Erro ao atualizar o código ${codigoData.codigo}:`,
            updateCodigoError
          );
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
          try {
            // Timeout de 5 segundos para não bloquear resposta
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

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
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.error("Erro na resposta do webhook:", response.status);
            }
          } catch (error: any) {
            if (error.name === "AbortError") {
              console.log("Requisição de webhook cancelada por timeout");
            } else {
              console.error("Erro ao chamar webhook:", error);
            }
          }
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
          .update({ status: "concluida", origin: originValue })
          .eq("id_transacao", id_transacao);

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
            message:
              "Saldo atualizado e status da venda atualizado com sucesso.",
            codigo: code,
            produto: produto,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Erro ao processar origem 'site':", error);
        return new Response(
          JSON.stringify({
            message: "Erro no processamento da compra via site",
            error: (error as Error).message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else {
      console.log("Origem não reconhecida:", originValue);
      return new Response(JSON.stringify({ error: "Origem não reconhecida" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
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

// Função para processar evento CHARGE_COMPLETED em segundo plano
async function processChargeCompleted(data: any, additionalInfo: any[]) {
  try {
    const originField = additionalInfo.find(
      (info: any) => info.key === "Origin"
    );

    const originValue = originField?.value;

    if (!originValue) {
      console.log("Campo Origin não encontrado");
      return;
    }

    const isBotOrigin = originValue === "bot";
    const isSiteOrigin = originValue === "site";

    if (isBotOrigin) {
      console.log("========Bot=========");
      await processBotOrigin(data, additionalInfo, originValue);
    } else if (isSiteOrigin) {
      console.log("========Site=========");
      await processSiteOrigin(data, additionalInfo, originValue);
    } else {
      console.log("Origem não reconhecida:", originValue);
    }
  } catch (error) {
    console.error("Erro no processamento assíncrono:", error);
  }
}

// Função para processar origem "bot"
async function processBotOrigin(
  data: any,
  additionalInfo: any[],
  originValue: string
) {
  try {
    // Encontrar o user_id nos campos adicionais
    const userIdField = additionalInfo.find(
      (info: any) => info.key === "UserID"
    );
    if (!userIdField) {
      throw new Error("User ID não encontrado nos campos adicionais.");
    }

    const user_id = userIdField.value; // Obtém o user_id
    console.log(`User ID extraído: ${user_id}`);

    const saldo = data.charge.value / 100; // Converte o valor para o formato correto
    console.log(`Saldo a ser adicionado: ${saldo} (em formato correto)`);

    // Verificar o tipo de saldo
    if (isNaN(saldo) || saldo <= 0) {
      throw new Error(`Valor de saldo inválido: ${saldo}`);
    }

    // Fetch the current saldo
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("saldo")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar saldo do usuário:", fetchError.message);
      return;
    }

    const newSaldo = user.saldo + saldo; // Incrementa o saldo
    const { error: updateError } = await supabase
      .from("users")
      .update({ saldo: newSaldo })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Erro ao atualizar saldo do usuário:", updateError.message);
      return;
    }

    console.log("Saldo atualizado com sucesso para o usuário:", user_id);

    // Atualizar o status da venda existente
    const idTransacaoField = additionalInfo.find(
      (info: any) => info.key === "ID"
    );
    if (!idTransacaoField) {
      throw new Error("ID da transação não encontrado nos campos adicionais.");
    }

    const id_transacao = idTransacaoField.value; // Obtém o ID da transação

    const { error: vendaUpdateError } = await supabase
      .from("vendas")
      .update({ status: "concluida", origin: originValue }) // Atualiza o status da venda
      .eq("id_transacao", id_transacao); // Filtra pela ID da transação

    if (vendaUpdateError) {
      console.error(
        "Erro ao atualizar o status da venda:",
        vendaUpdateError.message
      );
      return;
    }

    const mensagem = `
🎉 Parabéns! Seu saldo foi adicionado à sua carteira.

Agora é só escolher o produto que deseja comprar! O valor será descontado automaticamente da sua carteira.

Caso seu saldo seja insuficiente, basta adicionar mais, e ele será somado ao valor já disponível.

Boas compras!`;

    //disparo de mensagem com timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

      const dataUpdate = {
        userId: user_id,
        message: mensagem,
        button: [
          {
            type: "Rota do bot",
            command: "bemvindos-2",
            name: "🤖 COMPRAR PELO BOT 🤖",
          },
        ],
        image: "",
        disparo: true,
      };

      const response = await fetch(
        "https://nextgiftcards.com/api/webhooks/telegram",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataUpdate),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const datares = await response.json();
        console.log("Mensagem enviada com sucesso:", datares);
      } else {
        const error = await response.json();
        console.error("Erro ao enviar mensagem:", error);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Requisição de envio de mensagem cancelada por timeout");
      } else {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  } catch (error) {
    console.error("Erro ao processar origem 'bot':", error);
  }
}

// Função para processar origem "site"
async function processSiteOrigin(
  data: any,
  additionalInfo: any[],
  originValue: string
) {
  try {
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
      return;
    }

    if (!codigosAtivos || codigosAtivos.length <= 0) {
      console.log("Nenhum código ativo encontrado");
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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

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
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error("Erro na resposta do webhook:", response.status);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Requisição de webhook cancelada por timeout");
        } else {
          console.error("Erro ao chamar webhook:", error);
        }
      }
    }

    // Atualizar o status da venda existente
    const idTransacaoField = additionalInfo.find(
      (info: any) => info.key === "ID"
    );
    if (!idTransacaoField) {
      throw new Error("ID da transação não encontrado nos campos adicionais.");
    }

    const id_transacao = idTransacaoField.value; // Obtém o ID da transação

    const { error: vendaUpdateError } = await supabase
      .from("vendas")
      .update({ status: "concluida", origin: originValue }) // Atualiza o status da venda
      .eq("id_transacao", id_transacao); // Filtra pela ID da transação

    if (vendaUpdateError) {
      console.error(
        "Erro ao atualizar o status da venda:",
        vendaUpdateError.message
      );
      return;
    }
    console.log("Status da venda atualizado com sucesso.");
  } catch (error) {
    console.error("Erro ao processar origem 'site':", error);
  }
}

const sendWhatsappNotification = async ({
  message,
  phone,
}: {
  phone: string;
  message: string;
}) => {
  try {
    const config: AxiosRequestConfig = {
      method: "post",
      url: `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_ID}`,
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY,
      },
    };

    await axios({
      ...config,
      data: JSON.stringify({
        delay: 500,
        number: phone,
        text: message,
        linkPreview: true,
      }),
    });
  } catch (error) {
    console.log("Erro ao enviar notificação via WhatsApp:");
    console.error(
      JSON.stringify({
        message: "Erro ao enviar notificação via WhatsApp",
        error: (error as any).message,
      })
    );
  }
};
