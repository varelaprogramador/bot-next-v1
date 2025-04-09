// Importe o wrapper do Sentry
const { withSentryConfig } = require("@sentry/nextjs");

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "*",
        protocol: "https",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@radix-ui/react-*",
      "lucide-react",
    ],
  },
};

const sentryWebpackPluginOptions = {
  // Opções adicionais do plugin do webpack do Sentry
  silent: true, // Evita logs excessivos durante o build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

// Exporte a configuração envolvida pelo Sentry
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
