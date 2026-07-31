"use client";

import React from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Reveal,
  SectionHead,
  StatStrip,
  VizBars,
  VizPips,
  VizSplit,
} from "@/components/shared/premium";
import { useData, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { ROLE_LABELS } from "@/lib/roles";
import { formatCurrency } from "@/lib/format";
import type { UserRole } from "@/data/types";

const chartConfig = { survival: { label: "Survival", color: "#2D6A4F" } } satisfies ChartConfig;

const ROLE_COLOR: Record<UserRole, string> = {
  citizen: "#52B788",
  dhaatri_ops: "#1B4332",
  supplier: "#B7791F",
  volunteer: "#7A9E3F",
  scientist: "#3B7EA1",
  donor: "#B4553F",
  organisation: "#6B5CA5",
  admin: "#2D6A4F",
};

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export function AdminDashboard() {
  const state = useData();

  const verified = state.checkins.filter((c) => c.status === "verified");
  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const co2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );
  const trees = state.plans.reduce(
    (a, p) => a + p.species.reduce((s, sp) => s + sp.quantity, 0),
    0
  );

  const inflow = state.ledger.filter((l) => l.type === "inflow").reduce((a, l) => a + l.amount, 0);
  const outflow = state.ledger.filter((l) => l.type === "outflow").reduce((a, l) => a + l.amount, 0);

  const trend = [...state.checkins]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((c) => ({
      date: new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      survival: c.survivalPercent,
    }));

  /** Things that are genuinely wrong right now, rather than a wall of counts. */
  const health = [
    {
      label: "Unverified check-ins",
      value: state.checkins.filter((c) => c.status === "pending_review").length,
      note: "not counted in any published figure",
      href: "/science/monitoring-review",
    },
    {
      label: "Species with no supplier",
      value: state.species.filter(
        (s) => !state.inventory.some((i) => i.speciesId === s.id && i.stock > 0)
      ).length,
      note: "can be planned but not ordered",
      href: "/admin/species-catalogue",
    },
    {
      label: "Sites without a plan",
      value: state.sites.filter((s) => !state.plans.some((p) => p.siteId === s.id)).length,
      note: "registered but not yet designed",
      href: "/sites",
    },
    {
      label: "Flagged sites",
      value: state.checkins.filter((c) => c.status === "flagged").length,
      note: "carrying a corrective advisory",
      href: "/science/advisories",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Platform administration"
        title="Dhaatri at a glance"
        scene="forest"
        mascot="sprout-holding-phone"
        figures={[
          { value: co2, unit: "kg CO₂/yr", note: `published under ${CARBON_METHOD_VERSION}` },
          { value: trees, unit: "trees", note: `across ${state.sites.length} sites` },
          { value: state.users.length, unit: "accounts", note: `in ${ROLES.length} roles` },
        ]}
      />

      {/* ----------------------------------------------------- what's off */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Health"
            title="What needs attention"
            note="Not a count of everything — a count of what's genuinely blocking"
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {health.map((h, i) => (
            <Reveal key={h.label} delay={0.05 * i}>
              <Link href={h.href} className="block h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:border-[#52B788]/50 hover:shadow-[0_18px_40px_-24px_rgba(4,39,24,0.4)]">
                  <div className="flex items-start justify-between">
                    <p
                      className={
                        "font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] " +
                        (h.value > 0 ? "text-ink-strong" : "text-ink-ghost")
                      }
                    >
                      {h.value}
                    </p>
                    <ArrowUpRight className="size-4 -translate-x-1 text-ink-ghost transition-all group-hover:translate-x-0 group-hover:text-ink-brand" />
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-ink-strong">{h.label}</p>
                  <p className="mt-1 flex-1 text-[13px] leading-5 text-ink-faint">{h.note}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal delay={0.1}>
        <StatStrip
          items={[
            {
              label: "Sites",
              value: state.sites.length,
              note: `${state.sites.filter((s) => s.status === "active").length} growing`,
              viz: <VizPips states={state.sites.map((s) => s.status === "active")} />,
            },
            {
              label: "Requests",
              value: state.requests.length,
              note: `${state.requests.filter((r) => r.status !== "completed").length} open`,
              viz: <VizPips states={state.requests.map((r) => r.status === "completed")} color="#3B7EA1" />,
            },
            {
              label: "Orders",
              value: state.orders.length,
              note: `${state.orders.filter((o) => o.status === "delivered").length} delivered`,
              viz: <VizBars values={state.orders.map((o) => o.total / 1000)} color="#B7791F" />,
            },
            {
              label: "Credits issued",
              value: state.credits.reduce((a, c) => a + c.credits, 0),
              decimals: 1,
              note: `${state.credits.length} certificates`,
              viz: <VizBars values={state.credits.map((c) => c.credits)} color="#6B5CA5" />,
            },
          ]}
        />
      </Reveal>

      {/* --------------------------------------------------------- trend */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Trend"
            title="Survival across the platform"
            note="Every point is a geo-tagged visit somebody made"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillAdmin" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#fillAdmin)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Fund position
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure label="In" value={formatCurrency(inflow)} note="all sources" />
                <InvertedFigure label="Out" value={formatCurrency(outflow)} note="all spending" />
                <InvertedFigure
                  label="Available"
                  value={formatCurrency(inflow - outflow)}
                  note="unallocated"
                />
                <InvertedFigure
                  label="Entries"
                  value={state.ledger.length}
                  note="publicly visible"
                />
              </div>
              <Link href="/transparency" className="mt-7 inline-block">
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-white/25 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"
                >
                  Public ledger
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- roles */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Accounts"
            title="Role mix"
            right={
              <Link href="/admin/users">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  Directory
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <VizSplit
              parts={ROLES.map((r) => ({
                value: state.users.filter((u) => u.role === r).length,
                color: ROLE_COLOR[r],
                label: ROLE_LABELS[r],
              }))}
            />
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
              {ROLES.map((r) => (
                <span key={r} className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <span className="size-2.5 rounded-full" style={{ background: ROLE_COLOR[r] }} />
                  {ROLE_LABELS[r]}
                  <span className="font-semibold text-ink-strong">
                    {state.users.filter((u) => u.role === r).length}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
