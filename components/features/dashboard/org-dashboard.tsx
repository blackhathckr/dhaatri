"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Award, Leaf } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  VizBars,
  VizPips,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { formatCurrency, formatDate } from "@/lib/format";

export function OrgDashboard() {
  const state = useData();
  const { currentUser } = useAuthContext();

  const mine = state.credits.filter((c) => c.organisationId === currentUser.id);
  const active = mine.filter((c) => c.status === "active");
  const retired = mine.filter((c) => c.status === "retired");

  const held = mine.reduce((a, c) => a + c.credits, 0);
  const spend = mine.reduce((a, c) => a + c.amount, 0);

  // The sites actually holding the trees behind these credits.
  const backingIds = [...new Set(mine.flatMap((c) => c.siteIds))];
  const backing = state.sites.filter((s) => backingIds.includes(s.id));

  const verified = state.checkins.filter((c) => c.status === "verified");
  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const platformCo2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Organisation"
        title={held ? "Carbon backed by real trees" : "Offset against trees that exist"}
        scene="forest"
        mascot={held ? "sprout-celebrating" : "sprout-pointing"}
        figures={[
          { value: held, unit: "tCO₂e", decimals: 1, note: `${active.length} active holdings` },
          { value: spend, unit: "₹ invested", note: "into plantation" },
          { value: backing.length, unit: "sites", note: "backing your credits" },
        ]}
        actions={
          <Link href="/carbon-credits/purchase">
            <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
              Purchase credits
              <ArrowUpRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Active",
              value: active.reduce((a, c) => a + c.credits, 0),
              decimals: 1,
              note: `${active.length} live certificates`,
              viz: <VizPips states={mine.map((c) => c.status === "active")} color="#6B5CA5" />,
            },
            {
              label: "Retired",
              value: retired.reduce((a, c) => a + c.credits, 0),
              decimals: 1,
              note: "permanently out of circulation",
              viz: <VizPips states={mine.map((c) => c.status === "retired")} color="#9AA39C" />,
            },
            {
              label: "Average rate",
              value: held ? Math.round(spend / held) : 0,
              note: "₹ per tonne paid",
              viz: <VizBars values={mine.map((c) => c.amount / c.credits)} color="#B7791F" />,
            },
            {
              label: "Trees behind it",
              value: state.plans
                .filter((p) => backingIds.includes(p.siteId))
                .reduce((a, p) => a + p.species.reduce((s, sp) => s + sp.quantity, 0), 0),
              note: "across the backing sites",
              viz: <VizBars values={backing.map((s) => s.area / 100)} />,
            },
          ]}
        />
      </Reveal>

      {/* ----------------------------------------------------- provenance */}
      <Reveal delay={0.12}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            What stands behind your certificate
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <InvertedFigure
              label="Methodology"
              value={CARBON_METHOD_VERSION}
              note="owned by the scientific panel"
            />
            <InvertedFigure
              label="Verified survival"
              value={`${survival.toFixed(1)}%`}
              note={`from ${verified.length} geo-tagged visits`}
            />
            <InvertedFigure
              label="Platform sequestration"
              value={`${(platformCo2 / 1000).toFixed(2)} t`}
              note="per year, computed not estimated"
            />
            <InvertedFigure
              label="Your share"
              value={`${platformCo2 ? ((held * 1000) / platformCo2 * 100).toFixed(1) : "0"}%`}
              note="of what the platform sequesters"
            />
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-[13px] leading-5 text-white/55">
            Nothing is sold forward. A credit only exists against carbon the engine has already
            computed from survival a volunteer counted on the plot.
          </p>
        </InvertedPanel>
      </Reveal>

      {/* -------------------------------------------------------- holdings */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Portfolio"
            title={`${mine.length} ${mine.length === 1 ? "purchase" : "purchases"}`}
            right={
              <Link href="/carbon-credits">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  All holdings
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <div className="space-y-3.5">
          {mine.length === 0 && (
            <Awaiting
              pose="sprout-thinking"
              title="No credits yet"
              body="Purchase carbon backed by verified plantation, and a certificate is issued immediately."
              action={
                <Link href="/carbon-credits/purchase">
                  <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                    Purchase credits
                  </Button>
                </Link>
              }
            />
          )}

          {mine.map((c, i) => (
            <Reveal key={c.id} delay={0.04 * i}>
              <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] lg:flex-row lg:items-center">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E4E0F2]">
                  <Award className="size-[18px] text-[#6B5CA5]" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                      {c.credits} tCO₂e
                    </p>
                    <Pill tone={toneFor(c.status)}>{c.status}</Pill>
                    {c.certificateId && (
                      <span className="font-mono text-[12px] text-ink-ghost">
                        {c.certificateId}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-faint">
                    Purchased {formatDate(c.purchasedAt)} · {formatCurrency(c.amount)} ·{" "}
                    {formatCurrency(Math.round(c.amount / c.credits))} per tonne
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.siteIds.map((id) => (
                      <Link
                        key={id}
                        href={`/sites/${id}`}
                        className="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1 text-[12px] text-ink-soft transition-colors hover:bg-[#D8F3DC]"
                      >
                        <Leaf className="size-3 text-[#52B788]" />
                        {state.sites.find((s) => s.id === id)?.name ?? id}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* share of your own portfolio */}
                <div className="w-full shrink-0 lg:w-40">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-ink-faint">Share</span>
                    <span className="text-[13px] font-semibold text-ink-brand">
                      {((c.credits / held) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-track">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.credits / held) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.04 * i }}
                      className="block h-full rounded-full bg-[#6B5CA5]"
                    />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
