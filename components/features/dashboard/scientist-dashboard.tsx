"use client";

import React from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { formatDateRelative } from "@/lib/format";

const chartConfig = { count: { label: "Check-ins", color: "#2D6A4F" } } satisfies ChartConfig;

export function ScientistDashboard() {
  const { state, reviewCheckin } = useStore();
  const { currentUser } = useAuthContext();

  const pending = state.checkins.filter((c) => c.status === "pending_review");
  const verified = state.checkins.filter((c) => c.status === "verified");
  const flagged = state.checkins.filter((c) => c.status === "flagged");

  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const co2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? id;

  // Survival distribution — where the plantations actually sit.
  const buckets = [
    { band: "<70%", count: state.checkins.filter((c) => c.survivalPercent < 70).length },
    { band: "70–80", count: state.checkins.filter((c) => c.survivalPercent >= 70 && c.survivalPercent < 80).length },
    { band: "80–90", count: state.checkins.filter((c) => c.survivalPercent >= 80 && c.survivalPercent < 90).length },
    { band: "90–95", count: state.checkins.filter((c) => c.survivalPercent >= 90 && c.survivalPercent < 95).length },
    { band: "95%+", count: state.checkins.filter((c) => c.survivalPercent >= 95).length },
  ];

  const mine = state.advisories.filter((a) => a.scientistId === currentUser.id);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Scientific panel"
        title={pending.length ? `${pending.length} reports await verification` : "Review queue is clear"}
        scene="canopy"
        mascot={pending.length ? "sprout-reading" : "sprout-celebrating"}
        figures={[
          { value: co2, unit: "kg CO₂/yr", note: `published under ${CARBON_METHOD_VERSION}` },
          { value: survival, unit: "%", decimals: 1, note: "verified survival applied" },
          { value: flagged.length, unit: "flagged", note: "carrying a live advisory" },
        ]}
        actions={
          <Link href="/science/monitoring-review">
            <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
              Open the review queue
              <ArrowUpRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Awaiting review",
              value: pending.length,
              note: "not yet in any figure",
              viz: <VizPips states={state.checkins.map((c) => c.status !== "pending_review")} color="#B7791F" />,
            },
            {
              label: "Verified",
              value: verified.length,
              note: "feeding the carbon engine",
              viz: <VizBars values={verified.map((c) => c.survivalPercent)} color="#52B788" />,
            },
            {
              label: "Species",
              value: state.species.length,
              note: "in the sequestration table",
              viz: <VizBars values={state.species.map((s) => s.co2PerYear)} />,
            },
            {
              label: "Advisories",
              value: state.advisories.length,
              note: `${mine.length} written by you`,
              viz: <VizPips states={state.advisories.map((a) => a.status === "published")} color="#3B7EA1" />,
            },
          ]}
        />
      </Reveal>

      {/* ------------------------------------------------------- the queue */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Verification"
            title="Reports waiting on you"
            note="Verifying counts a report into published CO₂; flagging raises an advisory automatically"
          />
        </Reveal>

        <div className="space-y-3.5">
          {pending.length === 0 && (
            <Awaiting
              pose="sprout-celebrating"
              title="Nothing to verify"
              body="New field reports land here the moment a volunteer logs a geo-tagged visit."
            />
          )}

          {pending.slice(0, 5).map((c, i) => {
            const low = c.survivalPercent < 85;
            return (
              <Reveal key={c.id} delay={0.04 * i}>
                <div
                  className={
                    "flex flex-col gap-5 rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] lg:flex-row lg:items-center " +
                    (low ? "border-[#E8B4A6]" : "border-line")
                  }
                >
                  <span
                    className={
                      "flex size-12 shrink-0 items-center justify-center rounded-xl font-onest text-[15px] font-semibold " +
                      (low ? "bg-[#FBDDD2] text-[#B4553F]" : "bg-[#D8F3DC] text-ink-brand")
                    }
                  >
                    {Math.round(c.survivalPercent)}%
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/sites/${c.siteId}`}
                        className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong underline-offset-4 hover:underline"
                      >
                        {siteName(c.siteId)}
                      </Link>
                      {low && <Pill tone="red">below threshold</Pill>}
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-faint">
                      {c.survivalCount}/{c.totalTrees} alive · {c.photos} photos ·{" "}
                      {formatDateRelative(c.date)}
                    </p>
                    {c.notes && (
                      <p className="mt-1.5 truncate text-[13px] text-ink-soft">
                        &ldquo;{c.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      onClick={() =>
                        reviewCheckin({ checkinId: c.id, verdict: "verified", scientistId: currentUser.id })
                      }
                      className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                    >
                      <Check className="mr-1.5 size-4" />
                      Verify
                    </Button>
                    <Button
                      onClick={() =>
                        reviewCheckin({ checkinId: c.id, verdict: "flagged", scientistId: currentUser.id })
                      }
                      variant="outline"
                      className="h-10 rounded-full border-[#E8B4A6] px-5 text-[#B4553F] hover:bg-[#FBDDD2]/40 hover:text-[#8B4A38]"
                    >
                      <AlertTriangle className="mr-1.5 size-4" />
                      Flag
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------ distribution */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Population"
            title="How survival is distributed"
            note="A long left tail is where corrective advisories should be going"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={buckets} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis
                    dataKey="band"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: "#9AA39C", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9AA39C", fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#52B788" radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ChartContainer>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                The engine, right now
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure label="Method" value={CARBON_METHOD_VERSION} note="in use for every figure" />
                <InvertedFigure label="Plans covered" value={state.plans.length} note="running through the engine" />
                <InvertedFigure label="Survival input" value={`${survival.toFixed(1)}%`} note="verified check-ins only" />
                <InvertedFigure label="Output" value={`${(co2 / 1000).toFixed(2)} t`} note="CO₂ per year, published" />
              </div>
              <Link href="/science/carbon-engine" className="mt-7 inline-block">
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-white/25 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"
                >
                  Open the engine
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
