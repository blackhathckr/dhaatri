"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, animate } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Compass,
  Droplets,
  MapPin,
  Sprout,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getUserById } from "@/data/mock";
import { useSiteBundle, useData, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { SITE_STATUS_LABELS } from "@/lib/constants";
import { formatArea, formatCurrency, formatDate, formatDateRelative } from "@/lib/format";
import type { SiteStatus } from "@/data/types";

/* ------------------------------------------------------------------ shared */

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Proposal §5 — a site moves through these seven states, in order. */
const LIFECYCLE: SiteStatus[] = [
  "pending",
  "assessed",
  "planned",
  "approved",
  "fulfilled",
  "active",
  "completed",
];

/** What actually has to happen for a site to leave each stage. */
const STAGE_NOTE: Record<SiteStatus, string> = {
  pending: "Registered, awaiting a volunteer visit",
  assessed: "Soil, sun and water measured on site",
  planned: "Species mix and layout drawn up",
  approved: "Plan signed off and funded",
  fulfilled: "Saplings delivered and planted",
  active: "Growing, under geo-tagged monitoring",
  completed: "Handed over to long-term stewardship",
};

/** Distinct enough to read side by side in the composition bar. */
const SPECIES_COLORS = ["#1B4332", "#2D6A4F", "#52B788", "#7A9E3F", "#95D5B2", "#B7791F"];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);
  return (
    <>
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}

/** A section heading — used instead of card titles so the page reads as one story. */
function SectionHead({
  eyebrow,
  title,
  note,
  right,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52B788]">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.8px] text-ink-strong">
          {title}
        </h2>
        {note && <p className="mt-1 text-[13px] text-ink-faint">{note}</p>}
      </div>
      {right}
    </div>
  );
}

