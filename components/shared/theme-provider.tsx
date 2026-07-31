"use client";

import { ThemeProvider as NextThemes } from "next-themes";

/**
 * Class-based theming, because globals.css declares `dark` as
 * `&:is(.dark *)` — an attribute strategy would never match.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
