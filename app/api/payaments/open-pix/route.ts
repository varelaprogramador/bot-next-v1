"use server";
import { v4 } from "uuid";

export async function POST(req: Request) {
  try {
    // Pegando os dados do request
    const body = await req.json();
    console.log(body);
    if (!body.produto || !body.nome || !body.telefone) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
      });
    }

    const response = await fetch(
      "https://api.openpix.com.br/api/v1/charge?return_existing=true",
      {
        method: "POST",
        headers: {
          Authorization: `${process.env.OPENPIX_API_KEY}`, // No backend, não use NEXT_PUBLIC_
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correlationID: `${body.produto.nome}+${v4()}`.replace(/\s+/g, ""), // Remove espaços
          value: body.produto.valor * 100,
          comment: body.produto.nome,
          expiresIn: 420,
          additionalInfo: [
            { key: "Product", value: body.produto.id },
            { key: "Product-Nome", value: body.produto.nome },
            { key: "Nome", value: body.nome },
            { key: "Telefone", value: body.telefone }, // Corrigido
            {
              key: "Email",
              value: body.email != "" ? body.email : "sem@gmail.com",
            }, // Corrigido
            { key: "Invoice", value: body.data || Date.now().toString() }, // Se não tiver `data`, usa timestamp
            { key: "Origin", value: body.origin || "site" },
          ],
          payer: {
            name: body.nome,
            email: body.email || "",
            phone: body.telefone,
          },
        }),
      }
    );

    const responseData = await response.json();

    return new Response(JSON.stringify(responseData), {
      status: response.status,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao processar a requisição" }),
      { status: 500 }
    );
  }
}
