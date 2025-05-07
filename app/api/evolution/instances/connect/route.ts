"use server";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: "Configuração do Evolution API não encontrada" },
        { status: 500 }
      );
    }

    const { instanceName } = await request.json();

    const response = await axios.get(
      `${process.env.EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
      }
    );

    return NextResponse.json({
      ...response.data,
      message: "Instância conectada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao conectar instância:", error);

    if (axios.isAxiosError(error)) {
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
    }

    return NextResponse.json(
      { error: "Erro ao conectar instância" },
      { status: 500 }
    );
  }
}
