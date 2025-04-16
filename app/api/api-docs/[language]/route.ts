import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const language = params.language;

    // Determinar qual arquivo de documentação buscar
    let filePath;
    if (language === "pt-br") {
      filePath = path.join(process.cwd(), "docs", "api_pt-br.md");
    } else if (language === "en") {
      filePath = path.join(process.cwd(), "docs", "api.md");
    } else {
      return NextResponse.json(
        { error: "Idioma não suportado" },
        { status: 400 }
      );
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Documentação não encontrada" },
        { status: 404 }
      );
    }

    // Ler o conteúdo do arquivo
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Retornar o conteúdo como texto
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/markdown; charset=UTF-8",
      },
    });
  } catch (error) {
    console.error("Erro ao carregar documentação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
