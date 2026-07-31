"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Check, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatCurrency, formatDate, formatDateRelative } from "@/lib/format";

const PRESETS = [1000, 2500, 5000, 10000];

export default function DonationsPage() {
  const { state, donate } = useStore();
  const { currentUser } = useAuthContext();

  const [amount, setAmount] = React.useState(2500);
  const [custom, setCustom] = React.useState("");
  const [siteId, setSiteId] = React.useState("general");
  const [given, setGiven] = React.useState(false);

  const isOps = currentUser.role === "dhaatri_ops" || currentUser.role === "admin";

  const mine = state.donations.filter((d) => d.donorId === currentUser.id);
  const scoped = isOps ? state.donations : mine;

  const inflow = state.ledger.filter((l) => l.type === "inflow").reduce((a, l) => a + l.amount, 0);
  const outflow = state.ledger.filter((l) => l.type === "outflow").reduce((a, l) => a + l.amount, 0);
  const totalGiven = scoped.reduce((a, d) => a + d.amount, 0);

  const value = Number(custom) > 0 ? Number(custom) : amount;

  const give = () => {
    donate({
      donorId: currentUser.id,
      donorName: currentUser.name,
      amount: value,
      purpose:
        siteId === "general"
          ? "General plantation fund"
          : `${state.sites.find((s) => s.id === siteId)?.name ?? siteId} project`,
      siteId: siteId === "general" ? undefined : siteId,
    });
    setGiven(true);
    setCustom("");
    setTimeout(() => setGiven(false), 3000);
  };

  // ~₹120 puts one sapling in the ground, all in.
  const saplings = Math.floor(value / 120);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={isOps ? "Fund ledger" : "Your contributions"}
        title={isOps ? "Every rupee in and out" : "What your money planted"}
        scene="forest"
        mascot={totalGiven > 0 ? "sprout-celebrating" : "sprout-waving"}
        figures={
          isOps
            ? [
                { value: inflow, unit: "₹ in", note: `${state.ledger.filter((l) => l.type === "inflow").length} inflows` },
                { value: outflow, unit: "₹ out", note: "spent on saplings and operations" },
                { value: inflow - outflow, unit: "₹ available", note: "unallocated balance" },
              ]
            : [
                { value: totalGiven, unit: "₹ given", note: `${mine.length} contributions` },
                {
                  value: Math.floor(totalGiven / 120),
                  unit: "saplings",
                  note: "roughly what that funded",
                },
              ]
        }
      />

      {/* ---------------------------------------------------------- give */}
      {!isOps && (
        <section>
          <Reveal>
            <SectionHead
              eyebrow="Contribute"
              title="Fund the next plot"
              note="Every rupee is recorded in the public ledger against the site it reaches"
            />
          </Reveal>

          <Reveal delay={0.05}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setAmount(p);
                        setCustom("");
                      }}
                      className={
                        "rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors " +
                        (value === p
                          ? "bg-[#1B4332] text-white"
                          : "bg-surface-3 text-ink-soft hover:text-ink-strong")
                      }
                    >
                      {formatCurrency(p)}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                      Or another amount
                    </label>
                    <Input
                      type="number"
                      min={100}
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder="₹"
                      className="h-11 rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                      Direct it to
                    </label>
                    <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "general")}>
                      <SelectTrigger className="h-11 w-full rounded-xl border-line">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General plantation fund</SelectItem>
                        {state.sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <Button
                    onClick={give}
                    className="h-11 rounded-full bg-[#2D6A4F] px-6 hover:bg-[#1B4332]"
                  >
                    <Heart className="mr-1.5 size-4" />
                    Give {formatCurrency(value)}
                  </Button>
                  <motion.span
                    initial={false}
                    animate={{ opacity: given ? 1 : 0, x: given ? 0 : -6 }}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-ink-brand"
                  >
                    <Check className="size-4" />
                    Receipt issued
                  </motion.span>
                </div>
              </div>

              <InvertedPanel className="h-full">
                <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                  What this buys
                </p>
                <p className="mt-5 font-onest text-[40px] font-semibold leading-none tracking-[-1.8px] text-white">
                  {saplings}
                  <span className="ml-2 text-[14px] font-medium text-[#95D5B2]">saplings</span>
                </p>
                <p className="mt-3 text-[13px] leading-5 text-white/55">
                  At roughly ₹120 per sapling, all in — nursery stock, transport, planting and
                  the first year of monitoring.
                </p>
                <p className="mt-5 border-t border-white/10 pt-5 text-[13px] leading-5 text-white/55">
                  Around{" "}
                  <span className="font-semibold text-white">
                    {Math.round(saplings * 48 * 0.48)} kg
                  </span>{" "}
                  of CO₂ absorbed in their first year, rising as they mature.
                </p>
              </InvertedPanel>
            </div>
          </Reveal>
        </section>
      )}

      {/* -------------------------------------------------------- ledger */}
      {isOps && (
        <Reveal delay={0.08}>
          <InvertedPanel>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
              Where the money went
            </p>
            <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {(["donation", "carbon_credit", "sapling_payment", "supplier_payment"] as const).map(
                (cat) => {
                  const rows = state.ledger.filter((l) => l.category === cat);
                  const sum = rows.reduce((a, l) => a + l.amount, 0);
                  return (
                    <InvertedFigure
                      key={cat}
                      label={cat.replace(/_/g, " ")}
                      value={formatCurrency(sum)}
                      note={`${rows.length} entries`}
                    />
                  );
                }
              )}
            </div>
          </InvertedPanel>
        </Reveal>
      )}

      {/* -------------------------------------------------------- record */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow={isOps ? "Ledger" : "Your record"}
            title={isOps ? `${state.ledger.length} transactions` : `${mine.length} contributions`}
            note={isOps ? "Every movement, newest first" : "Each one has a receipt on file"}
            right={
              !isOps && (
                <Link href="/donations/receipts">
                  <Button
                    variant="ghost"
                    className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                  >
                    Receipts
                    <ArrowUpRight className="ml-1 size-4" />
                  </Button>
                </Link>
              )
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {isOps ? (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <Rail>
                {[...state.ledger]
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .slice(0, 14)
                  .map((t) => (
                    <RailNode key={t.id} color={t.type === "inflow" ? "#52B788" : "#B7791F"}>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p className="text-[14px] font-medium text-ink-strong">{t.purpose}</p>
                        <p
                          className={
                            "flex items-center gap-1 font-onest text-[15px] font-semibold tracking-[-0.3px] " +
                            (t.type === "inflow" ? "text-ink-brand" : "text-[#B7791F]")
                          }
                        >
                          {t.type === "inflow" ? (
                            <ArrowDownLeft className="size-3.5" />
                          ) : (
                            <ArrowUpRight className="size-3.5" />
                          )}
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
          ) : mine.length === 0 ? (
            <Awaiting
              pose="sprout-waving"
              title="Nothing yet"
              body="Your first contribution appears here with its receipt, and shows up in the public ledger."
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
                      <p className="mt-1 text-[13px] text-ink-faint">
                        {formatDate(d.date)} · {formatDateRelative(d.date)}
                        {d.receiptId && ` · receipt ${d.receiptId}`}
                      </p>
                    </div>
                    <p className="shrink-0 font-onest text-[22px] font-semibold tracking-[-0.8px] text-ink-strong">
                      {formatCurrency(d.amount)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}
