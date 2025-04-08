import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Ajuste este valor em produção
  replaysOnErrorSampleRate: 1.0,
  // Se você quiser usar Session Replay
  replaysSessionSampleRate: 0.1,

  // Ative o modo de depuração para mais logs (remova em produção)
  // debug: true,

  integrations: [
    // Ativa o Session Replay
    Sentry.replayIntegration({
      // Máscara elementos que podem conter PII
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
