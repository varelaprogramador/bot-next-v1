"use server";

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
      "https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/107090/N0zmZuEk8fwK/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: body.nome,
          email: body.email || "",
          phone: body.telefone,
          codigo: body.codigo,
          produto: body.nome_produto,
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
