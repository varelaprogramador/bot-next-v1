require('dotenv').config();

export async function GET(req) {
  try {
    // Lógica do seu endpoint GET (se necessário)
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
  }
}

export async function POST(req) {
  try {
    // Lógica do seu endpoint POST (se necessário)
    const data = await req.json(); // Para acessar o corpo da requisição, se houver
    console.log(data)
    return new Response(JSON.stringify({ message: "POST request successful", data }), {
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
  }
}
