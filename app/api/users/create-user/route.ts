  // Importando o cliente Clerk
import { clerkClient } from '@clerk/express';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { firstName, lastName, email, password } = await req.json();

  try {
    const newUser = await clerkClient.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
    });
    return NextResponse.json(newUser);  // Retorna o novo usuário criado
  } catch (error) {
    console.error("Erro ao criar novo usuário:", error);
    return NextResponse.json({ error: 'Erro ao criar novo usuário' }, { status: 500 });
  }
}
