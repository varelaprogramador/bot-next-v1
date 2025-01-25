import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definindo rotas públicas (todas fora da root no diretório app)
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect(); // Protege todas as rotas fora das rotas públicas
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
