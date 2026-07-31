"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
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
  VizSplit,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from "@/store";
import { formatCurrency, formatDate, formatDateRelative } from "@/lib/format";

/** All-in cost of putting one sapling in the ground and monitoring year one. */
const PER_SAPLING = 120;

export function DonorDashboard() {
  const state = useData();
  const { currentUser } = useAuthContext();

  const mine = state.donations.filter((d) => d.donorId === currentUser.id);
  const given = mine.reduce((a, d) => a + d.amount, 0);
  const saplings = Math.floor(given / PER_SAPLING);

  // Which sites your money actually reached.
  const funded = [...new Set(mine.map((d) => d.siteId).filter(Boolean))] as string[];

  const inflow = state.ledger.filter((l) => l.type === "inflow").reduce((a, l) => a + l.amount, 0);
  const outflow = state.ledger.filter((l) => l.type === "outflow").reduce((a, l) => a + l.amount, 0);

  const spendSplit = (["supplier_payment", "logistics", "operations"] as const).map((cat, i) => ({
    value: state.ledger
      .filter((l) => l.category === cat)
      .reduce((a, l) => a + l.amount, 0),
    color: ["#2D6A4F", "#7A9E3F", "#B7791F"][i],
    label: cat.replace(/_/g, " "),
  }));

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Donor"
        title={given ? "What your money planted" : "Fund the next plot"}
        scene="canopy"
        mascot={given ? "sprout-celebrating" : "sprout-waving"}
        figures={[
          { value: given, unit: "₹ given", note: `${mine.length} contributions` },
          { value: saplings, unit: "saplings", note: "roughly what that funded" },
          {
            value: Math.round(saplings * 48 * 0.48),
            unit: "kg CO₂/yr",
            note: "absorbed in their first year",
          },
        ]}
        actions={
          <Link href="/donations">
            <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
              <Heart className="mr-1.5 size-4" />
              Contribute again
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Contributions",
              value: mine.length,
              note: `${mine.filter((d) => d.receiptId).length} receipts issued`,
              viz: <VizBars values={mine.map((d) => d.amount)} color="#B4553F" />,
            },
            {
              label: "Largest gift",
              value: mine.length ? Math.max(...mine.map((d) => d.amount)) : 0,
              note: "your biggest single contribution",
              viz: <VizBars values={mine.map((d) => d.amount)} color="#B7791F" />,
            },
            {
              label: "Sites reached",
              value: funded.length,
              note: funded.length ? "directed to specific plots" : "general fund only",
              viz: <VizBars values={funded.map(() => 8)} color="#52B788" />,
            },
            {
              label: "Platform balance",
              value: inflow - outflow,
              note: "unallocated across Dhaatri",
              viz: <VizBars values={[inflow / 1000, outflow / 1000]} color="#3B7EA1" />,
            },
          ]}
        />
      </Reveal>

      {/* ---------------------------------------------------- transparency */}
      <Reveal delay={0.12}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Where the fund goes
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <InvertedFigure label="Total in" value={formatCurrency(inflow)} note={`${state.ledger.filter((l) => l.type === "inflow").length} inflows`} />
            <InvertedFigure label="Total out" value={formatCurrency(outflow)} note="spent on the ground" />
            <InvertedFigure label="Available" value={formatCurrency(inflow - outflow)} note="not yet allocated" />
            <InvertedFigure label="Entries" value={state.ledger.length} note="every one public" />
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <VizSplit parts={spendSplit} />
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/55">
              {spendSplit.map((s) => (
                <span key={s.label} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                  <span className="font-semibold text-white">{formatCurrency(s.value)}</span>
                </span>
              ))}
            </p>
          </div>
        </InvertedPanel>
      </Reveal>

      {/* --------------------------------------------------------- record */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Your record"
            title={`${mine.length} ${mine.length === 1 ? "contribution" : "contributions"}`}
            note="Each one has a receipt and a line in the public ledger"
            right={
              <Link href="/donations/receipts">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  Receipts
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {mine.length === 0 ? (
            <Awaiting
              pose="sprout-waving"
              title="Nothing yet"
              body="Your first contribution appears here with its receipt and shows up in the public ledger the same day."
              action={
                <Link href="/donations">
                  <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                    Make a contribution
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {mine.map((d, i) => (
                <Reveal key={d.id} delay={0.04 * i}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] sm:flex-row sm:items-center">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FBDDD2]">
                      <Heart className="size-[18px] text-[#B4553F]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {d.purpose}
                        </p>
                        <Pill tone={toneFor(d.status)}>{d.status}</Pill>
                      </div>
                      <p className="mt-0.5 text-[13px] text-ink-faint">
                        {formatDate(d.date)} · {formatDateRelative(d.date)}
                        {d.receiptId && ` · ${d.receiptId}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-onest text-[22px] font-semibold tracking-[-0.8px] text-ink-strong">
                        {formatCurrency(d.amount)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-faint">
                        ≈ {Math.floor(d.amount / PER_SAPLING)} saplings
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* ----------------------------------------------------- the ledger */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Public record"
            title="Latest ledger movements"
            note="The same ledger any member of the public can read"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <Rail>
              {[...state.ledger]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .slice(0, 8)
                .map((t) => (
                  <RailNode key={t.id} color={t.type === "inflow" ? "#52B788" : "#B7791F"}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-[14px] font-medium text-ink-strong">{t.purpose}</p>
                      <p
                        className={
                          "font-onest text-[15px] font-semibold tracking-[-0.3px] " +
                          (t.type === "inflow" ? "text-ink-brand" : "text-[#B7791F]")
                        }
                      >
                        {t.type === "inflow" ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {t.source} · {t.category.replace(/_/g, " ")} · {formatDate(t.date)}
                    </p>
                  </RailNode>
                ))}
            </Rail>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
