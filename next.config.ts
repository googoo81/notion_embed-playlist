import type { NextConfig } from "next";

/** 빌드 시 embed 베이스 URL — 명시 env > Vercel 배포 URL */
function resolvePublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;
  return "";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: resolvePublicAppUrl(),
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
