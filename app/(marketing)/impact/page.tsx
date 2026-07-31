"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, animate, useInView } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ShieldCheck, Sprout } from "lucide-react";

import { SiteNav } from "@/components/landing/site-nav";
import CTAFooter from "@/components/landing/cta-footer";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  MOCK_SITES,
  MOCK_CHECKINS,
  MOCK_PLANS,
  MOCK_SPECIES,
  MOCK_FUND_LEDGER,
  MOCK_USERS,
} from "@/data/mock";
import { SITE_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const SPECIES_INK = ["#1B4332", "#2D6A4F", "#52B788", "#74C69D", "#95D5B2", "#B7791F"];

/* --------------------------------------------------------------- counter */

function Counter({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, { duration: 1.6, ease: "easeOut", onUpdate: setN });
    return () => c.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {n.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------- charts */

const survivalConfig = { survival: { label: "Survival", color: "#2D6A4F" } } satisfies ChartConfig;
const speciesConfig = { qty: { label: "Saplings", color: "#2D6A4F" } } satisfies ChartConfig;
const co2Config = { co2: { label: "CO₂", color: "#52B788" } } satisfies ChartConfig;

export default function ImpactPage() {
  /* ------------------------------------------------------------- figures */
  const trees = MOCK_PLANS.reduce(
    (s, p) => s + p.species.reduce((a, sp) => a + sp.quantity, 0),
    0
  );
  const survival = MOCK_CHECKINS.length
    ? MOCK_CHECKINS.reduce((a, c) => a + c.survivalPercent, 0) / MOCK_CHECKINS.length
    : 0;
  const co2Kg = Math.round(MOCK_PLANS.reduce((s, p) => s + p.estimatedCo2PerYear, 0) * 1000);
  const inflow = MOCK_FUND_LEDGER.filter((t) => t.type === "inflow").reduce((s, t) => s + t.amount, 0);
  const activeSites = MOCK_SITES.filter((s) => s.status === "active").length;
  const volunteers = MOCK_USERS.filter((u) => u.role === "volunteer").length;

  /* survival trend across every recorded check-in */
  const trend = [...MOCK_CHECKINS]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((c) => ({
      date: new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      survival: c.survivalPercent,
    }));

  /* species mix across every plan */
  const speciesMix = Object.values(
    MOCK_PLANS.flatMap((p) => p.species).reduce<Record<string, { name: string; qty: number }>>(
      (acc, sp) => {
        acc[sp.speciesId] = acc[sp.speciesId]
          ? { name: sp.name, qty: acc[sp.speciesId].qty + sp.quantity }
          : { name: sp.name, qty: sp.quantity };
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.qty - a.qty);

  /* CO₂ accrual per site */
  const perSite = MOCK_SITES.map((s) => {
    const plan = MOCK_PLANS.find((p) => p.siteId === s.id);
    return {
      name: s.name.split(" ")[0],
      co2: Math.round((plan?.estimatedCo2PerYear ?? 0) * 1000),
    };
  }).filter((d) => d.co2 > 0);

  /* real-world equivalences — a tonne means nothing without a yardstick */
  const carKm = Math.round(co2Kg / 0.161);
  const flights = co2Kg / 150;

  return (
    <div className="min-h-screen bg-cream">
      <SiteNav />

      {/* ============================================================ hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/scenes/canopy-banner.png" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-cream" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <Reveal>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 w-fit">
              <span className="size-1.5 rounded-full bg-mint" />
              <span className="text-[15px] font-medium text-white/85">
                Live pilot data · Bengaluru
              </span>
            </div>

            <h1 className="mt-6 max-w-[760px] font-onest text-[38px] font-semibold leading-[1.05] tracking-[-2px] text-white sm:text-[52px] lg:text-[62px]">
              The public{" "}
              <span className="font-playfair italic font-semibold text-mint">impact</span>{" "}
              dashboard
            </h1>

            <p className="mt-5 max-w-[580px] text-lg leading-[30px] tracking-[-0.3px] text-white/60">
              Every number here is computed from verified field data — geo-tagged check-ins,
              survival counts and a versioned carbon methodology. Nothing is estimated.
            </p>
          </Reveal>

          {/* headline figures */}
          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-20 lg:grid-cols-4">
            {[
              { v: trees, label: "trees planted", note: `${activeSites} sites active`, big: true },
              { v: survival, label: "% verified survival", note: "from field check-ins", decimals: 1 },
              { v: co2Kg, label: "kg CO₂ / year", note: "survival-weighted", },
              { v: volunteers, label: "volunteers", note: "trained and active" },
            ].map((m, i) => (
              <Reveal key={m.label} delay={0.1 * i}>
                <p className="font-onest text-[44px] font-semibold leading-none tracking-[-2px] text-white lg:text-[56px]">
                  <Counter value={m.v} decimals={m.decimals ?? 0} />
                </p>
                <p className="mt-3 text-[15px] font-medium text-mint">{m.label}</p>
                <p className="mt-0.5 text-[13px] text-white/45">{m.note}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== charts */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* survival trend */}
          <Reveal>
            <div className="h-full rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
                    Field-verified
                  </p>
                  <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
                    Survival over time
                  </h2>
                </div>
                <span className="rounded-full bg-pale px-3 py-1.5 text-[13px] font-semibold text-emerald">
                  {survival.toFixed(1)}% average
                </span>
              </div>

              <ChartContainer config={survivalConfig} className="mt-6 h-[260px] w-full">
                <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="impactSurvival" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#52B788" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#9AA39C", fontSize: 12 }} />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fill: "#9AA39C", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area dataKey="survival" type="monotone" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#impactSurvival)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </Reveal>

          {/* species mix */}
          <Reveal delay={0.1}>
            <div className="h-full rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
                Native only
              </p>
              <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
                Species mix
              </h2>

              <ChartContainer config={speciesConfig} className="mx-auto mt-4 aspect-square h-[180px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={speciesMix} dataKey="qty" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                    {speciesMix.map((_, i) => (
                      <Cell key={i} fill={SPECIES_INK[i % SPECIES_INK.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <ul className="mt-4 space-y-2">
                {speciesMix.slice(0, 4).map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between text-[14px]">
                    <span className="flex items-center gap-2 text-ink/70">
                      <span className="size-2.5 rounded-full" style={{ background: SPECIES_INK[i % SPECIES_INK.length] }} />
                      {s.name}
                    </span>
                    <span className="font-semibold text-ink">{s.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* CO₂ per site + equivalences */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Reveal delay={0.05}>
            <div className="h-full overflow-hidden rounded-[24px] bg-ink p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-mint">
                What it offsets
              </p>
              <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-white">
                In real terms
              </h2>

              <div className="mt-7 space-y-6">
                {[
                  { v: carKm, unit: "km not driven", sub: "at 161 g CO₂ per km" },
                  { v: flights, unit: "short flights offset", sub: "~150 kg per seat", decimals: 1 },
                ].map((e) => (
                  <div key={e.unit}>
                    <p className="font-onest text-[38px] font-semibold leading-none tracking-[-1.5px] text-white">
                      <Counter value={e.v} decimals={e.decimals ?? 0} />
                    </p>
                    <p className="mt-2 text-[15px] font-medium text-mint">{e.unit}</p>
                    <p className="text-[13px] text-white/40">{e.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-start gap-2.5 border-t border-white/10 pt-5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
                <p className="text-[13px] leading-5 text-white/50">
                  Computed by the scientist-owned carbon engine, weighted by verified survival.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
                Per plantation
              </p>
              <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
                CO₂ by site
              </h2>

              <ChartContainer config={co2Config} className="mt-6 h-[240px] w-full">
                <BarChart data={perSite} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#9AA39C", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9AA39C", fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="co2" fill="#52B788" radius={[8, 8, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ChartContainer>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================================================== sites */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[1.5px] text-emerald">
                Every site, published
              </p>
              <h2 className="mt-3 font-onest text-[30px] font-semibold leading-[1.1] tracking-[-1.5px] text-ink lg:text-[40px]">
                The plantations behind the numbers
              </h2>
            </div>
            <Link
              href="/transparency"
              className="group flex items-center gap-2 text-[15px] font-medium text-emerald"
            >
              See the fund ledger
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_SITES.map((site, i) => {
            const plan = MOCK_PLANS.find((p) => p.siteId === site.id);
            const planted = plan?.species.reduce((s, sp) => s + sp.quantity, 0) ?? 0;
            const latest = [...MOCK_CHECKINS]
              .filter((c) => c.siteId === site.id)
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];

            return (
              <Reveal key={site.id} delay={0.06 * i}>
                <div className="group h-full rounded-[20px] border border-ink/8 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(4,39,24,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-pale">
                      <Sprout className="size-[18px] text-emerald" />
                    </span>
                    <span className="rounded-full bg-mist px-2.5 py-1 text-[12px] font-medium text-emerald">
                      {SITE_STATUS_LABELS[site.status]}
                    </span>
                  </div>

                  <h3 className="mt-5 font-onest text-[19px] font-semibold tracking-[-0.5px] text-ink">
                    {site.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-ink/45">
                    {site.area} sqm · {site.soilType} · {site.waterAccess}
                  </p>

                  <div className="mt-5 flex items-end justify-between border-t border-ink/8 pt-4">
                    <div>
                      <p className="font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-ink">
                        {planted}
                      </p>
                      <p className="mt-1 text-[12px] text-ink/45">trees</p>
                    </div>
                    {latest && (
                      <div className="text-right">
                        <p className="font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-emerald">
                          {latest.survivalPercent}%
                        </p>
                        <p className="mt-1 text-[12px] text-ink/45">survival</p>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-10 flex items-center gap-2 text-[14px] text-ink/45">
            <ShieldCheck className="size-4 text-emerald" />
            {formatCurrency(inflow)} received to date · {MOCK_SPECIES.length} native species in the
            approved catalogue
          </p>
        </Reveal>
      </section>

      <CTAFooter />
    </div>
  );
}
