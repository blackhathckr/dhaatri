"use client";

import React from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ShieldCheck } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DataRows,
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Rail,
  RailNode,
  Reveal,
  SectionHead,
} from "@/components/shared/premium";
import { useData, computeCo2, CARBON_METHOD_VERSION } from "@/store";

const chartConfig = { co2: { label: "kg CO₂/yr", color: "#2D6A4F" } } satisfies ChartConfig;

/** Methodology history — a published figure has to be traceable to its version. */
const VERSIONS = [
  {
    v: "v1.2",
    date: "July 2026",
    change: "Age factor ramped to full rate at year five rather than year three.",
    current: true,
  },
  {
    v: "v1.1",
    date: "May 2026",
    change: "Survival weighting made mandatory; notional estimates withdrawn.",
    current: false,
  },
  {
    v: "v1.0",
    date: "March 2026",
    change: "Initial species-level sequestration table adopted from panel review.",
    current: false,
  },
];

export default function CarbonEnginePage() {
  const state = useData();

  const [ageYears, setAgeYears] = React.useState(1);
  const [survival, setSurvival] = React.useState(94);
  const [trees, setTrees] = React.useState(40);
  const [speciesId, setSpeciesId] = React.useState(state.species[0].id);

  const chosen = state.species.find((s) => s.id === speciesId) ?? state.species[0];

  const result = computeCo2(
    [{ speciesId: chosen.id, name: chosen.commonName, quantity: trees }],
    state.species,
    survival,
    ageYears
  );

  // The same plantation projected forward — carbon is a curve, not a constant.
  const curve = Array.from({ length: 10 }, (_, i) => ({
    year: `Y${i + 1}`,
    co2: computeCo2(
      [{ speciesId: chosen.id, name: chosen.commonName, quantity: trees }],
      state.species,
      survival,
      i + 1
    ),
  }));

  // Platform-wide, using the same engine every published figure comes from.
  const verified = state.checkins.filter((c) => c.status === "verified");
  const platformSurvival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 100;
  const platformCo2 = state.plans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, platformSurvival),
    0
  );

  const ageFactor = Math.min(1, 0.35 + 0.13 * ageYears);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow={`Methodology ${CARBON_METHOD_VERSION}`}
        title="The carbon engine"
        scene="forest"
        mascot="sprout-thinking"
        figures={[
          { value: platformCo2, unit: "kg CO₂/yr", note: "published across the platform" },
          { value: platformSurvival, unit: "%", decimals: 1, note: "verified survival applied" },
          { value: state.species.length, unit: "species", note: "in the sequestration table" },
        ]}
      />

      {/* ========================================================== formula */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="How the number is made"
            title="Three factors, no estimates"
            note="Species rate × age factor × verified survival. Nothing else enters the figure."
          />
        </Reveal>

        <Reveal delay={0.05}>
          <InvertedPanel>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
              <InvertedFigure
                label="1 · Species rate"
                value={`${chosen.co2PerYear} kg`}
                note={`${chosen.commonName}, per mature tree per year`}
              />
              <InvertedFigure
                label="2 · Age factor"
                value={ageFactor.toFixed(2)}
                note={`year ${ageYears} of growth, capped at 1.00`}
              />
              <InvertedFigure
                label="3 · Verified survival"
                value={`${survival}%`}
                note="from geo-tagged check-ins only"
              />
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="font-mono text-[13px] leading-6 text-white/60">
                co2 = Σ(species.rate × quantity) × min(1, 0.35 + 0.13 × ageYears) × survival/100
              </p>
              <p className="mt-4 flex items-start gap-2.5 text-[13px] leading-5 text-white/55">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#95D5B2]" />
                Survival is not assumed. A site with no verified check-in carries no published
                figure — the plan&apos;s estimate is labelled as an estimate everywhere it appears.
              </p>
            </div>
          </InvertedPanel>
        </Reveal>
      </section>

      {/* ======================================================= calculator */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Try it"
            title="Run the engine yourself"
            note="Every published CO₂ figure on Dhaatri comes out of exactly this function"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-ink-strong">
                  Species
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {state.species.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSpeciesId(s.id)}
                      className={
                        "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors " +
                        (s.id === speciesId
                          ? "bg-[#1B4332] text-white"
                          : "bg-surface-3 text-ink-soft hover:text-ink-strong")
                      }
                    >
                      {s.commonName}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: "Trees", value: trees, set: setTrees, min: 1, max: 200, suffix: "" },
                { label: "Age", value: ageYears, set: setAgeYears, min: 1, max: 10, suffix: " yr" },
                { label: "Survival", value: survival, set: setSurvival, min: 0, max: 100, suffix: "%" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="text-[13px] font-medium text-ink-strong">{f.label}</label>
                    <span className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-brand">
                      {f.value}
                      {f.suffix}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-track accent-[#2D6A4F]"
                  />
                </div>
              ))}

              <div className="border-t border-line pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                  Result
                </p>
                <motion.p
                  key={result}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-ink-strong"
                >
                  {result.toLocaleString("en-IN")}
                  <span className="ml-2 text-[14px] font-medium text-ink-faint">kg CO₂/yr</span>
                </motion.p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-line bg-surface p-5">
              <p className="text-[13px] font-medium text-ink-soft">
                Same plantation, projected across ten years
              </p>
              <p className="mt-1 text-[12px] text-ink-faint">
                Young trees sequester less; the age factor reaches its ceiling in year five.
              </p>
              <ChartContainer config={chartConfig} className="mt-5 h-[300px] w-full">
                <AreaChart data={curve} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillEngine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#52B788" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#EBE6DE" />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: "#9AA39C", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9AA39C", fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    dataKey="co2"
                    type="monotone"
                    stroke="#2D6A4F"
                    strokeWidth={2.5}
                    fill="url(#fillEngine)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================================================== versions */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Governance"
            title="Methodology versions"
            note="Any published figure can be traced back to the version that produced it"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <Rail>
                {VERSIONS.map((v) => (
                  <RailNode key={v.v} color={v.current ? "#2D6A4F" : "#C4C0B7"}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                        {v.v}
                      </p>
                      {v.current && <Pill>in use</Pill>}
                      <span className="text-[12px] text-ink-ghost">{v.date}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{v.change}</p>
                  </RailNode>
                ))}
              </Rail>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <DataRows
              rows={[
                { k: "Current version", v: CARBON_METHOD_VERSION },
                { k: "Owner", v: "Scientific panel" },
                { k: "Inputs", v: "Species, age, survival" },
                { k: "Survival source", v: "Verified check-ins only" },
                { k: "Age ceiling", v: "Year 5" },
                { k: "Applied to", v: `${state.plans.length} plans` },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
