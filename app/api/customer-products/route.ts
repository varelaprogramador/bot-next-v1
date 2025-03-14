import { type NextRequest, NextResponse } from "next/server"

// Esta função simularia a busca de produtos adquiridos por um cliente específico
// Em um ambiente real, você conectaria isso ao seu banco de dados
export async function GET(request: NextRequest) {
  // Obter o código do cliente da URL (ex: /api/customer-products?code=ABC123)
  const searchParams = request.nextUrl.searchParams
  const customerCode = searchParams.get("code")

  if (!customerCode) {
    return NextResponse.json({ error: "Código do cliente é obrigatório" }, { status: 400 })
  }

  try {
    // Simular busca no banco de dados
    // Em um ambiente real, você buscaria os produtos adquiridos pelo cliente com este código
    const purchasedProducts = getMockPurchasedProducts(customerCode)

    return NextResponse.json({ products: purchasedProducts })
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return NextResponse.json({ error: "Erro ao buscar produtos adquiridos" }, { status: 500 })
  }
}

// Função auxiliar para simular dados
function getMockPurchasedProducts(customerCode: string) {
  // Simular diferentes produtos para diferentes códigos de cliente
  const productSets: Record<string, any[]> = {
    ABC123: [
      {
        id: "GC001",
        name: "Steam Gift Card",
        purchaseDate: "2024-03-01",
        price: 50,
        image: "/placeholder.svg?height=100&width=100",
        storeReview: {
          rating: 5,
          comment: "Nosso gift card mais popular! Perfeito para gamers.",
        },
        customerReview: {
          rating: 4,
          comment: "Entrega rápida e fácil de usar.",
        },
      },
      {
        id: "GC003",
        name: "PlayStation Store Gift Card",
        purchaseDate: "2024-02-15",
        price: 75,
        image: "/placeholder.svg?height=100&width=100",
        storeReview: {
          rating: 4,
          comment: "Popular entre gamers de PlayStation. Fácil de resgatar.",
        },
        customerReview: null, // Cliente ainda não avaliou
      },
    ],
    XYZ789: [
      {
        id: "GC002",
        name: "Netflix Gift Card",
        purchaseDate: "2024-03-05",
        price: 30,
        image: "/placeholder.svg?height=100&width=100",
        storeReview: {
          rating: 5,
          comment: "Ótimo para amantes de filmes! Entrega instantânea.",
        },
        customerReview: {
          rating: 5,
          comment: "Presente perfeito para minha esposa. Muito obrigado!",
        },
      },
    ],
    // Código padrão para demonstração
    default: [
      {
        id: "GC001",
        name: "Steam Gift Card",
        purchaseDate: "2024-03-01",
        price: 50,
        image: "/placeholder.svg?height=100&width=100",
        storeReview: {
          rating: 5,
          comment: "Nosso gift card mais popular! Perfeito para gamers.",
        },
        customerReview: null,
      },
      {
        id: "GC002",
        name: "Netflix Gift Card",
        purchaseDate: "2024-02-20",
        price: 30,
        image: "/placeholder.svg?height=100&width=100",
        storeReview: {
          rating: 5,
          comment: "Ótimo para amantes de filmes! Entrega instantânea.",
        },
        customerReview: null,
      },
    ],
  }

  return productSets[customerCode] || productSets["default"]
}

