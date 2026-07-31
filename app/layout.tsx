import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist, Onest, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { StoreProvider } from "@/store";
import { AuthProvider } from "@/components/shared/auth-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/**
 * Display pair for the marketing site.
 *
 * Onest carries the headlines; Playfair Display supplies the italic accent
 * word inside them. That contrast — geometric sans against a high-contrast
 * serif italic — is what gives the hero its editorial feel, and it was the
 * first thing lost when the landing page was rebuilt without the reference.
 */
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600"],
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dhaatri — Nurturing Earth. Growing Impact. Full Transparency.",
  description:
    "A national public platform that enables citizens, communities and institutions to convert open spaces into scientifically planned green cover with measurable carbon-offset impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        plusJakarta.variable,
        geist.variable,
        onest.variable,
        playfair.variable,
        "font-sans"
      )}
    >
      {/* Providers sit at the root so signing in on /login carries into the app
          shell, and so the workflow store survives navigation between the
          marketing site and the product. A reload restores the seed data. */}
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <StoreProvider>
            <AuthProvider>{children}</AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
