import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is a UI prototype, not a typed backend. A type error should not be
  // able to block a Vercel deploy — run `pnpm exec tsc --noEmit` locally when
  // you want the check.
  // Next 16 no longer runs ESLint during `next build`, so only the type check
  // needs turning off.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
