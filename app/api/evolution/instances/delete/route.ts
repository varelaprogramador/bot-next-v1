import { NextResponse } from "next/server";
import axios from "axios";

export async function DELETE(request: Request) {
  try {
    if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: "Configuração do Evolution API não encontrada" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const instanceName = url.searchParams.get("instanceName");

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância não fornecido" },
        { status: 400 }
      );
    }

    console.log("Deletando instância:", instanceName);

    const response = await axios.delete(
      `${process.env.EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
      }
    );

    console.log("Resposta do Evolution API:", response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Erro ao deletar instância:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Detalhes do erro:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });

        return NextResponse.json(
          {
            error: "Erro na comunicação com o Evolution API",
            details: error.response.data,
            status: error.response.status,
          },
          { status: error.response.status }
        );
      }

      if (error.request) {
        console.error("Erro na requisição:", error.request);
        return NextResponse.json(
          { error: "Não foi possível conectar ao Evolution API" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao deletar instância" },
      { status: 500 }
    );
  }
}
