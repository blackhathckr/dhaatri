"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import { ArrowUpRight, MapPin, Plus, Search, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from "@/store";
import { SITE_STATUS_LABELS } from "@/lib/constants";
import { formatArea, formatDateRelative } from "@/lib/format";
import type { PlantationSite, SiteStatus } from "@/data/types";

/* ------------------------------------------------------------------ shared */

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Proposal §5 — a site moves through these seven states, in order. */
const LIFECYCLE: SiteStatus[] = [
  "pending",
  "assessed",
  "planned",
  "approved",
  "fulfilled",
  "active",
  "completed",
];

const FILTERS: { label: string; match: (s: PlantationSite) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "Awaiting", match: (s) => s.status === "pending" || s.status === "assessed" },
  { label: "In progress", match: (s) => ["planned", "approved", "fulfilled"].includes(s.status) },
  { label: "Growing", match: (s) => s.status === "active" },
  { label: "Completed", match: (s) => s.status === "completed" },
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display.toLocaleString("en-IN")}</>;
}

/* --------------------------------------------------------------------- map */

/**
 * The sites plotted by their real coordinates. A tile-server map would drown
 * five plots in road labels — this shows the only thing that matters here,
 * which is how the sites sit relative to each other across the locality.
 */
function LocalityMap({
  sites,
  hovered,
  onHover,
}: {
  sites: PlantationSite[];
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const bounds = React.useMemo(() => {
    if (!sites.length) return null;
    const lats = sites.map((s) => s.latitude);
    const lngs = sites.map((s) => s.longitude);
    // A margin so no plot ends up pinned to the frame edge.
    const pad = 0.15;
    const latMin = Math.min(...lats);
    const latMax = Math.max(...lats);
    const lngMin = Math.min(...lngs);
    const lngMax = Math.max(...lngs);
    const latSpan = Math.max(latMax - latMin, 0.01);
    const lngSpan = Math.max(lngMax - lngMin, 0.01);
    return {
      latMin: latMin - latSpan * pad,
      latSpan: latSpan * (1 + pad * 2),
      lngMin: lngMin - lngSpan * pad,
      lngSpan: lngSpan * (1 + pad * 2),
    };
  }, [sites]);

  const maxArea = Math.max(...sites.map((s) => s.area), 1);

  if (!bounds) return null;

  const place = (s: PlantationSite) => ({
    // latitude increases northward, y increases downward
    x: ((s.longitude - bounds.lngMin) / bounds.lngSpan) * 100,
    y: (1 - (s.latitude - bounds.latMin) / bounds.latSpan) * 100,
    r: 2.6 + (s.area / maxArea) * 4.4,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <p className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
            Across the locality
          </p>
          <p className="mt-0.5 text-[12px] text-ink-faint">Circle size = plot area</p>
        </div>
        <MapPin className="size-4 text-[#52B788]" />
      </div>

      <div className="relative aspect-square bg-surface-3">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          {/* grid — reads as a survey plate rather than a chart */}
          <defs>
            <pattern id="siteGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0 L0 0 0 10" fill="none" stroke="#E2E9DE" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#siteGrid)" />

          {sites.map((s) => {
            const p = place(s);
            const on = hovered === s.id;
            return (
              <g
                key={s.id}
                onMouseEnter={() => onHover(s.id)}
                onMouseLeave={() => onHover(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r * (on ? 2.1 : 1.7)}
                  fill="#52B788"
                  opacity={on ? 0.28 : 0.14}
                  className="transition-all duration-300"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={
                    s.status === "completed"
                      ? "#1B4332"
                      : s.status === "active"
                        ? "#2D6A4F"
                        : "#95D5B2"
                  }
                  stroke="#fff"
                  strokeWidth={on ? 1.2 : 0.8}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* label for whichever plot is under the cursor */}
        {sites.map((s) => {
          const p = place(s);
          return (
            <motion.div
              key={s.id}
              initial={false}
              animate={{ opacity: hovered === s.id ? 1 : 0, y: hovered === s.id ? 0 : 4 }}
              transition={{ duration: 0.2 }}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-lg bg-[#1B4332] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg"
            >
              {s.name}
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-5 py-3">
        {[
          { c: "#95D5B2", l: "In planning" },
          { c: "#2D6A4F", l: "Growing" },
          { c: "#1B4332", l: "Completed" },
        ].map((k) => (
          <span key={k.l} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            <span className="size-2 rounded-full" style={{ background: k.c }} />
            {k.l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- rail */

/** Where the site sits in the seven-stage lifecycle. */
function LifecycleRail({ status }: { status: SiteStatus }) {
  const at = Math.max(0, LIFECYCLE.indexOf(status));
  return (
    <div className="flex items-center gap-1">
      {LIFECYCLE.map((stage, i) => {
        const done = i < at;
        const here = i === at;
        return (
          <span
            key={stage}
            title={SITE_STATUS_LABELS[stage]}
            className={
              "h-1.5 flex-1 rounded-full transition-colors " +
              (here ? "bg-[#2D6A4F]" : done ? "bg-[#95D5B2]" : "bg-track")
            }
          />
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------- row */

function SiteRow({
  site,
  trees,
  survival,
  lastVisit,
  hovered,
  onHover,
}: {
  site: PlantationSite;
  trees: number;
  survival: number | null;
  lastVisit: string | null;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <Link
      href={`/sites/${site.id}`}
      onMouseEnter={() => onHover(site.id)}
      onMouseLeave={() => onHover(null)}
      className="block"
    >
      <div
        className={
          "group relative overflow-hidden rounded-2xl border bg-surface p-5 transition-all duration-300 " +
          (hovered
            ? "-translate-y-0.5 border-[#52B788]/50 shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]"
            : "border-line")
        }
      >
        {/* a soft canopy wash that only shows on hover */}
        <div
          className={
            "pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-[#52B788]/10 blur-2xl transition-opacity duration-500 " +
            (hovered ? "opacity-100" : "opacity-0")
          }
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* the plot itself, drawn to relative scale — an icon in a tinted
              square would have told you nothing the name didn't already say */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface-3 ring-1 ring-line">
            <span
              style={{
                width: 10 + Math.min(28, Math.round(Math.sqrt(site.area) / 1.7)),
                height: 10 + Math.min(28, Math.round(Math.sqrt(site.area) / 1.7)),
              }}
              className="rounded-[4px] bg-[#7A9E3F]/35 ring-1 ring-[#7A9E3F]/50"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                {site.name}
              </h3>
              <span className="rounded-full bg-[#E9F5EE] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-brand">
                {SITE_STATUS_LABELS[site.status]}
              </span>
            </div>

            <p className="mt-1.5 truncate text-[13px] text-ink-faint">
              {formatArea(site.area)} · {site.soilType} soil · {site.sunlight} sun ·{" "}
              {site.waterAccess}
            </p>

            <div className="mt-4 max-w-[340px]">
              <LifecycleRail status={site.status} />
              <p className="mt-2 text-[12px] text-ink-faint">
                {lastVisit
                  ? `Last check-in ${formatDateRelative(lastVisit)}`
                  : "No check-in logged yet"}
              </p>
            </div>
          </div>

          {/* figures kept to one line each so rows never go ragged */}
          <div className="flex shrink-0 items-start gap-6 sm:gap-8">
            <div className="w-14">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                Trees
              </p>
              <p className="mt-1.5 font-onest text-[22px] font-semibold leading-none tracking-[-0.8px] text-ink-strong">
                {trees || "—"}
              </p>
            </div>

            <div className="w-24">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                Survival
              </p>
              {survival === null ? (
                <p className="mt-1.5 font-onest text-[22px] font-semibold leading-none tracking-[-0.8px] text-ink-ghost">
                  —
                </p>
              ) : (
                <>
                  <p className="mt-1.5 font-onest text-[22px] font-semibold leading-none tracking-[-0.8px] text-ink-strong">
                    {survival}%
                  </p>
                  <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-track">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${survival}%` }}
                      transition={{ duration: 0.8, ease: EASE }}
                      className="block h-full rounded-full bg-[#52B788]"
                    />
                  </span>
                </>
              )}
            </div>

            <ArrowUpRight
              className={
                "mt-1 size-5 transition-all duration-300 " +
                (hovered ? "translate-x-0 text-ink-brand" : "-translate-x-1 text-ink-ghost")
              }
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------- page */

export default function SitesPage() {
  const { sites, plans, checkins } = useData();
  const { currentUser } = useAuthContext();

  const [ready, setReady] = React.useState(false);
  const [filter, setFilter] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(t);
  }, []);

  // A citizen owns spaces; every other role oversees the whole locality.
  const scoped = React.useMemo(
    () =>
      currentUser.role === "citizen"
        ? sites.filter((s) => s.ownerId === currentUser.id)
        : sites,
    [sites, currentUser]
  );

  /** Trees, survival and last visit per site — the figures each row shows. */
  const stats = React.useMemo(() => {
    const map = new Map<
      string,
      { trees: number; survival: number | null; lastVisit: string | null }
    >();
    scoped.forEach((s) => {
      const plan = plans.find((p) => p.siteId === s.id);
      const visits = checkins
        .filter((c) => c.siteId === s.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));
      map.set(s.id, {
        trees: plan?.species.reduce((sum, sp) => sum + sp.quantity, 0) ?? 0,
        survival: visits.length ? visits[0].survivalPercent : null,
        lastVisit: visits.length ? visits[0].date : null,
      });
    });
    return map;
  }, [scoped, plans, checkins]);

  const q = query.trim().toLowerCase();
  const visible = scoped.filter((s) => {
    const f = FILTERS.find((x) => x.label === filter);
    if (f && !f.match(s)) return false;
    if (!q) return true;
    return `${s.name} ${s.soilType} ${s.waterAccess} ${s.sunlight}`.toLowerCase().includes(q);
  });

  const totalArea = scoped.reduce((sum, s) => sum + s.area, 0);
  const totalTrees = scoped.reduce((sum, s) => sum + (stats.get(s.id)?.trees ?? 0), 0);
  const growing = scoped.filter((s) => s.status === "active").length;

  const isCitizen = currentUser.role === "citizen";

  return (
    <div className="space-y-6">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src="/scenes/empty-plot.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

          <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-9">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                {isCitizen ? "Your spaces" : "Locality overview"}
              </p>

              <h1 className="mt-2 font-onest text-2xl font-semibold tracking-[-0.8px] text-white lg:text-[32px]">
                {isCitizen ? "The land you've put to work" : "Every registered plot"}
              </h1>

              <div className="mt-6 flex flex-wrap items-end gap-x-9 gap-y-5">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-onest text-[40px] font-semibold leading-none tracking-[-1.8px] text-white lg:text-[50px]">
                      <CountUp value={scoped.length} />
                    </span>
                    <span className="text-sm font-medium text-[#95D5B2]">
                      {scoped.length === 1 ? "site" : "sites"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/50">{growing} actively growing</p>
                </div>

                <div className="h-10 w-px bg-white/15 max-sm:hidden" />

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-onest text-[30px] font-semibold leading-none tracking-[-1px] text-white">
                      <CountUp value={totalArea} />
                    </span>
                    <span className="text-sm font-medium text-[#95D5B2]">sqm</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/50">under plantation</p>
                </div>

                <div className="h-10 w-px bg-white/15 max-sm:hidden" />

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-onest text-[30px] font-semibold leading-none tracking-[-1px] text-white">
                      <CountUp value={totalTrees} />
                    </span>
                    <span className="text-sm font-medium text-[#95D5B2]">trees</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/50">planned or planted</p>
                </div>
              </div>

              <Link href="/sites/new" className="mt-7 inline-block">
                <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
                  <Plus className="mr-1.5 size-4" />
                  Register a space
                </Button>
              </Link>
            </div>

            <div className="relative shrink-0 self-end lg:self-center">
              <div className="absolute inset-0 rounded-full bg-[#52B788]/15 blur-2xl" />
              <Image
                src={scoped.length ? "/mascot/sprout-pointing.png" : "/mascot/sprout-sleeping.png"}
                alt=""
                width={140}
                height={140}
                className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========================================================== toolbar */}
      <Reveal delay={0.08}>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
          {/* filters carry their own counts — a tab you know is empty before
              clicking saves the click */}
          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => {
              const count = scoped.filter(f.match).length;
              const on = filter === f.label;
              return (
                <button
                  key={f.label}
                  onClick={() => setFilter(f.label)}
                  className="relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
                >
                  {on && (
                    <motion.span
                      layoutId="siteFilterPill"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#1B4332]"
                    />
                  )}
                  <span
                    className={
                      "relative flex items-center gap-1.5 " +
                      (on ? "text-white" : "text-ink-soft hover:text-ink-strong")
                    }
                  >
                    {f.label}
                    <span className={on ? "text-[#95D5B2]" : "text-ink-ghost"}>{count}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, soil, water…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </div>
      </Reveal>

      {/* ============================================================ body */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3.5">
          {!ready &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[142px] rounded-2xl bg-surface/70" />
            ))}

          {ready && visible.length === 0 && <EmptySites hasSites={scoped.length > 0} />}

          {ready &&
            visible.map((site, i) => {
              const s = stats.get(site.id)!;
              return (
                <Reveal key={site.id} delay={0.05 * i}>
                  <SiteRow
                    site={site}
                    trees={s.trees}
                    survival={s.survival}
                    lastVisit={s.lastVisit}
                    hovered={hovered === site.id}
                    onHover={setHovered}
                  />
                </Reveal>
              );
            })}
        </div>

        {/* map stays in view while the list scrolls */}
        <Reveal delay={0.15} className="max-xl:hidden">
          <div className="sticky top-4 space-y-4">
            {visible.length > 0 && (
              <LocalityMap sites={visible} hovered={hovered} onHover={setHovered} />
            )}

            <div className="rounded-2xl border border-line bg-[#1B4332] p-5">
              <Sprout className="size-5 text-[#95D5B2]" />
              <p className="mt-3 font-onest text-[15px] font-semibold leading-snug tracking-[-0.3px] text-white">
                Know another open space?
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-white/55">
                A rooftop, a compound edge, an unused corner — register it and Dhaatri
                will assess whether it can hold trees.
              </p>
              <Link href="/sites/new" className="mt-4 inline-block">
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-white/25 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"
                >
                  Register it
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ empty state */

function EmptySites({ hasSites }: { hasSites: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 py-16">
      <Image
        src={hasSites ? "/mascot/sprout-thinking.png" : "/mascot/sprout-pointing.png"}
        alt=""
        width={124}
        height={124}
      />
      <p className="mt-3 font-onest text-[17px] font-semibold tracking-[-0.3px] text-ink-strong">
        {hasSites ? "Nothing matches that" : "No spaces registered yet"}
      </p>
      <p className="mb-5 mt-1 max-w-[320px] text-center text-[13px] leading-5 text-ink-faint">
        {hasSites
          ? "Try a different filter, or clear the search to see every site."
          : "Register a space and Sprout will walk it through assessment, planning and planting."}
      </p>
      {!hasSites && (
        <Link href="/sites/new">
          <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
            <Plus className="mr-1.5 size-4" />
            Register a space
          </Button>
        </Link>
      )}
    </div>
  );
}
