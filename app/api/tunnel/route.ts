// Rota de tunelamento do Sentry removida temporariamente devido a incompatibilidade
// com a versão atual do @sentry/nextjs

export async function POST() {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
