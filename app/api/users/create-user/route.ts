// Importando o cliente Clerk
import { clerkClient } from "@clerk/express";
import { NextResponse } from "next/server";
import { verifySecretHeader } from "../../middlewares/authMiddleware";

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const authResponse = verifySecretHeader(req);
    if (authResponse) {
      console.log("Erro de autenticação:", authResponse);
      return authResponse;
    }

    const body = await req.json();
    console.log("Dados recebidos:", { ...body, password: "[REDACTED]" });

    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      console.log("Dados incompletos:", {
        firstName,
        lastName,
        email,
        password: "[REDACTED]",
      });
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const newUser = await clerkClient.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
    });

    console.log("Usuário criado com sucesso:", newUser.id);
    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Erro detalhado ao criar novo usuário:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar novo usuário",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
