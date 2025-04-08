import { createSentryRouteHandler } from "@sentry/nextjs";

// Esta rota é usada para "tunelar" eventos do Sentry e evitar bloqueadores de anúncios.
// Consulte https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/ad-blockers/
export const POST = createSentryRouteHandler();
