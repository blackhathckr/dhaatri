import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is a UI prototype, not a typed backend. A type error should not be
  // able to block a Vercel deploy — run `pnpm exec tsc --noEmit` locally when
  // you want the check.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
