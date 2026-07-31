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
import { ArrowDownRight, ArrowUpRight, FileText, Receipt, ShieldCheck } from "lucide-react";

import { SiteNav } from "@/components/landing/site-nav";
import CTAFooter from "@/components/landing/cta-footer";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { MOCK_FUND_LEDGER, MOCK_DONATIONS, MOCK_SITES } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/format";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Category → colour, so inflow and outflow read by hue across every chart. */
const CATEGORY = {
  sapling_payment: { label: "Sapling payments", ink: "#2D6A4F" },
  donation: { label: "Donations", ink: "#52B788" },
  carbon_credit: { label: "Carbon credits", ink: "#3B7EA1" },
  supplier_payment: { label: "Supplier payments", ink: "#B7791F" },
  operations: { label: "Operations", ink: "#6B5CA5" },
  logistics: { label: "Logistics", ink: "#B4553F" },
} as const;

function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
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
      {n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
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

const flowConfig = { inflow: { label: "In", color: "#52B788" }, outflow: { label: "Out", color: "#B7791F" } } satisfies ChartConfig;
const splitConfig = { amount: { label: "Amount", color: "#2D6A4F" } } satisfies ChartConfig;

export default function TransparencyPage() {
  const inflows = MOCK_FUND_LEDGER.filter((t) => t.type === "inflow");
  const outflows = MOCK_FUND_LEDGER.filter((t) => t.type === "outflow");
  const totalIn = inflows.reduce((s, t) => s + t.amount, 0);
  const totalOut = outflows.reduce((s, t) => s + t.amount, 0);
  const available = totalIn - totalOut;
  const utilisation = totalIn ? (totalOut / totalIn) * 100 : 0;

  /** Cumulative balance over time — the shape of the fund, not just its total. */
  const ordered = [...MOCK_FUND_LEDGER].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const balance = ordered.reduce<{ date: string; balance: number }[]>((acc, t) => {
    const prev = acc.length ? acc[acc.length - 1].balance : 0;
    acc.push({
      date: new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      balance: prev + (t.type === "inflow" ? t.amount : -t.amount),
    });
    return acc;
  }, []);

  const bucket = (rows: typeof MOCK_FUND_LEDGER) =>
    Object.entries(
      rows.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {})
    )
      .map(([k, amount]) => ({
        key: k,
        name: CATEGORY[k as keyof typeof CATEGORY]?.label ?? k,
        ink: CATEGORY[k as keyof typeof CATEGORY]?.ink ?? "#9AA39C",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

  const inSplit = bucket(inflows);
  const outSplit = bucket(outflows);
  const receipted = MOCK_DONATIONS.filter((d) => d.receiptId).length;

  /** Money tied to a specific plantation — the §4.3 promise, made visible. */
  const perSiteFunding = MOCK_SITES.map((site) => {
    const rows = MOCK_FUND_LEDGER.filter((t) => t.siteId === site.id);
    return {
      id: site.id,
      name: site.name,
      count: rows.length,
      total: rows.reduce((sum, t) => sum + t.amount, 0),
    };
  })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxSiteFunding = Math.max(1, ...perSiteFunding.map((s) => s.total));

  /** Grouped by month so the ledger reads as periods, not one endless wall. */
  const byMonth = Object.entries(
    [...MOCK_FUND_LEDGER]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .reduce<Record<string, typeof MOCK_FUND_LEDGER>>((acc, t) => {
        const key = new Date(t.date).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        });
        (acc[key] ||= []).push(t);
        return acc;
      }, {})
  );

  return (
    <div className="min-h-screen bg-cream">
      <SiteNav />

      {/* ============================================================ hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/scenes/forest-banner.png" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/72 to-cream" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <Reveal>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <ShieldCheck className="size-4 text-mint" />
              <span className="text-[15px] font-medium text-white/85">
                Every rupee, purpose-tagged
              </span>
            </div>

            <h1 className="mt-6 max-w-[780px] font-onest text-[38px] font-semibold leading-[1.05] tracking-[-2px] text-white sm:text-[52px] lg:text-[62px]">
              Where the money{" "}
              <span className="font-playfair italic font-semibold text-mint">actually</span> goes
            </h1>

            <p className="mt-5 max-w-[600px] text-lg leading-[30px] tracking-[-0.3px] text-white/60">
              Every inflow and outflow is recorded against its purpose, its category and the
              plantation it benefits — published in full, not summarised.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-20 lg:grid-cols-4">
            {[
              { v: totalIn, label: "received", note: `${inflows.length} inflows` },
              { v: totalOut, label: "utilised", note: `${outflows.length} disbursements` },
              { v: available, label: "available", note: "unallocated balance" },
            ].map((m, i) => (
              <Reveal key={m.label} delay={0.1 * i}>
                <p className="font-onest text-[38px] font-semibold leading-none tracking-[-1.8px] text-white lg:text-[48px]">
                  ₹<Counter value={m.v} />
                </p>
                <p className="mt-3 text-[15px] font-medium text-mint">{m.label}</p>
                <p className="mt-0.5 text-[13px] text-white/45">{m.note}</p>
              </Reveal>
            ))}

            <Reveal delay={0.3}>
              <p className="font-onest text-[38px] font-semibold leading-none tracking-[-1.8px] text-white lg:text-[48px]">
                <Counter value={utilisation} decimals={1} />%
              </p>
              <p className="mt-3 text-[15px] font-medium text-mint">utilisation</p>
              <p className="mt-0.5 text-[13px] text-white/45">of funds received</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================================================== charts */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Reveal>
            <div className="h-full rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
                Cumulative
              </p>
              <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
                Fund balance over time
              </h2>
              <p className="mt-1 text-[13px] text-ink/45">
                Every transaction, in the order it happened
              </p>

              <ChartContainer config={flowConfig} className="mt-6 h-[260px] w-full">
                <AreaChart data={balance} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#52B788" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#9AA39C", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9AA39C", fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area dataKey="balance" type="monotone" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#fillBalance)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
                Where it came from
              </p>
              <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
                Inflow sources
              </h2>

              <ChartContainer config={splitConfig} className="mx-auto mt-4 aspect-square h-[180px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={inSplit} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                    {inSplit.map((d) => <Cell key={d.key} fill={d.ink} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <ul className="mt-4 space-y-2">
                {inSplit.map((d) => (
                  <li key={d.key} className="flex items-center justify-between text-[14px]">
                    <span className="flex items-center gap-2 text-ink/70">
                      <span className="size-2.5 rounded-full" style={{ background: d.ink }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-ink">{formatCurrency(d.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="mt-5 rounded-[24px] border border-ink/8 bg-white p-6 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink/40">
              Where it went
            </p>
            <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.6px] text-ink">
              Utilisation by category
            </h2>

            <ChartContainer config={splitConfig} className="mt-6 h-[220px] w-full">
              <BarChart data={outSplit} layout="vertical" margin={{ left: 90, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#EBE6DE" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#9AA39C", fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={{ fill: "#6B7F75", fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={34}>
                  {outSplit.map((d) => <Cell key={d.key} fill={d.ink} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </Reveal>
      </section>

      {/* ================================================ rupee breakdown */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <Reveal>
          <div className="relative grid gap-10 overflow-hidden rounded-[32px] bg-ink p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:p-14">
            <div className="pointer-events-none absolute -left-24 -top-28 size-[420px] rounded-full bg-fresh/10 blur-3xl" />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] text-mint">
                Follow one rupee
              </p>
              <h2 className="mt-4 font-onest text-[30px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[42px]">
                Where every ₹100 lands
              </h2>
              <p className="mt-5 max-w-[440px] text-[17px] leading-[29px] text-white/60">
                Not an allocation policy — this is the actual split of money already
                disbursed, computed from the ledger below.
              </p>

              {/* One continuous bar: the whole rupee, split by real spend. */}
              <div className="mt-9">
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  {outSplit.map((d) => (
                    <div
                      key={d.key}
                      style={{ width: `${(d.amount / totalOut) * 100}%`, background: d.ink }}
                      className="h-full transition-all duration-500 hover:brightness-110"
                      title={`${d.name}: ${formatCurrency(d.amount)}`}
                    />
                  ))}
                </div>

                <ul className="mt-7 space-y-4">
                  {outSplit.map((d, i) => (
                    <motion.li
                      key={d.key}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.08 * i, ease: EASE }}
                      className="flex items-center gap-4"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: d.ink }}
                      />
                      <span className="flex-1 text-[15px] text-white/70">{d.name}</span>
                      <span className="font-onest text-[20px] font-semibold tabular-nums text-white">
                        ₹{Math.round((d.amount / totalOut) * 100)}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute size-64 rounded-full bg-mint/10 blur-2xl" />
              <Image
                src="/mascot/sprout-reading.png"
                alt=""
                width={280}
                height={280}
                className="relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================================== funding per site */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[1.5px] text-emerald">
            Money, tied to ground
          </p>
          <h2 className="mt-3 font-onest text-[30px] font-semibold leading-[1.1] tracking-[-1.5px] text-ink lg:text-[40px]">
            What each plantation received
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {perSiteFunding.map((s, i) => (
            <Reveal key={s.id} delay={0.06 * i}>
              <div className="group h-full overflow-hidden rounded-[20px] border border-ink/8 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(4,39,24,0.35)]">
                <div className="relative h-24 overflow-hidden bg-pale">
                  <Image
                    src="/features/ledger.png"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                </div>

                <div className="p-6 pt-2">
                  <h3 className="font-onest text-[18px] font-semibold tracking-[-0.4px] text-ink">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-ink/45">
                    {s.count} {s.count === 1 ? "transaction" : "transactions"}
                  </p>

                  <p className="mt-5 font-onest text-[28px] font-semibold leading-none tracking-[-1.2px] text-emerald">
                    {formatCurrency(s.total)}
                  </p>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-shell">
                    <div
                      className="h-full rounded-full bg-fresh"
                      style={{ width: `${(s.total / maxSiteFunding) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ========================================================= ledger */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[1.5px] text-emerald">
                Nothing summarised
              </p>
              <h2 className="mt-3 font-onest text-[30px] font-semibold leading-[1.1] tracking-[-1.5px] text-ink lg:text-[40px]">
                The complete ledger
              </h2>
            </div>
            <p className="flex items-center gap-2 text-[14px] text-ink/50">
              <Receipt className="size-4 text-emerald" />
              {receipted} of {MOCK_DONATIONS.length} donations receipted
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 space-y-8">
            {byMonth.map(([month, rows]) => (
              <div key={month}>
                {/* Month rule breaks the wall of rows into readable groups. */}
                <div className="mb-3 flex items-center gap-4">
                  <span className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink/70">
                    {month}
                  </span>
                  <span className="h-px flex-1 bg-ink/10" />
                  <span className="text-[13px] tabular-nums text-ink/40">
                    {rows.length} {rows.length === 1 ? "entry" : "entries"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-ink/8 bg-white">
                  {rows.map((t, i) => {
                    const inflow = t.type === "inflow";
                    const cat = CATEGORY[t.category as keyof typeof CATEGORY];
                    const site = t.siteId
                      ? MOCK_SITES.find((x) => x.id === t.siteId)
                      : undefined;

                    return (
                      <div
                        key={t.id}
                        className={`group relative flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-canvas sm:flex-row sm:items-center ${i > 0 ? "border-t border-ink/8" : ""}`}
                      >
                        {/* Direction rail — reads as in/out before you read a word. */}
                        <span
                          className={`absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100 ${inflow ? "bg-fresh" : "bg-[#B7791F]"}`}
                        />

                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${inflow ? "bg-pale" : "bg-[#FAEDCD]"}`}
                        >
                          {inflow ? (
                            <ArrowDownRight className="size-4 text-emerald" />
                          ) : (
                            <ArrowUpRight className="size-4 text-[#B7791F]" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-ink">
                            {t.purpose}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink/45">
                            <span>{t.source}</span>
                            <span>·</span>
                            <span>{formatDate(t.date)}</span>
                            {site && (
                              <>
                                <span>·</span>
                                <span className="text-emerald">{site.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium"
                          style={{
                            background: `${cat?.ink ?? "#9AA39C"}1A`,
                            color: cat?.ink ?? "#6B7F75",
                          }}
                        >
                          {cat?.label ?? t.category}
                        </span>

                        <p
                          className={`shrink-0 font-onest text-[17px] font-semibold tabular-nums sm:w-32 sm:text-right ${inflow ? "text-emerald" : "text-[#B7791F]"}`}
                        >
                          {inflow ? "+" : "−"}
                          {formatCurrency(t.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col gap-4 rounded-[20px] bg-ink/[0.04] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-[14px] leading-6 text-ink/60">
              <FileText className="mt-0.5 size-4 shrink-0 text-emerald" />
              Donation receipts and an auditable trail are built in. Applicable compliances
              (80G, statutory audit) are confirmed with Dhaatri&apos;s finance advisors
              during the pilot.
            </p>
            <Link
              href="/impact"
              className="group flex shrink-0 items-center gap-2 text-[15px] font-medium text-emerald"
            >
              See the impact data
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <CTAFooter />
    </div>
  );
}
