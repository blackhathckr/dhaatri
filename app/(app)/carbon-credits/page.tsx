"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ArrowUpRight, Leaf } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  FilterPills,
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  Toolbar,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { formatCurrency, formatDate } from "@/lib/format";
import { getUserById } from "@/data/mock";

type Filter = "All" | "Active" | "Pending" | "Retired";

export default function CarbonCreditsPage() {
  const { state, retireCredit } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");

  // An organisation sees its own holdings; ops and admin see every issue.
  const scoped =
    currentUser.role === "organisation"
      ? state.credits.filter((c) => c.organisationId === currentUser.id)
      : state.credits;

  const visible = scoped.filter((c) =>
    filter === "All" ? true : c.status === filter.toLowerCase()
  );

  const held = scoped.filter((c) => c.status === "active");
  const totalCredits = scoped.reduce((a, c) => a + c.credits, 0);
  const spend = scoped.reduce((a, c) => a + c.amount, 0);

  // What the platform can actually back, from verified survival — the supply side.
  const verified = state.checkins.filter((c) => c.status === "verified");
  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const platformCo2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );
  const issued = state.credits.reduce((a, c) => a + c.credits, 0);
  const available = Math.max(0, platformCo2 / 1000 - issued);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={currentUser.role === "organisation" ? "Your holdings" : "Credit register"}
        title={
          currentUser.role === "organisation"
            ? "Carbon credits in your name"
            : "Every credit issued"
        }
        scene="forest"
        mascot={held.length ? "sprout-celebrating" : "sprout-thinking"}
        figures={[
          { value: totalCredits, unit: "tCO₂e", decimals: 1, note: `${held.length} active holdings` },
          { value: spend, unit: "₹", note: "invested in plantation" },
          {
            value: new Set(scoped.flatMap((c) => c.siteIds)).size,
            unit: "sites",
            note: "backing these credits",
          },
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

      {/* the supply side — what the platform can honestly back */}
      <Reveal delay={0.08}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            What backs a Dhaatri credit
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <InvertedFigure
              label="Sequestered"
              value={(platformCo2 / 1000).toFixed(2)}
              note={`tCO₂e per year · method ${CARBON_METHOD_VERSION}`}
            />
            <InvertedFigure
              label="Verified survival"
              value={`${survival.toFixed(1)}%`}
              note={`from ${verified.length} verified check-ins`}
            />
            <InvertedFigure label="Issued" value={issued.toFixed(1)} note="tCO₂e already sold" />
            <InvertedFigure
              label="Unallocated"
              value={available.toFixed(2)}
              note="tCO₂e available to purchase"
            />
          </div>

          {/* issued vs unallocated, as one bar */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.span
                initial={{ width: 0 }}
                animate={{
                  width: `${(issued / Math.max(issued + available, 0.01)) * 100}%`,
                }}
                transition={{ duration: 0.9 }}
                className="bg-[#95D5B2]"
              />
            </div>
            <p className="mt-3 text-[13px] leading-5 text-white/55">
              A credit is only issued against carbon the engine has already computed from
              verified survival. Nothing is sold forward against trees that haven&apos;t been
              counted.
            </p>
          </div>
        </InvertedPanel>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="creditFilterPill"
            value={filter}
            onChange={setFilter}
            options={(["All", "Active", "Pending", "Retired"] as Filter[]).map((f) => ({
              label: f,
              count:
                f === "All"
                  ? scoped.length
                  : scoped.filter((c) => c.status === f.toLowerCase()).length,
            }))}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Holdings"
            title={`${visible.length} ${visible.length === 1 ? "purchase" : "purchases"}`}
            note="Retiring a credit takes it permanently out of circulation"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Awaiting
              pose="sprout-thinking"
              title="No credits here"
              body="Purchases appear once an organisation buys carbon backed by verified plantation."
              action={
                <Link href="/carbon-credits/purchase">
                  <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                    Purchase credits
                  </Button>
                </Link>
              }
            />
          )}

          {visible.map((c, i) => (
            <Reveal key={c.id} delay={0.04 * i}>
              <div className="rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E4E0F2]">
                    <Award className="size-[18px] text-[#6B5CA5]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h3 className="font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                        {c.credits} tCO₂e
                      </h3>
                      <Pill tone={toneFor(c.status)}>{c.status}</Pill>
                      {c.certificateId && (
                        <span className="font-mono text-[12px] text-ink-ghost">
                          {c.certificateId}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-faint">
                      {getUserById(c.organisationId)?.name ?? c.organisationId} · purchased{" "}
                      {formatDate(c.purchasedAt)}
                    </p>

                    {/* which sites actually hold the trees behind this credit */}
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

                  <div className="flex shrink-0 items-center gap-6">
                    <div className="w-28">
                      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                        Paid
                      </p>
                      <p className="mt-1.5 font-onest text-[20px] font-semibold leading-none tracking-[-0.7px] text-ink-strong">
                        {formatCurrency(c.amount)}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-ghost">
                        {formatCurrency(Math.round(c.amount / c.credits))} per tonne
                      </p>
                    </div>

                    {c.status === "active" && (
                      <Button
                        onClick={() => retireCredit({ creditId: c.id })}
                        variant="outline"
                        className="h-10 rounded-full border-line px-5 text-ink-brand hover:bg-[#D8F3DC]/40"
                      >
                        Retire
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
