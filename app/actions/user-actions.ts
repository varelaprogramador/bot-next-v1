"use server";

export async function getUsers() {
  const apiSecret = process.env.USER_WEBHOOK_API_KEY;
  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const response = await fetch(`${origin}/api/users/get-users`, {
    headers: {
      "x-secret": apiSecret as string,
    },
  });

  if (!response.ok) {
    console.log(response);
    throw new Error("Falha ao buscar usuários");
  }

  return response.json();
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: string;
  level: string;
}) {
  const apiSecret = process.env.USER_WEBHOOK_API_KEY;
  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const response = await fetch(`${origin}/api/users/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-secret": apiSecret as string,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Falha ao criar usuário");
  }

  return response.json();
}

export async function deleteUser(id: string) {
  const apiSecret = process.env.USER_WEBHOOK_API_KEY;
  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const response = await fetch(`${origin}/api/users/delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-secret": apiSecret as string,
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error("Falha ao excluir usuário");
  }

  return response.json();
}
