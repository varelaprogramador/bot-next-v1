import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: "Configuração do Evolution API não encontrada" },
        { status: 500 }
      );
    }

    const response = await axios.get(
      `${process.env.EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
      }
    );

    // Formatar os dados para incluir informações adicionais
    const instances = response.data.map((instance: any) => ({
      instanceName: instance.name,
      status:
        instance.connectionStatus === "open" ? "connected" : "disconnected",
      number: instance.ownerJid?.split("@")[0] || null,
      profileName: instance.profileName,
      profilePicUrl: instance.profilePicUrl,
      token: instance.token,
      lastSeen: instance.updatedAt
        ? new Date(instance.updatedAt).toLocaleString("pt-BR")
        : null,
      isOnline: instance.connectionStatus === "open",
      isAuthenticated: instance.connectionStatus === "open",
      messageCount: instance._count?.Message || 0,
      contactCount: instance._count?.Contact || 0,
      chatCount: instance._count?.Chat || 0,
    }));

    return NextResponse.json(instances);
  } catch (error: any) {
    console.error("Erro ao buscar instâncias:", error);

    // Tratamento específico para diferentes tipos de erro
    if (error.response) {
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
      { error: "Erro ao buscar instâncias" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { instanceName } = await req.json();

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.EVOLUTION_API_URL}/instance/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY || "",
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Erro ao criar instância" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao criar instância:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
