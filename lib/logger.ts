import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

const logger = pino({
  level: isDevelopment ? "debug" : "info", // Loga mais em dev, menos em prod
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:dd/mm/yyyy HH:MM:ss",
          ignore: "pid,hostname", // Ignora campos menos úteis
        },
      }
    : undefined, // Em produção, usa o formato JSON padrão (melhor para ingestão por sistemas de log)
  base: {
    // Adiciona contexto útil aos logs
    env: process.env.NODE_ENV,
    // Adicione outros campos base se necessário, ex: service: 'my-app'
  },
  timestamp: pino.stdTimeFunctions.isoTime, // Usa timestamp ISO 8601
});

export default logger;
