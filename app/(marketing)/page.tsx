import Hero from "@/components/landing/hero";
import ImpactMetrics from "@/components/landing/impact-metrics";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import EngagementModels from "@/components/landing/engagement-models";
import CTAFooter from "@/components/landing/cta-footer";
import { CanopyFab } from "@/components/landing/canopy-map";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ImpactMetrics />
      <Features />
      <HowItWorks />
      <EngagementModels />
      <CTAFooter />

      {/* Floats over the whole page — the one thing a first-time visitor can
          poke at before reading anything. */}
      <CanopyFab />
    </main>
  );
}
