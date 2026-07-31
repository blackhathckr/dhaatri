"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Camera,
  Plus,
  Sprout,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from '@/store';
import { useNow } from "@/components/shared/premium";
import { SITE_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ chart */

const survivalConfig = {
  survival: { label: "Survival", color: "#2D6A4F" },
} satisfies ChartConfig;

const co2Config = {
  co2: { label: "CO₂", color: "#52B788" },
} satisfies ChartConfig;

/* ---------------------------------------------------------------- helpers */

const ease = [0.21, 0.47, 0.32, 0.98] as const;

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * A metric tile: label, animated figure, and a small visualisation of the
 * underlying data. Deliberately no icon — the sparkline/pips carry more
 * information than a decorative glyph in a tinted square.
 */
function MetricTile({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: number;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative border-b border-line p-5 transition-colors last:border-b-0 hover:bg-surface-2 sm:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
        {label}
      </p>

      <p className="mt-3 font-onest text-[34px] font-semibold leading-none tracking-[-1.4px] text-ink-strong">
        <CountUp value={value} />
      </p>

      <p className="mt-1.5 text-[13px] text-ink-soft">{note}</p>

      <div className="mt-4 h-6">{children}</div>
    </div>
  );
}

/** Counts up on mount — a figure that lands feels alive; one that appears doesn't. */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}

/* -------------------------------------------------------------- dashboard */

