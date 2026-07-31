"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  Toolbar,
} from "@/components/shared/premium";
import { useData } from "@/store";
import type { Region } from "@/data/types";

/** Pilot coverage — proposal §10 scopes the pilot to Bangalore Urban. */
const REGIONS: Region[] = [
  { id: "reg-001", region: "Bangalore Urban", locality: "Whitefield", pincode: "560066", zone: "East" },
  { id: "reg-002", region: "Bangalore Urban", locality: "Koramangala", pincode: "560034", zone: "South" },
  { id: "reg-003", region: "Bangalore Urban", locality: "Indiranagar", pincode: "560038", zone: "East" },
  { id: "reg-004", region: "Bangalore Urban", locality: "HSR Layout", pincode: "560102", zone: "South" },
  { id: "reg-005", region: "Bangalore Urban", locality: "JP Nagar", pincode: "560078", zone: "South" },
  { id: "reg-006", region: "Bangalore Urban", locality: "Yelahanka", pincode: "560064", zone: "North" },
  { id: "reg-007", region: "Bangalore Urban", locality: "Marathahalli", pincode: "560037", zone: "East" },
  { id: "reg-008", region: "Bangalore Urban", locality: "Jayanagar", pincode: "560041", zone: "South" },
  { id: "reg-009", region: "Bangalore Urban", locality: "Electronic City", pincode: "560100", zone: "South" },
  { id: "reg-010", region: "Bangalore Urban", locality: "Hebbal", pincode: "560024", zone: "North" },
];

const ZONE_COLOR: Record<string, string> = {
  East: "#3B7EA1",
  South: "#2D6A4F",
  North: "#B7791F",
  West: "#7A9E3F",
};

const ZONES = ["All", "North", "East", "South", "West"];

export default function RegionsPage() {
  const state = useData();

  const [zone, setZone] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const visible = REGIONS.filter((r) => {
    if (zone !== "All" && r.zone !== zone) return false;
    if (!q) return true;
    return `${r.locality} ${r.pincode} ${r.region}`.toLowerCase().includes(q);
  });

  /** A locality is live once a registered site sits in it. */
  const sitesIn = (locality: string) =>
    state.sites.filter((s) => s.name.toLowerCase().includes(locality.split(" ")[0].toLowerCase()));

  const live = REGIONS.filter((r) => sitesIn(r.locality).length > 0);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Master data"
        title="Localities under the pilot"
        scene="plot"
        mascot="sprout-pointing"
        figures={[
          { value: REGIONS.length, unit: "localities", note: "configured for the pilot" },
          { value: live.length, unit: "live", note: "with at least one registered site" },
          { value: new Set(REGIONS.map((r) => r.zone)).size, unit: "zones", note: "across the city" },
        ]}
      />

      {/* zone coverage, as proportion rather than four more cards */}
      <Reveal delay={0.08}>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
          {ZONES.slice(1).map((z) => {
            const rows = REGIONS.filter((r) => r.zone === z);
            const liveHere = rows.filter((r) => sitesIn(r.locality).length > 0).length;
            return (
              <button
                key={z}
                onClick={() => setZone(z)}
                className="border-b border-r border-line p-5 text-left transition-colors last:border-r-0 hover:bg-surface-2 lg:border-b-0"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: ZONE_COLOR[z] }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                    {z}
                  </span>
                </span>
                <p className="mt-3 font-onest text-[30px] font-semibold leading-none tracking-[-1.3px] text-ink-strong">
                  {rows.length}
                </p>
                <p className="mt-1.5 text-[13px] text-ink-soft">{liveHere} with sites</p>

                <span className="mt-4 block h-1.5 w-full overflow-hidden rounded-full bg-track">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(liveHere / Math.max(rows.length, 1)) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ background: ZONE_COLOR[z] }}
                    className="block h-full rounded-full"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="zoneFilterPill"
            value={zone}
            onChange={setZone}
            options={ZONES.map((z) => ({
              label: z,
              count: z === "All" ? REGIONS.length : REGIONS.filter((r) => r.zone === z).length,
            }))}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locality or pincode…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Coverage"
            title={`${visible.length} ${visible.length === 1 ? "locality" : "localities"}`}
            note="Adding a locality here is what lets a citizen register a space in it"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="No localities match"
            body="Try another zone, or clear the search."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {visible.map((r, i) => {
              const here = sitesIn(r.locality);
              return (
                <Reveal key={r.id} delay={0.02 * i}>
                  <div className="flex flex-col gap-4 border-b border-line-soft p-5 transition-colors last:border-b-0 hover:bg-surface-2 sm:flex-row sm:items-center">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${ZONE_COLOR[r.zone]}1A` }}
                    >
                      <MapPin className="size-4" style={{ color: ZONE_COLOR[r.zone] }} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {r.locality}
                        </p>
                        <Pill tone={here.length ? "green" : "grey"}>
                          {here.length ? "live" : "configured"}
                        </Pill>
                      </div>
                      <p className="mt-0.5 text-[13px] text-ink-faint">
                        {r.region} · {r.zone} zone
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-8">
                      <div className="w-24">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Pincode
                        </p>
                        <p className="mt-1 font-mono text-[14px] text-ink-strong">{r.pincode}</p>
                      </div>
                      <div className="w-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Sites
                        </p>
                        <p className="mt-1 font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-brand">
                          {here.length || "—"}
                        </p>
                      </div>
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
