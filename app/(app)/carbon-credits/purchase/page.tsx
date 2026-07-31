"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckIcon, Leaf } from "lucide-react";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Button } from "@/components/ui/button";
import { PageHero, Reveal } from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { formatCurrency } from "@/lib/format";

/** ₹5,000 a tonne — the pilot rate quoted in the proposal. */
const RATE = 5000;

const STEPS = [
  { title: "Volume", note: "How much to offset" },
  { title: "Backing", note: "Which sites hold it" },
  { title: "Confirm", note: "Review and issue" },
];

export default function PurchaseCreditsPage() {
  const { state, purchaseCredits } = useStore();
  const { currentUser } = useAuthContext();

  const [step, setStep] = React.useState(1);
  const [credits, setCredits] = React.useState(5);
  const [done, setDone] = React.useState(false);

  const verified = state.checkins.filter((c) => c.status === "verified");
  const survival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const platformCo2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival),
    0
  );
  const issued = state.credits.reduce((a, c) => a + c.credits, 0);
  const available = Math.max(0.5, Math.round((platformCo2 / 1000 - issued) * 10) / 10);

  const backing = state.sites.filter((s) => s.status === "active" || s.status === "completed");
  const amount = credits * RATE;

  const buy = () => {
    purchaseCredits({ organisationId: currentUser.id, credits, amount });
    setDone(true);
  };

  /* ------------------------------------------------------------ success */

  if (done) {
    const credit = state.credits[0];
    return (
      <div className="space-y-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-[#12362A] p-8 lg:p-12">
            <Image
              src="/scenes/canopy-banner.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="flex size-11 items-center justify-center rounded-full bg-[#52B788]">
                  <Check className="size-5 text-white" />
                </span>
                <h1 className="mt-5 font-onest text-[28px] font-semibold tracking-[-1px] text-white lg:text-[34px]">
                  {credit?.credits} tCO₂e is yours
                </h1>
                <p className="mt-2 max-w-[460px] text-[15px] leading-6 text-white/55">
                  Certificate {credit?.certificateId} has been issued and the payment recorded
                  in the public fund ledger against {credit?.siteIds.length} sites.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Link href="/carbon-credits/certificates">
                    <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
                      View certificate
                      <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                  </Link>
                  <Link href="/carbon-credits">
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border-white/25 bg-white/5 px-5 text-white hover:bg-white/15 hover:text-white"
                    >
                      All holdings
                    </Button>
                  </Link>
                </div>
              </div>

              <Image
                src="/mascot/sprout-celebrating.png"
                alt=""
                width={150}
                height={150}
                className="drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  /* --------------------------------------------------------------- flow */

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Carbon credits"
        title="Offset against trees that exist"
        scene="forest"
        mascot="sprout-pointing"
        figures={[
          { value: available, unit: "tCO₂e", decimals: 1, note: "unallocated right now" },
          { value: RATE, unit: "₹ / tonne", note: "pilot rate" },
        ]}
        actions={
          <Link href="/carbon-credits">
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/25 bg-white/5 px-5 text-white hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Holdings
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
          <Stepper
            value={step}
            onValueChange={setStep}
            indicators={{ completed: <CheckIcon className="size-3.5" /> }}
            className="space-y-8"
          >
            <StepperNav className="gap-3">
              {STEPS.map((s, i) => (
                <StepperItem key={s.title} step={i + 1} className="relative flex-1 items-start">
                  <StepperTrigger className="flex grow flex-col items-start justify-center gap-3">
                    <StepperIndicator>{i + 1}</StepperIndicator>
                    <div className="text-start">
                      <StepperTitle className="font-onest text-[15px] font-semibold tracking-[-0.3px] group-data-[state=inactive]/step:text-ink-ghost">
                        {s.title}
                      </StepperTitle>
                      <p className="mt-0.5 text-[12px] text-ink-faint max-sm:hidden">{s.note}</p>
                    </div>
                  </StepperTrigger>
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel>
              {/* ------------------------------------------------ volume */}
              <StepperContent value={1}>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <label className="text-[13px] font-medium text-ink-strong">
                        Tonnes of CO₂ to offset
                      </label>
                      <span className="font-onest text-[18px] font-semibold tracking-[-0.5px] text-ink-brand">
                        {credits} tCO₂e
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={Math.max(available, 20)}
                      step={0.5}
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-track accent-[#2D6A4F]"
                    />

                    <div className="mt-6 flex flex-wrap gap-2">
                      {[1, 5, 10, 25].map((v) => (
                        <button
                          key={v}
                          onClick={() => setCredits(v)}
                          className={
                            "rounded-full px-4 py-2 text-[13px] font-medium transition-colors " +
                            (credits === v
                              ? "bg-[#1B4332] text-white"
                              : "bg-surface-3 text-ink-soft hover:text-ink-strong")
                          }
                        >
                          {v} tCO₂e
                        </button>
                      ))}
                    </div>

                    <p className="mt-6 text-[13px] leading-5 text-ink-faint">
                      Roughly what {Math.round(credits * 1000 / 48)} mature neem trees absorb in a
                      year, or {Math.round(credits * 4200)} km of average car travel.
                    </p>
                  </div>

                  <div className="rounded-xl bg-surface-3 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
                      Cost
                    </p>
                    <motion.p
                      key={amount}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 font-onest text-[30px] font-semibold leading-none tracking-[-1.2px] text-ink-strong"
                    >
                      {formatCurrency(amount)}
                    </motion.p>
                    <p className="mt-2 text-[13px] text-ink-soft">
                      at {formatCurrency(RATE)} per tonne
                    </p>
                    {credits > available && (
                      <p className="mt-4 rounded-lg bg-[#FAEDCD] px-3 py-2 text-[12px] leading-4 text-[#8B5E3C]">
                        Above the {available} tCO₂e currently unallocated. The balance is issued
                        as pending until new check-ins verify it.
                      </p>
                    )}
                  </div>
                </div>
              </StepperContent>

              {/* ----------------------------------------------- backing */}
              <StepperContent value={2}>
                <p className="text-[14px] leading-6 text-ink-soft">
                  Credits are allocated against sites with verified monitoring data. These are
                  the plots that will back your purchase.
                </p>

                <div className="mt-5 space-y-3">
                  {backing.slice(0, 3).map((s) => {
                    const plan = state.plans.find((p) => p.siteId === s.id);
                    const trees = plan?.species.reduce((a, sp) => a + sp.quantity, 0) ?? 0;
                    const latest = [...state.checkins]
                      .filter((c) => c.siteId === s.id)
                      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
                          <Leaf className="size-[18px] text-ink-brand" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
                            {s.name}
                          </p>
                          <p className="mt-0.5 text-[13px] text-ink-faint">
                            {trees} trees · {s.area} sqm ·{" "}
                            {latest ? `${latest.survivalPercent}% verified survival` : "awaiting check-in"}
                          </p>
                        </div>
                        <span className="shrink-0 font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-brand">
                          {(credits / Math.min(3, backing.length)).toFixed(1)} t
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-[13px] leading-5 text-ink-faint">
                  Every tonne here was computed by the carbon engine ({CARBON_METHOD_VERSION})
                  from species, growth stage and verified survival — never a notional estimate.
                </p>
              </StepperContent>

              {/* ----------------------------------------------- confirm */}
              <StepperContent value={3}>
                <div className="overflow-hidden rounded-xl border border-line">
                  {[
                    { k: "Organisation", v: currentUser.name },
                    { k: "Volume", v: `${credits} tCO₂e` },
                    { k: "Rate", v: `${formatCurrency(RATE)} per tonne` },
                    { k: "Backing sites", v: `${Math.min(3, backing.length)} sites` },
                    { k: "Methodology", v: CARBON_METHOD_VERSION },
                    { k: "Total", v: formatCurrency(amount) },
                  ].map((r) => (
                    <div
                      key={r.k}
                      className="flex items-center justify-between gap-4 border-b border-line-soft bg-white px-5 py-3.5 last:border-b-0 last:bg-surface-3"
                    >
                      <span className="text-[13px] font-medium text-ink-faint">{r.k}</span>
                      <span className="text-[15px] font-semibold text-ink-strong">{r.v}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[13px] leading-5 text-ink-faint">
                  Confirming issues a certificate immediately and records the payment as an
                  inflow in the public fund ledger.
                </p>
              </StepperContent>
            </StepperPanel>

            <div className="flex items-center justify-between border-t border-line pt-6">
              <Button
                variant="ghost"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="h-10 rounded-full px-5 text-ink-soft hover:bg-surface-3 disabled:opacity-40"
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Back
              </Button>

              {step < STEPS.length ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="h-10 rounded-full bg-[#1B4332] px-6 hover:bg-[#2D6A4F]"
                >
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              ) : (
                <Button
                  onClick={buy}
                  className="h-10 rounded-full bg-[#2D6A4F] px-6 hover:bg-[#1B4332]"
                >
                  Purchase {credits} tCO₂e
                  <Check className="ml-1.5 size-4" />
                </Button>
              )}
            </div>
          </Stepper>
        </div>
      </Reveal>
    </div>
  );
}
