import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Ajuste este valor em produção

  // Ative o modo de depuração para mais logs (remova em produção)
  // debug: true,
});
