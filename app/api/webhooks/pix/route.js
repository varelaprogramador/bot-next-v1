
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  require('dotenv').config();
 
  try {
    console.log(req.json())
    return new Response(JSON.stringify({ message: "GET request successful" }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Caso ocorra algum erro
    return new Response(JSON.stringify({ message: "Error", error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }}


  export async function POST(req) {
    require('dotenv').config();
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
    try {
      const data = await req.json(); // Corpo da requisição
      console.log("Corpo da requisição:", JSON.stringify(data, null, 2));
  
      // Valida se o evento e o status são os esperados
      if (data.event === 'OPENPIX:CHARGE_COMPLETED') {
        const additionalInfo = data.charge.additionalInfo || [];
        console.log("Campos adicionais:", JSON.stringify(additionalInfo, null, 2)); // Log para verificar os campos adicionais
  
        // Encontrar o user_id nos campos adicionais
        const userIdField = additionalInfo.find(info => info.key === "UserID");
        
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
  
        // Atualiza o saldo no Supabase
        const { error } = await supabase
          .from('users')
          .update({
            saldo: supabase.raw('saldo + ?', [saldo]), // Array de parâmetros
          })
          .eq('user_id', user_id);
  
        if (error) {
          console.error("Erro ao atualizar saldo no Supabase:", error);
          throw new Error(`Erro ao atualizar saldo: ${error.message}`);
        }
  
        console.log("Saldo atualizado com sucesso para o usuário:", user_id);
  
        return new Response(JSON.stringify({ message: "Saldo atualizado com sucesso" }), {
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
  
  