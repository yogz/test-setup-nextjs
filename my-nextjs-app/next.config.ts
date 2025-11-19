import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Allow Server Actions in GitHub Codespaces and other forwarded environments
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.app.github.dev', // GitHub Codespaces
        '*.preview.app.github.dev', // GitHub Codespaces preview
      ],
    },
  },
};

export default nextConfig;
