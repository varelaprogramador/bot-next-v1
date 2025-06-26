import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";
import { verifySecretHeader } from "../../middlewares/authMiddleware";

export async function GET(req: Request) {
  // Verificar autenticação
  const authResponse = verifySecretHeader(req);
  if (authResponse) return authResponse;

  try {
    const usersList = await clerkClient.users.getUserList({
      orderBy: "-created_at",
    });
    return NextResponse.json(usersList.data); // Retorna todos os usuários
  } catch (error) {
    console.error("Erro ao obter todos os usuários:", error);
    return NextResponse.json(
      { error: "Erro ao obter todos os usuários" },
      { status: 500 }
    );
  }
}
