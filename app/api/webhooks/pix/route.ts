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

    console.log("Corpo da requisição:", JSON.stringify(data, null, 2));

    const eventType = data.evento;

    if (eventType === "teste_webhook") {
      console.log("teste_webhook");

      return new Response(JSON.stringify({ message: "teste_webhook" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { additionalInfo } = data?.charge;

    if (!additionalInfo) {
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

    // Valida se o evento é o esperado
    if (data.event === "OPENPIX:CHARGE_COMPLETED") {
      if (additionalInfo?.find((info: any) => info.key === "Origin") == "bot") {
        console.log(
          "Campos adicionais:",
          JSON.stringify(additionalInfo, null, 2)
        ); // Log para verificar os campos adicionais

        // Encontrar o user_id nos campos adicionais
        const userIdField = additionalInfo.find(
          (info: any) => info.key === "UserID"
        );
        if (!userIdField) {
          throw new Error("User  ID não encontrado nos campos adicionais.");
        }

        const user_id = userIdField.value; // Obtém o user_id
        console.log(`User  ID extraído: ${user_id}`);

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
          return new Response(
            JSON.stringify({
              message: "Erro ao buscar saldo do usuário",
              error: fetchError.message,
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }

        const newSaldo = user.saldo + saldo; // Incrementa o saldo
        const { error: updateError } = await supabase
          .from("users")
          .update({ saldo: newSaldo })
          .eq("user_id", user_id);

        if (updateError) {
          console.error(
            "Erro ao atualizar saldo do usuário:",
            updateError.message
          );
          return new Response(
            JSON.stringify({
              message: "Erro ao atualizar saldo do usuário",
              error: updateError.message,
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }

        console.log("Saldo atualizado com sucesso para o usuário:", user_id);

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
          .update({ status: "concluida" }) // Atualiza o status da venda
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

        const mensagem = `
🎉 Parabéns! Seu saldo foi adicionado à sua carteira.

Agora é só escolher o produto que deseja comprar! O valor será descontado automaticamente da sua carteira.

Caso seu saldo seja insuficiente, basta adicionar mais, e ele será somado ao valor já disponível.

Boas compras!`;
        //disparo de mensagem
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
          "https://www.n8nworks.shop/api/webhooks/telegram",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataUpdate),
          }
        );
        if (response.ok) {
          const datares = await response.json();
          console.log("Mensagem enviada com sucesso:", datares);
        } else {
          const error = await response.json();
          console.error("Erro ao enviar mensagem:", error);
        }

        return new Response(
          JSON.stringify({
            message:
              "Saldo atualizado e status da venda atualizado com sucesso.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else if (
        additionalInfo.find((info: any) => info.key === "Origin") == "site"
      ) {
        console.log(data);
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

        const message =
          `Olá, *${additionalInfo.find(
            (info: any) => info.key === "Nome"
          )}*!\nSeu codigo *${codigoData.codigo}* foi ativado! 🎉\n\n` +
          `Agora basta você resgatar.\n\n` +
          `Atenciosamente,\nEquipe *NEXTRECARGAS*`;
        console.log(message);
        await sendWhatsappNotification({
          message,
          phone: additionalInfo.find((info: any) => info.key === "Telefone"),
        });
        return new Response(
          JSON.stringify({
            message:
              "Saldo atualizado e status da venda atualizado com sucesso.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        return new Response(JSON.stringify({ message: "PARA DE EXPLORAR;" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } else {
      console.log("Evento não processado:", data.event);
      return new Response(
        JSON.stringify({ message: "Evento não processado" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Erro no processamento do POST:", error.message);

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

    const response = await axios({
      ...config,
      data: JSON.stringify({
        delay: 120,
        number: phone,
        text: message,
        linkPreview: false,
      }),
    });

    console.log("Message :" + response);

    return response;
  } catch (error: any) {
    console.log(error);
    return null;
  }
};
