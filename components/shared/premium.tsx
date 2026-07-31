"use client";

/**
 * The design kit every app screen is built from.
 *
 * These exist because the same five shapes — a scene hero with live figures, a
 * section head, a hairline-divided metric strip, filter pills, a mascot-led
 * empty state — carry every screen in the product. Rebuilding them per page is
 * how a UI ends up as thirty slightly different card grids.
 */

import React from "react";
import Image from "next/image";
import { motion, animate } from "framer-motion";

export const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/* --------------------------------------------------------------------- now */

/**
 * The current time, but only after mount.
 *
 * Reading `Date.now()` during render makes the prerendered HTML disagree with
 * the client — an "overdue" badge that flickers on hydration. Returning 0 until
 * the effect runs keeps the first paint deterministic; callers treat 0 as
 * "don't know yet" and simply don't mark anything late.
 */
/** Never fires — the clock is read once per page load, not subscribed to. */
const noSubscribe = () => () => {};

/** Captured on the first client read so the snapshot stays stable across renders. */
let readAt = 0;

export function useNow() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => (readAt ||= Date.now()),
    () => 0
  );
}

/** Whole days between `date` and now; 0 before the clock is known. */
export function daysSince(date: string, now: number) {
  return now ? Math.floor((now - +new Date(date)) / 86400000) : 0;
}

/* ------------------------------------------------------------------ motion */

