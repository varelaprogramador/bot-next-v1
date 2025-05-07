import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: "Configuração do Evolution API não encontrada" },
        { status: 500 }
      );
    }

    const { instanceName } = await req.json();

    // Validações
    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    if (instanceName.length < 3 || instanceName.length > 30) {
      return NextResponse.json(
        { error: "Nome da instância deve ter entre 3 e 30 caracteres" },
        { status: 400 }
      );
    }

    // Configuração da instância
    const instanceConfig = {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook_by_events: false,
      events: ["APPLICATION_STARTUP"],
      reject_call: true,
      groups_ignore: true,
      always_online: true,
      read_messages: true,
      read_status: true,
      websocket_enabled: true,
      websocket_events: ["APPLICATION_STARTUP"],
    };

    const response = await axios.post(
      `${process.env.EVOLUTION_API_URL}/instance/create`,
      instanceConfig,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
      }
    );

    console.log(response);

    return NextResponse.json({
      ...response.data,
      message: "Instância criada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao criar instância:", error);

    if (error.response) {
      // Erro específico do Evolution API
      if (error.response.status === 409) {
        return NextResponse.json(
          { error: "Já existe uma instância com este nome" },
          { status: 409 }
        );
      }

      console.error("Resposta de erro do Evolution API:", error.response.data);

      return NextResponse.json(
        {
          error: "Erro na comunicação com o Evolution API",
          details: error.response.data,
        },
        { status: error.response.status }
      );
    }

    if (error.request) {
      return NextResponse.json(
        { error: "Não foi possível conectar ao Evolution API" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar instância" },
      { status: 500 }
    );
  }
}
