import { clerkClient } from '@clerk/express';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId, firstName, lastName} = await req.json();

  try {
    const updatedUser = await clerkClient.users.updateUser(userId, {
      firstName,
      lastName,
      
    });
    return NextResponse.json(updatedUser);  // Retorna o usuário atualizado
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    return NextResponse.json({ error: 'Erro ao atualizar o usuário' }, { status: 500 });
  }
}
