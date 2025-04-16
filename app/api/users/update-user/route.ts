import { clerkClient } from "@clerk/express";
import { NextResponse } from "next/server";
import { verifySecretHeader } from "../../middlewares/authMiddleware";

export async function POST(req: Request) {
  // Verificar autenticação
  const authResponse = verifySecretHeader(req);
  if (authResponse) return authResponse;

  const { userId, firstName, lastName } = await req.json();

  try {
    const updatedUser = await clerkClient.users.updateUser(userId, {
      firstName,
      lastName,
    });
    return NextResponse.json(updatedUser); // Retorna o usuário atualizado
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar o usuário" },
      { status: 500 }
    );
  }
}
