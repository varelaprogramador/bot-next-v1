"use server";

import { NextResponse } from "next/server";
import { v4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { nome, telefone, valor } = await req.json();

    if (!nome || !telefone || !valor) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `Q2xpZW50X0lkXzM4NmEwYjIxLTRhZTMtNGUzMi05NmMzLTg0NmI1NmRkYzc4ZTpDbGllbnRfU2VjcmV0X0d4WmJZZ0VkUElEbDRobUU3RUxNQW5ybmtuNkhtTkRjNmVRT2JXNVhVT289`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: `${nome}+${v4()}`.replace(/\s+/g, ""),
          value: valor * 100,
          comment: "Pagamento via PIX",
          expiresIn: 420,
          additionalInfo: [
            { key: "Nome", value: nome },
            { key: "Telefone", value: telefone },
            { key: "Email", value: "sem@gmail.com" },
            { key: "Invoice", value: Date.now().toString() },
          ],
          payer: {
            name: nome,
            email: "",
            phone: telefone,
          },
        }),
      }
    );

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erro no processamento:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar a requisição",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
