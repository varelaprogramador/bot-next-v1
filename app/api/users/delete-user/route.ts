import { clerkClient } from "@clerk/express";
import { NextResponse } from "next/server";
import { verifySecretHeader } from "../../middlewares/authMiddleware";

export async function POST(req: Request) {
  // Verificar autenticação
  const authResponse = verifySecretHeader(req);
  if (authResponse) return authResponse;

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório" },
      { status: 400 }
    );
  }

  try {
    await clerkClient.users.deleteUser(id);
    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
