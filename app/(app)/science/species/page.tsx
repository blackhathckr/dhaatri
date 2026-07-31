"use client";

import React from "react";
import { motion } from "framer-motion";
import { Droplets, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
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
} from "@/components/shared/premium";
import { useData } from "@/store";
import { formatCurrency } from "@/lib/format";

type Filter = "All" | "Very Fast" | "Fast" | "Medium" | "Slow";

const WATER_TONE: Record<string, string> = {
  Low: "#7A9E3F",
  Medium: "#3B7EA1",
  High: "#B4553F",
};

export default function SpeciesCataloguePage() {
  const { species, plans } = useData();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"co2" | "survival" | "cost">("co2");

  const q = query.trim().toLowerCase();
  const visible = species
    .filter((s) => {
      if (filter !== "All" && s.growthRate !== filter) return false;
      if (!q) return true;
      return `${s.commonName} ${s.scientificName} ${s.kannadaName} ${s.suitableSoil}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) =>
      sort === "co2"
        ? b.co2PerYear - a.co2PerYear
        : sort === "survival"
          ? b.survivalRate - a.survivalRate
          : a.saplingCost - b.saplingCost
    );

  const maxCo2 = Math.max(...species.map((s) => s.co2PerYear));

  // How many of each species are actually in the ground across all plans.
  const planted = new Map<string, number>();
  plans.forEach((p) =>
    p.species.forEach((sp) =>
      planted.set(sp.speciesId, (planted.get(sp.speciesId) ?? 0) + sp.quantity)
    )
  );

  const best = [...species].sort((a, b) => b.co2PerYear - a.co2PerYear)[0];
  const hardiest = [...species].sort((a, b) => b.survivalRate - a.survivalRate)[0];
  const cheapest = [...species].sort((a, b) => a.saplingCost - b.saplingCost)[0];

  // Value for money: kg CO₂ per rupee spent on the sapling.
  const efficient = [...species].sort(
    (a, b) => b.co2PerYear / b.saplingCost - a.co2PerYear / a.saplingCost
  )[0];

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Scientific panel"
        title="The species catalogue"
        scene="canopy"
        mascot="sprout-reading"
        figures={[
          { value: species.length, unit: "species", note: "approved for the pilot locality" },
          {
            value: Math.round(species.reduce((a, s) => a + s.co2PerYear, 0) / species.length),
            unit: "kg CO₂/yr",
            note: "average per mature tree",
          },
          {
            value: Math.round(species.reduce((a, s) => a + s.survivalRate, 0) / species.length),
            unit: "%",
            note: "average survival rate",
          },
        ]}
      />

      {/* the four species that win on something */}
      <Reveal delay={0.08}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Picks the panel keeps coming back to
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <InvertedFigure
              label="Most carbon"
              value={best.commonName}
              note={`${best.co2PerYear} kg CO₂ per year`}
            />
            <InvertedFigure
              label="Hardiest"
              value={hardiest.commonName}
              note={`${hardiest.survivalRate}% survival`}
            />
            <InvertedFigure
              label="Cheapest"
              value={cheapest.commonName}
              note={`${formatCurrency(cheapest.saplingCost)} per sapling`}
            />
            <InvertedFigure
              label="Best value"
              value={efficient.commonName}
              note={`${(efficient.co2PerYear / efficient.saplingCost).toFixed(2)} kg CO₂ per ₹`}
            />
          </div>
        </InvertedPanel>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="speciesFilterPill"
            value={filter}
            onChange={setFilter}
            options={(["All", "Very Fast", "Fast", "Medium", "Slow"] as Filter[]).map((f) => ({
              label: f,
              count: f === "All" ? species.length : species.filter((s) => s.growthRate === f).length,
            }))}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-surface-3 p-1">
              {(["co2", "survival", "cost"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors " +
                    (sort === k ? "bg-surface text-ink-strong shadow-sm" : "text-ink-faint")
                  }
                >
                  {k === "co2" ? "CO₂" : k === "survival" ? "Survival" : "Cost"}
                </button>
              ))}
            </div>
            <div className="relative lg:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search species…"
                className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
              />
            </div>
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Catalogue"
            title={`${visible.length} species`}
            note="Every figure here feeds the carbon engine and the plantation planner"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="Nothing matches"
            body="Try a different growth rate, or clear the search."
          />
        ) : (
          <div className="space-y-3">
            {visible.map((s, i) => {
              const inGround = planted.get(s.id) ?? 0;
              return (
                <Reveal key={s.id} delay={0.03 * i}>
                  <div className="rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      <div className="min-w-0 lg:w-60">
                        <div className="flex items-center gap-2.5">
                          <h3 className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                            {s.commonName}
                          </h3>
                          <Pill tone={s.growthRate === "Slow" ? "grey" : "green"}>
                            {s.growthRate}
                          </Pill>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] italic text-ink-ghost">
                          {s.scientificName} · {s.kannadaName}
                        </p>
                      </div>

                      {/* carbon, relative to the strongest species in the catalogue */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[12px] text-ink-faint">CO₂ per year</span>
                          <span className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
                            {s.co2PerYear} kg
                          </span>
                        </div>
                        <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-track">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.co2PerYear / maxCo2) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.03 * i }}
                            className="block h-full rounded-full bg-[#52B788]"
                          />
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-6 lg:gap-8">
                        <div className="w-20">
                          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                            Survival
                          </p>
                          <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                            {s.survivalRate}%
                          </p>
                        </div>
                        <div className="w-20">
                          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                            Sapling
                          </p>
                          <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                            {formatCurrency(s.saplingCost)}
                          </p>
                        </div>
                        <div className="w-24">
                          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                            In ground
                          </p>
                          <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-brand">
                            {inGround || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-soft pt-3.5 text-[12px] text-ink-faint">
                      <span className="flex items-center gap-1.5">
                        <Droplets className="size-3.5" style={{ color: WATER_TONE[s.waterNeed] }} />
                        {s.waterNeed} water need
                      </span>
                      <span>Suits {s.suitableSoil.toLowerCase()}</span>
                      <span>
                        {(s.co2PerYear / s.saplingCost).toFixed(2)} kg CO₂ per rupee spent
                      </span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
