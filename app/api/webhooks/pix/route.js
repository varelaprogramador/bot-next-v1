import { createClient } from '@supabase/supabase-js';
require('dotenv').config(); // Carregar variáveis de ambiente

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function GET(req) {
  try {
    console.log(await req.json()); // Corrigido para aguardar a promessa
    return new Response(JSON.stringify({ message: "GET request successful" }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Caso ocorra algum erro
    console.error('Erro no GET:', error.message);
    return new Response(JSON.stringify({ message: "Error", error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req) {
  try {
    const data = await req.json(); // Corpo da requisição
    console.log("Corpo da requisição:", JSON.stringify(data, null, 2));

    // Valida se o evento é o esperado
    if (data.event === 'OPENPIX:CHARGE_COMPLETED') {
      const additionalInfo = data.charge.additionalInfo || [];
      console.log("Campos adicionais:", JSON.stringify(additionalInfo, null, 2)); // Log para verificar os campos adicionais

      // Encontrar o user_id nos campos adicionais
      const userIdField = additionalInfo.find(info => info.key === "UserID");
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
        .from('users')
        .select('saldo')
        .eq('user_id', user_id)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar saldo do usuário:", fetchError.message);
        return new Response(JSON.stringify({ message: "Erro ao buscar saldo do usuário", error: fetchError.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const newSaldo = user.saldo + saldo; // Incrementa o saldo
      const { error: updateError } = await supabase
        .from('users')
        .update({ saldo: newSaldo })
        .eq('user_id', user_id);

      if (updateError) {
        console.error("Erro ao atualizar saldo do usuário:", updateError.message);
        return new Response(JSON.stringify({ message: "Erro ao atualizar saldo do usuário", error: updateError.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      console.log("Saldo atualizado com sucesso para o usuário:", user_id);

      // Atualizar o status da venda existente
      const idTransacaoField = additionalInfo.find(info => info.key === "ID");
      if (!idTransacaoField) {
        throw new Error("ID da transação não encontrado nos campos adicionais.");
      }

      const id_transacao = idTransacaoField.value; // Obtém o ID da transação

      const { error: vendaUpdateError } = await supabase
        .from('vendas')
        .update({ status: "concluida" }) // Atualiza o status da venda
        .eq('id_transacao', id_transacao); // Filtra pela ID da transação

      if (vendaUpdateError) {
        console.error("Erro ao atualizar o status da venda:", vendaUpdateError.message);
        return new Response(JSON.stringify({ message: "Erro ao atualizar o status da venda", error: vendaUpdateError.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const mensagem=`
🎉 Parabéns! Seu saldo foi adicionado à sua carteira.

Agora é só escolher o produto que deseja comprar! O valor será descontado automaticamente da sua carteira.

Caso seu saldo seja insuficiente, basta adicionar mais, e ele será somado ao valor já disponível.

Boas compras!`
//disparo de mensagem
      const dataUpdate={
        userId:user_id, message:mensagem, button:[{
          type:"Rota do bot",
          command:"bemvindos-2",
          name:'🤖 COMPRAR PELO BOT 🤖'
        }],image:"",
        disparo: true
      }
      const response = await fetch('https://www.n8nworks.shop/api/webhooks/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataUpdate),
    });
    if (response.ok) {
      const datares = await response.json();
      console.log("Mensagem enviada com sucesso:", datares);
    } else {
      const error = await response.json();
      console.error("Erro ao enviar mensagem:", error);
    }
    
  
    
      return new Response(JSON.stringify({ message: "Saldo atualizado e status da venda atualizado com sucesso." }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.log("Evento não processado:", data.event);
      return new Response(JSON.stringify({ message: "Evento não processado" }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Erro no processamento do POST:', error.message);
    return new Response(JSON.stringify({ message: "Error", error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}