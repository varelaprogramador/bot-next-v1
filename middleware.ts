import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definindo rotas públicas
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)", // Inclua se usar cadastro
  "/auth(.*)",
  "/api(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth(); // Protege todas as rotas fora das públicas
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};