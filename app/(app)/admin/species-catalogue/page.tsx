"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

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

type Filter = "All" | "In use" | "Unused" | "In stock";

export default function SpeciesCatalogueAdminPage() {
  const state = useData();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");

  /** Master data is only worth as much as its use — count both. */
  const usage = new Map<string, number>();
  state.plans.forEach((p) =>
    p.species.forEach((sp) => usage.set(sp.speciesId, (usage.get(sp.speciesId) ?? 0) + sp.quantity))
  );

  const stock = new Map<string, number>();
  state.inventory.forEach((i) => stock.set(i.speciesId, (stock.get(i.speciesId) ?? 0) + i.stock));

  const q = query.trim().toLowerCase();
  const visible = state.species.filter((s) => {
    const used = (usage.get(s.id) ?? 0) > 0;
    const stocked = (stock.get(s.id) ?? 0) > 0;
    if (filter === "In use" && !used) return false;
    if (filter === "Unused" && used) return false;
    if (filter === "In stock" && !stocked) return false;
    if (!q) return true;
    return `${s.commonName} ${s.scientificName} ${s.kannadaName}`.toLowerCase().includes(q);
  });

  const used = state.species.filter((s) => (usage.get(s.id) ?? 0) > 0);
  const stocked = state.species.filter((s) => (stock.get(s.id) ?? 0) > 0);
  const orphaned = state.species.filter(
    (s) => (usage.get(s.id) ?? 0) === 0 && (stock.get(s.id) ?? 0) === 0
  );

  const maxUse = Math.max(...state.species.map((s) => usage.get(s.id) ?? 0), 1);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Master data"
        title="The species catalogue"
        scene="canopy"
        mascot="sprout-reading"
        figures={[
          { value: state.species.length, unit: "species", note: "approved by the panel" },
          { value: used.length, unit: "in plans", note: "actually being planted" },
          { value: stocked.length, unit: "stocked", note: "held by a supplier" },
        ]}
      />

      {/* the gaps in the catalogue — what an admin is actually here to fix */}
      <Reveal delay={0.08}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Catalogue health
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            <InvertedFigure
              label="Total entries"
              value={state.species.length}
              note="in the master table"
            />
            <InvertedFigure
              label="Planted somewhere"
              value={used.length}
              note={`${Math.round((used.length / state.species.length) * 100)}% of the catalogue`}
            />
            <InvertedFigure
              label="No supplier"
              value={state.species.length - stocked.length}
              note="cannot be ordered today"
            />
            <InvertedFigure
              label="Never used"
              value={orphaned.length}
              note="no stock and no plans"
            />
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-[13px] leading-5 text-white/55">
            An entry with no supplier can still be put in a plan — the order will simply fail to
            source. Keeping the catalogue tight is what stops that happening.
          </p>
        </InvertedPanel>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="speciesAdminFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: state.species.length },
              { label: "In use" as Filter, count: used.length },
              { label: "In stock" as Filter, count: stocked.length },
              { label: "Unused" as Filter, count: state.species.length - used.length },
            ]}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search species…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Master table"
            title={`${visible.length} entries`}
            note="Bar length is how many of this species are in the ground across all plans"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="Nothing matches"
            body="Try a different filter, or clear the search."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {visible.map((s, i) => {
              const inGround = usage.get(s.id) ?? 0;
              const held = stock.get(s.id) ?? 0;
              return (
                <Reveal key={s.id} delay={0.02 * i}>
                  <div className="flex flex-col gap-4 border-b border-line-soft p-5 transition-colors last:border-b-0 hover:bg-surface-2 lg:flex-row lg:items-center">
                    <div className="min-w-0 lg:w-56">
                      <div className="flex items-center gap-2.5">
                        <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {s.commonName}
                        </p>
                        {held === 0 && <Pill tone="amber">no supplier</Pill>}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] italic text-ink-ghost">
                        {s.scientificName} · {s.kannadaName}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12px] text-ink-faint">In the ground</span>
                        <span className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {inGround || "—"}
                        </span>
                      </div>
                      <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-track">
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{ width: `${(inGround / maxUse) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.02 * i }}
                          className="block h-full rounded-full bg-[#7A9E3F]"
                        />
                      </span>
                    </div>

                    <div className="flex shrink-0 gap-6 lg:gap-8">
                      {[
                        { l: "CO₂/yr", v: `${s.co2PerYear} kg` },
                        { l: "Survival", v: `${s.survivalRate}%` },
                        { l: "Cost", v: formatCurrency(s.saplingCost) },
                        { l: "Stock", v: held || "—" },
                      ].map((f) => (
                        <div key={f.l} className="w-20">
                          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                            {f.l}
                          </p>
                          <p className="mt-1.5 font-onest text-[16px] font-semibold leading-none tracking-[-0.4px] text-ink-strong">
                            {f.v}
                          </p>
                        </div>
                      ))}
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
