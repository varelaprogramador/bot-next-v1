import { NextResponse } from "next/server";

// Chave secreta para proteção adicional
const API_SECRET = process.env.USER_WEBHOOK_API_KEY;

/**
 * Middleware para verificar autenticação com cabeçalho x-secret
 * @param req Request object
 * @returns NextResponse ou null, se a autenticação passar
 */
export function verifySecretHeader(req: Request) {
  // Verificar o cabeçalho x-secret
  const secretKey = req.headers.get("x-secret");

  // Verificar se o segredo é válido
  if (!secretKey || secretKey !== API_SECRET) {
    console.warn("Tentativa de acesso não autorizado à API");
    return NextResponse.json(
      { error: "Acesso não autorizado" },
      { status: 401 }
    );
  }

  // Se a autenticação passar, retorna null para continuar com a request
  return null;
}
