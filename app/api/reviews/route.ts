import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar os dados recebidos
    if (!body.productId) {
      return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 })
    }

    if (!body.customerCode) {
      return NextResponse.json({ error: "Código do cliente é obrigatório" }, { status: 400 })
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Avaliação válida é obrigatória (1-5)" }, { status: 400 })
    }

    // Em um ambiente real, você salvaria a avaliação no banco de dados
    console.log("Avaliação recebida:", body)

    // Simular um atraso para parecer que está salvando no banco de dados
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: "Avaliação enviada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao processar avaliação:", error)
    return NextResponse.json({ error: "Erro ao processar avaliação" }, { status: 500 })
  }
}