export function CitizenDashboard() {
  const { checkins: MOCK_CHECKINS, plans: MOCK_PLANS, requests: MOCK_REQUESTS, sites: MOCK_SITES } = useData();
  const { currentUser } = useAuthContext();
  const now = useNow();

  const mySites = MOCK_SITES.filter((s) => s.ownerId === currentUser.id);
  const siteIds = mySites.map((s) => s.id);
  const myRequests = MOCK_REQUESTS.filter((r) => r.requesterId === currentUser.id);
  const myCheckins = MOCK_CHECKINS.filter((c) => siteIds.includes(c.siteId));
  const myPlans = MOCK_PLANS.filter((p) => siteIds.includes(p.siteId));

  const trees = myPlans.reduce(
    (sum, p) => sum + p.species.reduce((a, sp) => a + sp.quantity, 0),
    0
  );
  const co2 = Math.round(myPlans.reduce((s, p) => s + p.estimatedCo2PerYear, 0) * 1000);
  const survival = myCheckins.length
    ? myCheckins.reduce((a, c) => a + c.survivalPercent, 0) / myCheckins.length
    : 0;
  const activeSites = mySites.filter((s) => s.status === "active").length;

  // Survival over time, oldest first — the trend is the story, not the latest value.
  const trend = [...myCheckins]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((c) => ({
      date: new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      survival: c.survivalPercent,
      co2: Math.round((c.survivalPercent / 100) * co2),
    }));

  const openRequests = myRequests.filter((r) => r.status !== "completed").length;

  // How far the most advanced request has travelled through the 13-stage flow.
  const FLOW = [
    "pending", "assigned", "assessment_scheduled", "assessment_complete",
    "plan_ready", "plan_review", "approved", "order_placed",
    "delivered", "planting_scheduled", "planted", "monitoring", "completed",
  ];
  const furthestStage = myRequests.reduce(
    (max, r) => Math.max(max, FLOW.indexOf(r.status)),
    -1
  );

  // Last 8 weeks of check-in activity, oldest first.
  const weeks = Array.from({ length: 8 })
    .map((_, i) => {
      const end = now - i * 7 * 86400000;
      const start = end - 7 * 86400000;
      return myCheckins.some((c) => {
        const t = +new Date(c.date);
        return t > start && t <= end;
      });
    })
    .reverse();

  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src="/scenes/canopy-banner.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/85 to-[#12362A]/40" />

          <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-9">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Your impact so far
              </p>

              <h1 className="mt-2 font-onest text-2xl font-semibold tracking-[-0.8px] text-white lg:text-[32px]">
                Good to see you, {firstName}
              </h1>

              <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-5">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-onest text-[44px] font-semibold leading-none tracking-[-2px] text-white lg:text-[56px]">
                      {co2.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-medium text-[#95D5B2]">kg CO₂/yr</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/50">
                    absorbed across {mySites.length} {mySites.length === 1 ? "site" : "sites"}
                  </p>
                </div>

                <div className="h-10 w-px bg-white/15 max-lg:hidden" />

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-onest text-[32px] font-semibold leading-none tracking-[-1px] text-white">
                      {trees}
                    </span>
                    <span className="text-sm font-medium text-[#95D5B2]">trees</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/50">growing right now</p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/sites/new">
                  <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
                    <Plus className="mr-1.5 size-4" />
                    Register a site
                  </Button>
                </Link>
                <Link href="/sites">
                  <Button
                    variant="outline"
                    className="h-10 rounded-full border-white/25 bg-white/5 px-5 text-white hover:bg-white/15 hover:text-white"
                  >
                    <Camera className="mr-1.5 size-4" />
                    Log a check-in
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sprout reacts to how the trees are doing. */}
            <div className="relative shrink-0 self-end lg:self-center">
              <div className="absolute inset-0 rounded-full bg-[#52B788]/15 blur-2xl" />
              <Image
                src={survival >= 90 ? "/mascot/sprout-celebrating.png" : "/mascot/sprout-watering.png"}
                alt=""
                width={150}
                height={150}
                className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========================================================== metrics */}
      {/* One panel with hairline dividers, and every tile carries a small
          visualisation instead of an icon. A number beside a decorative icon
          tells you nothing the number didn't already say. */}
      <Reveal delay={0.08}>
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
          {/* sites — one pip per site, filled when active */}
          <MetricTile label="My sites" value={mySites.length} note={`${activeSites} active now`}>
            <div className="flex items-center gap-1.5">
              {mySites.map((s) => (
                <span
                  key={s.id}
                  title={s.name}
                  className={
                    "h-6 w-2.5 rounded-full transition-colors " +
                    (s.status === "active" ? "bg-[#52B788]" : "bg-track")
                  }
                />
              ))}
              {mySites.length === 0 && <span className="text-[12px] text-ink-ghost">—</span>}
            </div>
          </MetricTile>

          {/* trees — proportional canopy, one leaf per ~5 trees */}
          <MetricTile label="Trees planted" value={trees} note="across all plans">
            <div className="flex items-end gap-[3px]">
              {Array.from({ length: Math.min(12, Math.max(1, Math.round(trees / 5))) }).map((_, i) => (
                <span
                  key={i}
                  style={{ height: 10 + ((i * 7) % 14) }}
                  className="w-1.5 rounded-full bg-[#7A9E3F]/70"
                />
              ))}
            </div>
          </MetricTile>

          {/* check-ins — last 8 weeks, filled where a visit was logged */}
          <MetricTile label="Check-ins" value={myCheckins.length} note="geo-tagged visits">
            <div className="flex items-center gap-1">
              {weeks.map((on, i) => (
                <span
                  key={i}
                  className={
                    "h-6 flex-1 rounded-[3px] " + (on ? "bg-[#B7791F]" : "bg-track")
                  }
                />
              ))}
            </div>
          </MetricTile>

          {/* requests — lifecycle position of the most advanced request */}
          <MetricTile
            label="Requests"
            value={myRequests.length}
            note={`${openRequests} in progress`}
          >
            <div className="flex items-center gap-[3px]">
              {Array.from({ length: 13 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 flex-1 rounded-full " +
                    (i <= furthestStage ? "bg-[#3B7EA1]" : "bg-track")
                  }
                />
              ))}
            </div>
          </MetricTile>
        </div>
      </Reveal>

      {/* ===================================================== charts row */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Reveal delay={0.3}>
          <Card className="h-full border-line">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="font-onest text-base font-semibold tracking-[-0.3px] text-ink-strong">
                  Survival over time
                </CardTitle>
                <p className="mt-1 text-[13px] text-ink-faint">
                  Every point is a verified, geo-tagged check-in
                </p>
              </div>
              <Badge className="gap-1 border-0 bg-[#D8F3DC] text-ink-brand hover:bg-[#D8F3DC]">
                <TrendingUp className="size-3" />
                {survival.toFixed(1)}% avg
              </Badge>
            </CardHeader>

            <CardContent className="pt-4">
              {trend.length ? (
                <ChartContainer config={survivalConfig} className="h-[240px] w-full">
                  <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fillSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#52B788" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#52B788" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EBE6DE" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fill: "#9AA39C", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[60, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#9AA39C", fontSize: 12 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Area
                      dataKey="survival"
                      type="monotone"
                      stroke="#2D6A4F"
                      strokeWidth={2.5}
                      fill="url(#fillSurvival)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyChart />
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* radial gauge — one number, given room to breathe */}
        <Reveal delay={0.35}>
          <Card className="h-full border-line">
            <CardHeader className="pb-0">
              <CardTitle className="font-onest text-base font-semibold tracking-[-0.3px] text-ink-strong">
                Current survival
              </CardTitle>
              <p className="mt-1 text-[13px] text-ink-faint">Across all your sites</p>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              <ChartContainer config={co2Config} className="mx-auto aspect-square h-[190px]">
                <RadialBarChart
                  data={[{ name: "survival", value: survival, fill: "#52B788" }]}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={72}
                  outerRadius={96}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" background={{ fill: "#EBE6DE" }} cornerRadius={12} />
                </RadialBarChart>
              </ChartContainer>

              <div className="-mt-[124px] text-center">
                <p className="font-onest text-[34px] font-semibold leading-none tracking-[-1.5px] text-ink-strong">
                  {survival.toFixed(1)}%
                </p>
                <p className="mt-1 text-[13px] text-ink-faint">alive</p>
              </div>

              <p className="mt-[86px] text-center text-[13px] leading-5 text-ink-soft">
                {survival >= 90
                  ? "Thriving — keep the check-ins coming."
                  : "Some replacement planting may be needed."}
              </p>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* ======================================================= your sites */}
      <Reveal delay={0.4}>
        <Card className="border-line">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-onest text-base font-semibold tracking-[-0.3px] text-ink-strong">
                Your forest
              </CardTitle>
              <p className="mt-1 text-[13px] text-ink-faint">
                {mySites.length} registered {mySites.length === 1 ? "space" : "spaces"}
              </p>
            </div>
            <Link href="/sites">
              <Button variant="ghost" className="h-9 text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong">
                See all
                <ArrowUpRight className="ml-1 size-4" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {mySites.length === 0 && <EmptySites />}

            {mySites.map((site) => {
              const latest = [...myCheckins]
                .filter((c) => c.siteId === site.id)
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
              const plan = myPlans.find((p) => p.siteId === site.id);
              const planted = plan?.species.reduce((s, sp) => s + sp.quantity, 0) ?? 0;

              return (
                <Link key={site.id} href={`/sites/${site.id}`} className="block">
                  <div className="group flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-22px_rgba(4,39,24,0.4)] sm:flex-row sm:items-center">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
                      <Sprout className="size-5 text-ink-brand" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <p className="truncate font-medium text-ink-strong">{site.name}</p>
                        <Badge className="border-0 bg-[#E9F5EE] text-[11px] font-medium text-ink-brand hover:bg-[#E9F5EE]">
                          {SITE_STATUS_LABELS[site.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-ink-faint">
                        {site.area} sqm · {planted} trees · {site.waterAccess}
                      </p>
                    </div>

                    {latest ? (
                      <div className="w-full sm:w-44">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[12px] text-ink-faint">Survival</span>
                          <span className="text-[13px] font-semibold text-ink-brand">
                            {latest.survivalPercent}%
                          </span>
                        </div>
                        <Progress
                          value={latest.survivalPercent}
                          className="h-1.5 bg-track [&>div]:bg-[#52B788]"
                        />
                        <p className="mt-1.5 text-[11px] text-ink-ghost">
                          Last check-in {formatDate(latest.date)}
                        </p>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-line text-[12px] font-normal text-ink-faint"
                      >
                        Awaiting first check-in
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

/* ----------------------------------------------------------- empty states */

function EmptyChart() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center">
      <Image src="/mascot/sprout-sleeping.png" alt="" width={96} height={96} />
      <p className="mt-2 text-sm font-medium text-ink-strong">No check-ins yet</p>
      <p className="text-[13px] text-ink-faint">Survival data appears after the first visit</p>
    </div>
  );
}

function EmptySites() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line py-10">
      <Image src="/mascot/sprout-pointing.png" alt="" width={112} height={112} />
      <p className="mt-2 font-medium text-ink-strong">No sites registered yet</p>
      <p className="mb-4 text-[13px] text-ink-faint">
        Register a space and Sprout will help it grow
      </p>
      <Link href="/sites/new">
        <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
          <Plus className="mr-1.5 size-4" />
          Register a site
        </Button>
      </Link>
    </div>
  );
}
