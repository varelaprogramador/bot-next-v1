require('dotenv').config();
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
 
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
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    try {
      const data = await req.json(); // Corpo da requisição
      console.log(data);
  
      // Valida se o evento e o status são os esperados
      if (data.event === "OPENPIX:CHARGE_COMPLETED" && data.status === "COMPLETED") {
        // Localiza o user_id nos campos adicionais
        const additionalInfo = data.additionalInfo || [];
        const userIdField = additionalInfo.find(info => info.key === "UserID");
        
        if (!userIdField) {
          throw new Error("User ID não encontrado nos campos adicionais.");
        }
  
        const user_id = userIdField.value; // Obtém o user_id
        const saldo = data.value / 100; // Converte o valor para o formato correto
  
        // Atualiza o saldo no Supabase
        const { error } = await supabase
          .from('users') // Nome da tabela
          .update({
            saldo: supabase.raw('saldo + ?', [saldo]), // Incrementa o saldo
          })
          .eq('user_id', user_id); // Filtra pelo ID do usuário
  
        if (error) {
          throw new Error(`Erro ao atualizar saldo: ${error.message}`);
        }
  
        return new Response(JSON.stringify({ message: "Saldo atualizado com sucesso" }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        return new Response(JSON.stringify({ message: "Evento não processado" }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ message: "Error", error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
  