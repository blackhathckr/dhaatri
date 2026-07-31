"use client";

import React from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  Pill,
  Rail,
  RailNode,
  Reveal,
  SectionHead,
  StatStrip,
  VizBars,
  VizPips,
  VizSplit,
} from "@/components/shared/premium";
import { useData, computeCo2 } from "@/store";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

const chartConfig = { count: { label: "Requests", color: "#2D6A4F" } } satisfies ChartConfig;

const PHASE: Record<string, string> = {
  pending: "Intake",
  assigned: "Intake",
  assessment_scheduled: "Intake",
  assessment_complete: "Intake",
  plan_ready: "Planning",
  plan_review: "Planning",
  approved: "Planning",
  order_placed: "Fulfilment",
  delivered: "Fulfilment",
  planting_scheduled: "Fulfilment",
  planted: "Growing",
  monitoring: "Growing",
  completed: "Growing",
};

const PHASE_COLOR: Record<string, string> = {
  Intake: "#B7791F",
  Planning: "#3B7EA1",
  Fulfilment: "#7A9E3F",
  Growing: "#2D6A4F",
};

export function OpsDashboard() {
  const state = useData();

  const open = state.requests.filter((r) => r.status !== "completed");
  const verified = state.checkins.filter((c) => c.status === "verified");
  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const co2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );

  const inflow = state.ledger.filter((l) => l.type === "inflow").reduce((a, l) => a + l.amount, 0);
  const outflow = state.ledger.filter((l) => l.type === "outflow").reduce((a, l) => a + l.amount, 0);

  const byPhase = (["Intake", "Planning", "Fulfilment", "Growing"] as const).map((p) => ({
    phase: p,
    count: state.requests.filter((r) => PHASE[r.status] === p).length,
  }));

  /* What ops actually has to clear today, in lifecycle order. */
  const queue = [
    {
      label: "Awaiting assessment",
      items: state.sites.filter(
        (s) => s.status === "pending" && !state.assessments.some((a) => a.siteId === s.id)
      ),
      href: "/requests",
      note: "a volunteer task is already raised",
    },
    {
      label: "Assessed, needs a plan",
      items: state.sites.filter(
        (s) =>
          state.assessments.some((a) => a.siteId === s.id) &&
          !state.plans.some((p) => p.siteId === s.id)
      ),
      href: "/requests",
      note: "yours to draw up",
    },
    {
      label: "Approved, needs an order",
      items: state.plans.filter(
        (p) => p.status === "approved" && !state.orders.some((o) => o.planId === p.id)
      ),
      href: "/supply/orders",
      note: "commit stock at a supplier",
    },
    {
      label: "Delivered, needs planting",
      items: state.orders.filter((o) => {
        const plan = state.plans.find((p) => p.id === o.planId);
        const site = state.sites.find((s) => s.id === plan?.siteId);
        return o.status === "delivered" && site && site.status !== "active" && site.status !== "completed";
      }),
      href: "/volunteers/tasks",
      note: "schedule the planting day",
    },
  ];

  const toClear = queue.reduce((a, q) => a + q.items.length, 0);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Dhaatri operations"
        title={toClear ? `${toClear} things need clearing` : "The queue is clear"}
        scene="forest"
        mascot={toClear ? "sprout-holding-phone" : "sprout-celebrating"}
        figures={[
          { value: open.length, unit: "open requests", note: `${state.requests.length} in total` },
          { value: co2, unit: "kg CO₂/yr", note: "published across the platform" },
          { value: inflow - outflow, unit: "₹ available", note: "unallocated in the ledger" },
        ]}
      />

      {/* ------------------------------------------------------- the queue */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Today"
            title="What's waiting on operations"
            note="Each row is a genuine block — nothing downstream moves until it clears"
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {queue.map((q, i) => (
            <Reveal key={q.label} delay={0.05 * i}>
              <Link href={q.href} className="block h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:border-[#52B788]/50 hover:shadow-[0_18px_40px_-24px_rgba(4,39,24,0.4)]">
                  <div className="flex items-start justify-between">
                    <p className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-ink-strong">
                      {q.items.length}
                    </p>
                    <ArrowUpRight className="size-4 -translate-x-1 text-ink-ghost transition-all group-hover:translate-x-0 group-hover:text-ink-brand" />
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-ink-strong">{q.label}</p>
                  <p className="mt-1 flex-1 text-[13px] leading-5 text-ink-faint">{q.note}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ the queue */}
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
              label: "Trees",
              value: state.plans.reduce(
                (a, p) => a + p.species.reduce((s, sp) => s + sp.quantity, 0),
                0
              ),
              note: `across ${state.plans.length} plans`,
              viz: (
                <VizBars
                  values={state.plans.map((p) =>
                    p.species.reduce((s, sp) => s + sp.quantity, 0)
                  )}
                />
              ),
            },
            {
              label: "Survival",
              value: survival,
              decimals: 1,
              note: `${verified.length} verified check-ins`,
              viz: <VizBars values={verified.map((c) => c.survivalPercent)} color="#52B788" />,
            },
            {
              label: "Orders",
              value: state.orders.length,
              note: `${state.orders.filter((o) => o.status !== "delivered").length} in motion`,
              viz: <VizPips states={state.orders.map((o) => o.status === "delivered")} color="#B7791F" />,
            },
          ]}
        />
      </Reveal>

      {/* -------------------------------------------------------- pipeline */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Pipeline"
            title="Where requests are sitting"
            note="A tall bar in one phase is where the bottleneck is"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={byPhase} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis
                    dataKey="phase"
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
                  <Bar dataKey="count" fill="#2D6A4F" radius={[6, 6, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ChartContainer>

              <div className="mt-4 border-t border-line pt-4">
                <VizSplit
                  parts={byPhase.map((p) => ({
                    value: p.count,
                    color: PHASE_COLOR[p.phase],
                    label: p.phase,
                  }))}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Fund position
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure
                  label="In"
                  value={formatCurrency(inflow)}
                  note="donations, adoptions, credits"
                />
                <InvertedFigure
                  label="Out"
                  value={formatCurrency(outflow)}
                  note="suppliers, logistics, operations"
                />
                <InvertedFigure
                  label="Available"
                  value={formatCurrency(inflow - outflow)}
                  note="unallocated right now"
                />
                <InvertedFigure
                  label="Entries"
                  value={state.ledger.length}
                  note="all publicly visible"
                />
              </div>
              <Link href="/donations" className="mt-7 inline-block">
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-white/25 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"
                >
                  Open the ledger
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- activity */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Recent"
            title="Latest movements"
            right={
              <Link href="/requests">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  All requests
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <Rail>
              {[...state.requests]
                .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
                .slice(0, 8)
                .map((r) => {
                  const site = state.sites.find((s) => s.id === r.siteId);
                  return (
                    <RailNode key={r.id} color={PHASE_COLOR[PHASE[r.status]]}>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <Link
                          href={`/requests/${r.id}`}
                          className="text-[14px] font-medium text-ink-strong underline-offset-4 hover:underline"
                        >
                          {site?.name ?? r.siteId}
                        </Link>
                        <Pill tone={r.status === "completed" ? "green" : "amber"}>
                          {REQUEST_STATUS_LABELS[r.status]}
                        </Pill>
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        {r.model === "paid" ? "Paid adoption" : "Stewardship"} · updated{" "}
                        {formatDate(r.updatedAt)}
                      </p>
                    </RailNode>
                  );
                })}
            </Rail>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