export function Reveal({
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

/** A figure that lands feels alive; one that simply appears doesn't. */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value]);

  return (
    <>
      {prefix}
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

/* -------------------------------------------------------------------- hero */

export type HeroFigure = { value: number | string; unit?: string; note: string; decimals?: number };

export function PageHero({
  eyebrow,
  title,
  scene = "canopy",
  mascot,
  figures = [],
  actions,
}: {
  eyebrow: string;
  title: string;
  scene?: "canopy" | "plot" | "forest";
  mascot?: string;
  figures?: HeroFigure[];
  actions?: React.ReactNode;
}) {
  const src =
    scene === "plot"
      ? "/scenes/empty-plot.png"
      : scene === "forest"
        ? "/scenes/forest-banner.png"
        : "/scenes/canopy-banner.png";

  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
        <Image src={src} alt="" fill sizes="100vw" className="object-cover opacity-35" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

        <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
              {eyebrow}
            </p>

            <h1 className="mt-2 font-onest text-2xl font-semibold tracking-[-0.8px] text-white lg:text-[32px]">
              {title}
            </h1>

            {figures.length > 0 && (
              <div className="mt-6 flex flex-wrap items-end gap-x-9 gap-y-5">
                {figures.map((f, i) => (
                  <React.Fragment key={f.note}>
                    {i > 0 && <div className="h-9 w-px bg-white/15 max-sm:hidden" />}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={
                            "font-onest font-semibold leading-none text-white " +
                            (i === 0
                              ? "text-[38px] tracking-[-1.6px] lg:text-[46px]"
                              : "text-[30px] tracking-[-1px]")
                          }
                        >
                          {typeof f.value === "number" ? (
                            <CountUp value={f.value} decimals={f.decimals ?? 0} />
                          ) : (
                            f.value
                          )}
                        </span>
                        {f.unit && (
                          <span className="text-sm font-medium text-[#95D5B2]">{f.unit}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13px] text-white/50">{f.note}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}

            {actions && <div className="mt-7 flex flex-wrap gap-2.5">{actions}</div>}
          </div>

          {mascot && (
            <div className="relative shrink-0 self-end lg:self-center">
              <div className="absolute inset-0 rounded-full bg-[#52B788]/15 blur-2xl" />
              <Image
                src={`/mascot/${mascot}.png`}
                alt=""
                width={140}
                height={140}
                className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- section */

export function SectionHead({
  eyebrow,
  title,
  note,
  right,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52B788]">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-onest text-[22px] font-semibold tracking-[-0.8px] text-ink-strong">
          {title}
        </h2>
        {note && <p className="mt-1 text-[13px] text-ink-faint">{note}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------ metric strip */

export type StripItem = {
  label: string;
  value: number | string;
  note: string;
  decimals?: number;
  /** A small visualisation. Carries more than a decorative icon would. */
  viz?: React.ReactNode;
};

export function StatStrip({ items }: { items: StripItem[] }) {
  const cols =
    items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <div
      className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-2 ${cols}`}
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="group relative border-b border-line p-5 transition-colors last:border-b-0 hover:bg-surface-2 sm:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
            {it.label}
          </p>
          <p className="mt-3 truncate font-onest text-[30px] font-semibold leading-none tracking-[-1.3px] text-ink-strong">
            {typeof it.value === "number" ? (
              <CountUp value={it.value} decimals={it.decimals ?? 0} />
            ) : (
              it.value
            )}
          </p>
          <p className="mt-1.5 truncate text-[13px] text-ink-soft">{it.note}</p>
          {it.viz && <div className="mt-4 h-6">{it.viz}</div>}
        </div>
      ))}
    </div>
  );
}

/** Bars sized to their own values — the shape a row of numbers already implies. */
export function VizBars({ values, color = "#7A9E3F" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-6 items-end gap-[3px]">
      {values.map((v, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(8, (v / max) * 100)}%` }}
          transition={{ duration: 0.6, delay: i * 0.04, ease: EASE }}
          style={{ background: color }}
          className="w-1.5 rounded-full opacity-70"
        />
      ))}
    </div>
  );
}

/** One pip per item, filled when the item is "on". */
export function VizPips({ states, color = "#52B788" }: { states: boolean[]; color?: string }) {
  return (
    <div className="flex h-6 items-center gap-1.5">
      {states.map((on, i) => (
        <span
          key={i}
          style={{ background: on ? color : "#EBE6DE" }}
          className="h-6 w-2.5 rounded-full"
        />
      ))}
      {states.length === 0 && <span className="text-[12px] text-ink-ghost">—</span>}
    </div>
  );
}

/** A proportion split across categories, as one bar. */
export function VizSplit({ parts }: { parts: { value: number; color: string; label?: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-track">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ width: 0 }}
          animate={{ width: `${(p.value / total) * 100}%` }}
          transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
          style={{ background: p.color }}
          title={p.label}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- filters */

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { label: T; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((o) => {
        const on = value === o.label;
        return (
          <button
            key={o.label}
            onClick={() => onChange(o.label)}
            className="relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          >
            {on && (
              <motion.span
                layoutId={layoutId}
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
              {o.label}
              {o.count !== undefined && (
                <span className={on ? "text-[#95D5B2]" : "text-ink-ghost"}>{o.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The bar filters and search sit in. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- data rows */

export type DataRow = { k: string; v: React.ReactNode; extra?: React.ReactNode };

/** Label/value pairs. A table beats six icons in six tinted squares. */
export function DataRows({ rows }: { rows: DataRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {rows.map((row) => (
        <div
          key={row.k}
          className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-[15px] transition-colors last:border-b-0 hover:bg-surface-2"
        >
          <span className="text-[13px] font-medium text-ink-faint">{row.k}</span>
          <span className="flex items-baseline gap-2.5 text-right">
            <span className="text-[15px] font-semibold text-ink-strong">{row.v}</span>
            {row.extra && <span className="text-[12px] text-ink-ghost">{row.extra}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ dark panel */

/** The inverted-ink block — used once per screen, for the thing that matters most. */
export function InvertedPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#1B4332] p-6 lg:p-8 ${className}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#52B788]/12 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function InvertedFigure({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#95D5B2]">{label}</p>
      <p className="mt-2.5 truncate font-onest text-[28px] font-semibold leading-none tracking-[-1px] text-white">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[13px] text-white/45">{note}</p>
    </div>
  );
}

/* ----------------------------------------------------------- empty state */

export function Awaiting({
  pose = "sprout-thinking",
  title,
  body,
  action,
}: {
  pose?: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 py-14">
      <Image src={`/mascot/${pose}.png`} alt="" width={112} height={112} />
      <p className="mt-3 font-onest text-[17px] font-semibold tracking-[-0.3px] text-ink-strong">
        {title}
      </p>
      <p className="mt-1 max-w-[380px] text-center text-[13px] leading-5 text-ink-faint">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- badge */

const TONE: Record<string, string> = {
  green: "bg-[#E9F5EE] text-ink-brand",
  amber: "bg-[#FAEDCD] text-[#8B5E3C]",
  blue: "bg-[#DCEAF5] text-[#3B7EA1]",
  red: "bg-[#FBDDD2] text-[#B4553F]",
  ink: "bg-[#1B4332] text-white",
  grey: "bg-track text-ink-soft",
};

export function Pill({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.6px] ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps every status string in the product to a badge tone. */
export function toneFor(status: string): keyof typeof TONE {
  if (["completed", "verified", "approved", "active", "delivered", "published"].includes(status))
    return "green";
  if (["pending", "pending_review", "review", "draft", "processing", "plan_review"].includes(status))
    return "amber";
  if (["flagged", "cancelled", "refunded"].includes(status)) return "red";
  if (["retired", "assigned", "in_progress", "dispatched"].includes(status)) return "blue";
  return "grey";
}

/* ------------------------------------------------------------------ rail */

/** A vertical event rail — used for logs, timelines and ledgers. */
export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative space-y-5 pl-5">
      <span className="absolute bottom-2 left-[5px] top-2 w-px bg-track" />
      {children}
    </div>
  );
}

export function RailNode({
  color = "#52B788",
  children,
}: {
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span
        style={{ background: color }}
        className="absolute -left-5 top-1 size-[11px] rounded-full ring-4 ring-surface"
      />
      {children}
    </div>
  );
}
