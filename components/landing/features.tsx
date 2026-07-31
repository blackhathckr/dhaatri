"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { MOCK_FUND_LEDGER, MOCK_SITES } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * In-scope functional modules for the pilot (proposal §6.2).
 *
 * Rendered as alternating full-width editorial rows, NOT a card grid. A row of
 * equal boxes gives every module the same weight and reduces the section to a
 * bulleted list; alternating large artwork lets each one actually be looked at.
 */
const MODULES = [
  {
    n: "01",
    title: "Space registration",
    lede: "Any open space can become a forest",
    body: "A backyard, a rooftop, a community plot or institutional land — registered with its geo-location, then assessed on the ground before anything is planted.",
    points: ["Geo-tagged at registration", "Volunteer site assessment", "Soil, sunlight and water captured"],
    art: "/features/registration.png",
    tint: "bg-pale",
  },
  {
    n: "02",
    title: "Carbon engine",
    lede: "Numbers you can defend in public",
    body: "A scientist-owned, versioned methodology computes CO₂ from species, growth stage and verified survival — so every published figure traces back to how it was produced.",
    points: ["Versioned computation engine", "Survival-weighted, never notional", "Traceable to site and method"],
    art: "/features/carbon-engine.png",
    tint: "bg-[#D9EAF3]",
  },
  {
    n: "03",
    title: "Geo-tagged monitoring",
    lede: "Proof, captured in the field",
    body: "Photo check-ins record how many trees are alive, where and when. Offline-capable for patchy connectivity, syncing the moment a signal returns.",
    points: ["Photo + location on every visit", "Survival tracked over time", "Offline-first field capture"],
    art: "/features/monitoring.png",
    tint: "bg-[#FAEDCD]",
  },
  {
    n: "04",
    title: "Verified supply network",
    lede: "Saplings that actually arrive",
    body: "A small, verified supplier set with live inventory visibility. Orders route automatically from an approved plan, and dispatch through delivery is tracked end to end.",
    points: ["Live stock visibility", "Automatic order routing", "Dispatch and delivery tracking"],
    art: "/features/supply.png",
    tint: "bg-mint/40",
  },
  {
    n: "05",
    title: "Carbon credits",
    lede: "Offsets backed by real trees",
    body: "Organisations purchase methodology-backed units and receive digital certificates — with live monitoring of the specific plantations backing each credit.",
    points: ["1 unit = 1 tonne CO₂e", "Digital certificates on purchase", "Live view of backing sites"],
    art: "/features/credits.png",
    tint: "bg-[#FBDDD2]",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative w-full bg-cream py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div className="max-w-[640px]">
            <p className="text-sm font-semibold tracking-[1.5px] uppercase text-emerald mb-4">
              What the platform does
            </p>
            <h2 className="font-onest text-[34px] sm:text-[44px] lg:text-[52px] font-semibold leading-[1.05] tracking-[-2px] text-ink">
              One platform,{" "}
              <span className="font-playfair italic font-semibold text-black opacity-45">
                every
              </span>{" "}
              link in the chain
            </h2>
          </div>

          <p className="max-w-[400px] text-lg leading-[30px] tracking-[-0.3px] text-ink/65">
            From the moment land is registered to the day a carbon credit is retired —
            each step is a first-class module, not an afterthought.
          </p>
        </motion.div>

        {/* ------------------------------------------- alternating rows ---- */}
        <div className="mt-16 lg:mt-24 flex flex-col gap-16 lg:gap-24">
          {MODULES.map((m, i) => {
            const flip = i % 2 === 1;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="group grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center"
              >
                {/* artwork */}
                <div className={flip ? "lg:order-2" : ""}>
                  <div
                    className={`relative aspect-square w-full max-w-[380px] overflow-hidden rounded-[24px] p-6 ${flip ? "lg:ml-auto" : ""} ${m.tint}`}
                  >
                    <Image
                      src={m.art}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 90vw, 380px"
                      className="object-contain p-2 transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                </div>

                {/* copy */}
                <div className={flip ? "lg:order-1 lg:pr-6" : "lg:pl-6"}>
                  <div className="flex items-center gap-3">
                    <span className="font-onest text-sm tabular-nums font-semibold text-emerald">
                      {m.n}
                    </span>
                    <span className="h-px flex-1 max-w-[56px] bg-ink/15" />
                    <span className="text-sm font-semibold uppercase tracking-[1.5px] text-ink/40">
                      {m.title}
                    </span>
                  </div>

                  <h3 className="mt-5 font-onest text-[28px] sm:text-[34px] lg:text-[40px] font-semibold leading-[1.1] tracking-[-1.6px] text-ink">
                    {m.lede}
                  </h3>

                  <p className="mt-4 max-w-[480px] text-[17px] leading-[29px] text-ink/60">
                    {m.body}
                  </p>

                  <ul className="mt-7 flex flex-col gap-3">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                        <span className="text-[15px] text-ink/70">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ------------------------------------------------ the fund ledger */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="group relative mt-20 lg:mt-28 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-10 lg:gap-14 overflow-hidden rounded-[32px] bg-ink p-8 lg:p-14"
        >
          <div className="absolute -top-24 -left-20 h-[380px] w-[380px] rounded-full bg-fresh/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-mint">
              The part nobody else publishes
            </p>
            <h3 className="mt-4 font-onest text-[30px] lg:text-[44px] font-semibold leading-[1.05] tracking-[-1.8px] text-white">
              A public fund ledger
            </h3>
            <p className="mt-5 max-w-[440px] text-[17px] leading-[29px] text-white/60">
              Every inflow and outflow is recorded with its purpose, location and
              beneficiary plantation — donations, sapling payments, credit purchases and
              supplier disbursements alike, published openly.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Purpose-tagged", "Site-linked", "Receipts built in", "Auditable trail"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-white/70"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* An illustration of a ledger proves nothing. This is the ledger —
              real rows from the same data the /transparency page publishes. */}
          <LedgerExtract />
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------------------------- the ledger, for real */

/**
 * A live extract of the public fund ledger.
 *
 * The section claims every rupee is recorded with its purpose, location and
 * beneficiary plantation. A stock illustration of coins and a chart asserts
 * that; showing six actual purpose-tagged rows, with the running balance
 * underneath, demonstrates it. Same data the /transparency page publishes.
 */
function LedgerExtract() {
  const rows = [...MOCK_FUND_LEDGER]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 6);

  const inflow = MOCK_FUND_LEDGER.filter((t) => t.type === "inflow").reduce(
    (s, t) => s + t.amount,
    0
  );
  const outflow = MOCK_FUND_LEDGER.filter((t) => t.type === "outflow").reduce(
    (s, t) => s + t.amount,
    0
  );

  const siteName = (id?: string) =>
    id ? (MOCK_SITES.find((s) => s.id === id)?.name ?? null) : null;

  return (
    <div className="relative w-full lg:ml-auto lg:max-w-[460px]">
      <div className="overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-mint">
            Public fund ledger
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span className="size-1.5 animate-pulse rounded-full bg-fresh" />
            live
          </span>
        </div>

        <div>
          {rows.map((t, i) => {
            const site = siteName(t.siteId);
            const inbound = t.type === "inflow";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-3 last:border-b-0"
              >
                <span
                  className={
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md " +
                    (inbound ? "bg-fresh/15 text-mint" : "bg-[#E9B872]/15 text-[#E9B872]")
                  }
                >
                  {inbound ? (
                    <ArrowDownLeft className="size-3" />
                  ) : (
                    <ArrowUpRight className="size-3" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/85">{t.purpose}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-white/35">
                    <span>{t.source}</span>
                    <span>·</span>
                    <span className="capitalize">{t.category.replace(/_/g, " ")}</span>
                    {site && (
                      <>
                        <span>·</span>
                        <span className="text-mint/70">{site}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatDate(t.date)}</span>
                  </p>
                </div>

                <p
                  className={
                    "shrink-0 font-onest text-[13px] font-semibold tracking-[-0.2px] " +
                    (inbound ? "text-mint" : "text-[#E9B872]")
                  }
                >
                  {inbound ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 border-t border-white/10">
          {[
            { l: "In", v: formatCurrency(inflow) },
            { l: "Out", v: formatCurrency(outflow) },
            { l: "Available", v: formatCurrency(inflow - outflow) },
          ].map((f) => (
            <div key={f.l} className="border-r border-white/10 px-5 py-3.5 last:border-r-0">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/35">
                {f.l}
              </p>
              <p className="mt-1 font-onest text-[15px] font-semibold tracking-[-0.4px] text-white">
                {f.v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