/** Nothing here yet — say why, and what unlocks it. */
function Awaiting({
  pose,
  title,
  body,
}: {
  pose: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 py-12">
      <Image src={`/mascot/${pose}.png`} alt="" width={104} height={104} />
      <p className="mt-3 font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
        {title}
      </p>
      <p className="mt-1 max-w-[380px] text-center text-[13px] leading-5 text-ink-faint">
        {body}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ journey */

function Journey({ status }: { status: SiteStatus }) {
  const at = Math.max(0, LIFECYCLE.indexOf(status));
  const pct = (at / (LIFECYCLE.length - 1)) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-6">
      <div className="relative">
        {/* the track, and the distance actually travelled along it */}
        <div className="absolute left-0 right-0 top-[15px] h-[3px] rounded-full bg-track" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: EASE }}
          className="absolute left-0 top-[15px] h-[3px] rounded-full bg-[#52B788]"
        />

        <div className="relative grid grid-cols-7 gap-1">
          {LIFECYCLE.map((stage, i) => {
            const done = i < at;
            const here = i === at;
            return (
              <div key={stage} className="flex flex-col items-center text-center">
                <span
                  className={
                    "flex size-[33px] items-center justify-center rounded-full text-[12px] font-semibold transition-colors " +
                    (here
                      ? "bg-[#1B4332] text-white ring-4 ring-[#D8F3DC]"
                      : done
                        ? "bg-[#52B788] text-white"
                        : "bg-surface text-ink-ghost ring-1 ring-line")
                  }
                >
                  {done ? <CheckCircle2 className="size-4" /> : i + 1}
                </span>
                <span
                  className={
                    "mt-2.5 text-[12px] font-medium leading-tight " +
                    (here ? "text-ink-strong" : done ? "text-ink-soft" : "text-ink-ghost")
                  }
                >
                  {SITE_STATUS_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-surface-3 px-4 py-3.5">
        <Sprout className="mt-0.5 size-4 shrink-0 text-ink-brand" />
        <p className="text-[13px] leading-5 text-ink-soft">
          <span className="font-semibold text-ink-strong">
            {SITE_STATUS_LABELS[status]}
          </span>{" "}
          — {STAGE_NOTE[status]}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

const survivalConfig = {
  survival: { label: "Survival", color: "#2D6A4F" },
} satisfies ChartConfig;

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;

  const { species: speciesTable } = useData();
  const { site, assessment, plan, checkins, advisories, order, trees, latest } =
    useSiteBundle(siteId);

  if (!site) {
    return (
      <div className="flex flex-col items-center py-24">
        <Image src="/mascot/sprout-sad.png" alt="" width={140} height={140} />
        <p className="mt-4 font-onest text-xl font-semibold tracking-[-0.5px] text-ink-strong">
          That site isn&apos;t here
        </p>
        <p className="mt-1 text-[13px] text-ink-faint">
          It may have been removed, or the link is wrong.
        </p>
        <Link href="/sites" className="mt-6">
          <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to sites
          </Button>
        </Link>
      </div>
    );
  }

  const owner = getUserById(site.ownerId);
  const survival = latest?.survivalPercent ?? null;

  // CO₂ recomputed here rather than read off the plan, so the figure moves with
  // verified survival instead of staying at the optimistic planning number.
  const co2 = plan ? computeCo2(plan.species, speciesTable, survival ?? 100) : 0;

  const trend = checkins.map((c) => ({
    date: new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    survival: c.survivalPercent,
  }));

  const published = advisories.filter((a) => a.status === "published");

  return (
    <div className="space-y-8">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src={
              site.status === "completed" || site.status === "active"
                ? "/scenes/canopy-banner.png"
                : "/scenes/empty-plot.png"
            }
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/40" />

          <div className="relative p-6 lg:p-9">
            <Link
              href="/sites"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              All sites
            </Link>

            <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-[#52B788]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#95D5B2]">
                    {SITE_STATUS_LABELS[site.status]}
                  </span>
                  <span className="text-[13px] text-white/45">
                    Registered by {owner?.name ?? "—"}
                  </span>
                </div>

                <h1 className="mt-3 font-onest text-[28px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[38px]">
                  {site.name}
                </h1>

                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/50">
                  <MapPin className="size-3.5" />
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} ·{" "}
                  {formatArea(site.area)}
                </p>

                <div className="mt-7 flex flex-wrap items-end gap-x-9 gap-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-white">
                        <CountUp value={trees} />
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">trees</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">in the plan</p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-white">
                        {survival === null ? "—" : <CountUp value={survival} decimals={1} />}
                      </span>
                      {survival !== null && (
                        <span className="text-sm font-medium text-[#95D5B2]">% alive</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      {latest ? `verified ${formatDateRelative(latest.date)}` : "not yet checked"}
                    </p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-white">
                        <CountUp value={co2} />
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">kg CO₂/yr</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      method {CARBON_METHOD_VERSION}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative shrink-0 self-end">
                <div className="absolute inset-0 rounded-full bg-[#52B788]/15 blur-2xl" />
                <Image
                  src={
                    survival === null
                      ? "/mascot/sprout-planting.png"
                      : survival >= 90
                        ? "/mascot/sprout-celebrating.png"
                        : "/mascot/sprout-watering.png"
                  }
                  alt=""
                  width={132}
                  height={132}
                  className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========================================================= journey */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Where it stands"
            title="The seven stages"
            note="Nothing advances until the previous step produces evidence"
          />
        </Reveal>
        <Reveal delay={0.05}>
          <Journey status={site.status} />
        </Reveal>
      </section>

      {/* ============================================================ land */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="The land"
            title="What the plot is made of"
            note="As registered, then confirmed on the ground"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Reveal delay={0.05}>
            <div className="h-full overflow-hidden rounded-2xl border border-line bg-surface">
              {[
                { k: "Area", v: formatArea(site.area), extra: assessment ? `confirmed ${formatArea(assessment.areaConfirmed)}` : "not yet confirmed" },
                { k: "Soil", v: site.soilType, extra: assessment ? `pH ${assessment.soilPh}` : "pH pending" },
                { k: "Sunlight", v: site.sunlight, extra: assessment ? `${assessment.sunlightHours} per day` : "hours pending" },
                { k: "Water", v: site.waterAccess, extra: assessment ? assessment.waterSource : "source pending" },
                { k: "Owner", v: owner?.name ?? "—", extra: owner?.location ?? "" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-[15px] last:border-b-0 transition-colors hover:bg-surface-2"
                >
                  <span className="text-[13px] font-medium text-ink-faint">{row.k}</span>
                  <span className="flex items-baseline gap-2.5 text-right">
                    <span className="text-[15px] font-semibold text-ink-strong">{row.v}</span>
                    <span className="text-[12px] text-ink-ghost">{row.extra}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* the plot drawn to scale against a 2,000 sqm reference frame */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
                Plot footprint
              </p>

              <div className="relative mt-4 flex flex-1 items-center justify-center rounded-xl bg-surface-3 p-4">
                <div className="relative aspect-square w-full rounded-lg border border-dashed border-[#D5DECF]">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    style={{
                      width: `${Math.min(100, Math.sqrt(site.area / 2000) * 100)}%`,
                      height: `${Math.min(100, Math.sqrt(site.area / 2000) * 100)}%`,
                    }}
                    className="absolute bottom-0 left-0 rounded-md bg-[#7A9E3F]/30 ring-1 ring-[#7A9E3F]/55"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-medium text-[#B8C2B0]">
                    2,000 sqm
                  </span>
                </div>
              </div>

              <p className="mt-4 font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-ink-strong">
                {site.area.toLocaleString("en-IN")}
                <span className="ml-1.5 text-[13px] font-medium text-ink-faint">sqm</span>
              </p>

              <div className="mt-4 flex items-center gap-4 text-[12px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Sun className="size-3.5 text-[#B7791F]" />
                  {site.sunlight}
                </span>
                <span className="flex items-center gap-1.5">
                  <Droplets className="size-3.5 text-[#3B7EA1]" />
                  {site.waterAccess}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================== assessment */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Field assessment"
            title="What the volunteer found"
            note={
              assessment
                ? `Visited ${formatDate(assessment.date)} by ${getUserById(assessment.volunteerId)?.name ?? "—"}`
                : undefined
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {assessment ? (
            <div className="relative overflow-hidden rounded-2xl bg-[#1B4332] p-6 lg:p-8">
              <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#52B788]/12 blur-3xl" />

              <div className="relative grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { l: "Soil pH", v: assessment.soilPh.toFixed(1), s: assessment.soilType },
                  { l: "Area confirmed", v: assessment.areaConfirmed.toLocaleString("en-IN"), s: "square metres" },
                  { l: "Sunlight", v: assessment.sunlightHours, s: "direct, per day" },
                  { l: "Water source", v: assessment.waterSource, s: "on or near site" },
                ].map((f) => (
                  <div key={f.l}>
                    <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#95D5B2]">
                      {f.l}
                    </p>
                    <p className="mt-2.5 truncate font-onest text-[28px] font-semibold leading-none tracking-[-1px] text-white">
                      {f.v}
                    </p>
                    <p className="mt-1.5 truncate text-[13px] text-white/45">{f.s}</p>
                  </div>
                ))}
              </div>

              <div className="relative mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#95D5B2]">
                    Obstacles noted
                  </p>
                  <p className="mt-1.5 text-[15px] text-white/80">{assessment.obstacles}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[13px] text-white/70">
                  <Camera className="size-3.5 text-[#95D5B2]" />
                  {assessment.photos} photos on file
                </span>
              </div>
            </div>
          ) : (
            <Awaiting
              pose="sprout-thinking"
              title="Not assessed yet"
              body="A volunteer visits the plot to measure soil, sunlight and water access. The plan can't be drawn up until they have."
            />
          )}
        </Reveal>
      </section>

      {/* ============================================================ plan */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Plantation plan"
            title="What goes in the ground"
            note={plan ? `${plan.method} method · ${plan.layout} · version ${plan.version}` : undefined}
            right={
              plan && (
                <span className="rounded-full bg-[#E9F5EE] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.6px] text-ink-brand">
                  {plan.status}
                </span>
              )
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {plan ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {/* species mix as one proportional bar — a legend of coloured
                  squares makes you do the arithmetic the bar already did */}
              <div className="border-b border-line p-6">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {plan.species.map((sp, i) => (
                    <motion.span
                      key={sp.speciesId}
                      initial={{ width: 0 }}
                      animate={{ width: `${(sp.quantity / trees) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE }}
                      style={{ background: SPECIES_COLORS[i % SPECIES_COLORS.length] }}
                      title={`${sp.name} — ${sp.quantity}`}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-0">
                  {plan.species.map((sp, i) => {
                    const ref = speciesTable.find((s) => s.id === sp.speciesId);
                    return (
                      <div
                        key={sp.speciesId}
                        className="flex items-center gap-4 border-b border-line-soft py-3.5 last:border-b-0"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: SPECIES_COLORS[i % SPECIES_COLORS.length] }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-ink-strong">
                            {sp.name}
                          </p>
                          <p className="truncate text-[12px] italic text-ink-ghost">
                            {ref?.scientificName ?? "—"}
                            {ref?.kannadaName ? ` · ${ref.kannadaName}` : ""}
                          </p>
                        </div>
                        <div className="w-20 shrink-0 text-right">
                          <p className="font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                            {sp.quantity}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-faint">saplings</p>
                        </div>
                        <div className="w-24 shrink-0 text-right max-sm:hidden">
                          <p className="font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-brand">
                            {((ref?.co2PerYear ?? 20) * sp.quantity).toLocaleString("en-IN")}
                          </p>
                          <p className="mt-1 text-[11px] text-ink-faint">kg CO₂/yr</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { l: "Total saplings", v: trees.toLocaleString("en-IN"), s: `${plan.method} planting` },
                  { l: "Plan cost", v: formatCurrency(plan.cost), s: order ? `order ${order.status}` : "not yet ordered" },
                  { l: "CO₂ at current survival", v: `${co2.toLocaleString("en-IN")} kg`, s: `method ${CARBON_METHOD_VERSION}` },
                ].map((f) => (
                  <div key={f.l} className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                      {f.l}
                    </p>
                    <p className="mt-2 font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-ink-strong">
                      {f.v}
                    </p>
                    <p className="mt-1.5 text-[12px] text-ink-faint">{f.s}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Awaiting
              pose="sprout-reading"
              title="No plan drawn up yet"
              body="Dhaatri prepares the species mix and layout from the assessment findings, then sends it for approval."
            />
          )}
        </Reveal>
      </section>

      {/* ====================================================== monitoring */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Monitoring"
            title="Is it actually alive?"
            note={`${checkins.length} geo-tagged ${checkins.length === 1 ? "visit" : "visits"} logged`}
            right={
              latest && (
                <span className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-ink-soft ring-1 ring-[#EBE6DE]">
                  Latest visit {latest.status.replace("_", " ")}
                </span>
              )
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {checkins.length ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[13px] font-medium text-ink-soft">Survival over time</p>
                <ChartContainer config={survivalConfig} className="mt-4 h-[240px] w-full">
                  <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fillSiteSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#52B788" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EBE6DE" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fill: "#9AA39C", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[60, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#9AA39C", fontSize: 12 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Area
                      dataKey="survival"
                      type="monotone"
                      stroke="#2D6A4F"
                      strokeWidth={2.5}
                      fill="url(#fillSiteSurvival)"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              {/* the visits themselves, newest first, on a vertical rail */}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[13px] font-medium text-ink-soft">Visit log</p>

                <div className="relative mt-5 space-y-5 pl-5">
                  <span className="absolute bottom-2 left-[5px] top-2 w-px bg-track" />

                  {[...checkins].reverse().map((c) => (
                    <div key={c.id} className="relative">
                      <span
                        className={
                          "absolute -left-5 top-1 size-[11px] rounded-full ring-4 ring-surface " +
                          (c.status === "verified"
                            ? "bg-[#52B788]"
                            : c.status === "flagged"
                              ? "bg-[#C1414A]"
                              : "bg-[#B7791F]")
                        }
                      />
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[13px] font-semibold text-ink-strong">
                          {formatDate(c.date)}
                        </p>
                        <p className="font-onest text-[15px] font-semibold tracking-[-0.4px] text-ink-brand">
                          {c.survivalPercent}%
                        </p>
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        {c.survivalCount}/{c.totalTrees} alive · {c.photos} photos ·{" "}
                        {getUserById(c.userId)?.name ?? "—"}
                      </p>
                      {c.notes && (
                        <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">
                          &ldquo;{c.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Awaiting
              pose="sprout-watering"
              title="No check-ins logged"
              body="Once planting is done, geo-tagged visits record how many trees are still alive. That number is what the CO₂ figure rests on."
            />
          )}
        </Reveal>
      </section>

      {/* ====================================================== advisories */}
      {published.length > 0 && (
        <section>
          <Reveal>
            <SectionHead
              eyebrow="Scientific panel"
              title="Advisories for this site"
              note="Published guidance from the monitoring scientists"
            />
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            {published.map((a, i) => (
              <Reveal key={a.id} delay={0.05 * i}>
                <div className="h-full rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_rgba(4,39,24,0.4)]">
                  <div className="flex items-center gap-2.5">
                    <Compass className="size-4 text-[#3B7EA1]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                      {a.type}
                    </span>
                    <span className="ml-auto text-[12px] text-ink-ghost">
                      {formatDate(a.date)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[23px] text-ink-soft">{a.content}</p>
                  <p className="mt-4 text-[12px] text-ink-ghost">
                    {getUserById(a.scientistId)?.name ?? "Scientific panel"}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
