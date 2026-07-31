"use client";

import React from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Awaiting,
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  VizBars,
  VizPips,
  toneFor,
  useNow,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatDate, formatDateRelative } from "@/lib/format";

const chartConfig = { survival: { label: "Survival", color: "#2D6A4F" } } satisfies ChartConfig;

export function VolunteerDashboard() {
  const { state, toggleTask, submitAssessment } = useStore();
  const { currentUser } = useAuthContext();
  const now = useNow();

  const tasks = state.tasks.filter((t) => t.volunteerId === currentUser.id);
  const open = tasks.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => now > 0 && +new Date(t.dueDate) < now);
  const mine = state.checkins.filter((c) => c.userId === currentUser.id);

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? id;

  const trend = [...mine]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((c) => ({
      date: new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      survival: c.survivalPercent,
    }));

  const fileAssessment = (taskId: string, siteId: string) => {
    const site = state.sites.find((s) => s.id === siteId);
    if (!site) return;
    submitAssessment({
      taskId,
      assessment: {
        siteId,
        volunteerId: currentUser.id,
        date: new Date().toISOString().slice(0, 10),
        soilPh: 6.8,
        soilType: site.soilType,
        areaConfirmed: site.area,
        sunlightHours: site.sunlight === "Full" ? "6-8 hours" : "4-6 hours",
        waterSource: site.waterAccess,
        obstacles: "None significant",
        photos: 4,
      },
    });
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Field volunteer"
        title={open.length ? `${open.length} ${open.length === 1 ? "visit" : "visits"} on your list` : "Nothing outstanding"}
        scene="plot"
        mascot={overdue.length ? "sprout-sad" : open.length ? "sprout-planting" : "sprout-celebrating"}
        figures={[
          { value: tasks.length, unit: "tasks", note: `${tasks.length - open.length} completed` },
          { value: mine.length, unit: "check-ins", note: "you've logged" },
          { value: overdue.length, unit: "overdue", note: "past their due date" },
        ]}
        actions={
          <Link href="/volunteers/tasks">
            <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
              Open the field list
              <ArrowUpRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Assigned",
              value: open.length,
              note: `${overdue.length} overdue`,
              viz: <VizPips states={tasks.map((t) => t.status === "completed")} />,
            },
            {
              label: "Sites covered",
              value: new Set(tasks.map((t) => t.siteId)).size,
              note: "under your care",
              viz: <VizPips states={[...new Set(tasks.map((t) => t.siteId))].map(() => true)} color="#3B7EA1" />,
            },
            {
              label: "Reports filed",
              value: mine.length,
              note: `${mine.filter((c) => c.status === "verified").length} verified`,
              viz: <VizBars values={mine.map((c) => c.survivalPercent)} color="#52B788" />,
            },
            {
              label: "Average survival",
              value: mine.length
                ? mine.reduce((a, c) => a + c.survivalPercent, 0) / mine.length
                : 0,
              decimals: 1,
              note: "across your visits",
              viz: <VizBars values={mine.map((c) => c.survivalPercent)} color="#7A9E3F" />,
            },
          ]}
        />
      </Reveal>

      {/* --------------------------------------------------------- tasks */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Field work"
            title="Next visits"
            note="Filing an assessment moves the site straight to the planning stage"
          />
        </Reveal>

        <div className="space-y-3.5">
          {open.length === 0 && (
            <Awaiting
              pose="sprout-celebrating"
              title="Nothing on your list"
              body="New assessment tasks arrive automatically whenever a citizen registers a space near you."
            />
          )}

          {open.slice(0, 5).map((t, i) => {
            const late = now > 0 && +new Date(t.dueDate) < now;
            const hasAssessment = state.assessments.some((a) => a.siteId === t.siteId);
            return (
              <Reveal key={t.id} delay={0.04 * i}>
                <div
                  className={
                    "flex flex-col gap-5 rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] lg:flex-row lg:items-center " +
                    (late ? "border-[#E8B4A6]" : "border-line")
                  }
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#DCEAF5]">
                    <MapPin className="size-[18px] text-[#3B7EA1]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/sites/${t.siteId}`}
                        className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong underline-offset-4 hover:underline"
                      >
                        {siteName(t.siteId)}
                      </Link>
                      <Pill tone={toneFor(t.status)}>{t.status.replace("_", " ")}</Pill>
                      {late && <Pill tone="red">overdue</Pill>}
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-faint">
                      {t.type.replace(/_/g, " ")} · due {formatDate(t.dueDate)} (
                      {formatDateRelative(t.dueDate)})
                    </p>
                    <p className="mt-1 text-[13px] text-ink-soft">{t.notes}</p>
                  </div>

                  {t.type === "site_assessment" && !hasAssessment ? (
                    <Button
                      onClick={() => fileAssessment(t.id, t.siteId)}
                      className="h-10 shrink-0 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                    >
                      File findings
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toggleTask({ taskId: t.id })}
                      variant="outline"
                      className="h-10 shrink-0 rounded-full border-line px-5 text-ink-brand hover:bg-[#D8F3DC]/40"
                    >
                      <Check className="mr-1.5 size-4" />
                      Mark done
                    </Button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------- your data */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Your record"
            title="What your visits showed"
            note="These are the numbers the carbon engine runs on"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="h-full rounded-2xl border border-line bg-surface p-5">
              {trend.length ? (
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fillVol" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#fillVol)"
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <Awaiting
                  pose="sprout-watering"
                  title="No check-ins yet"
                  body="Your survival trend appears once you've logged your first geo-tagged visit."
                />
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Why it matters
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure label="Verified" value={mine.filter((c) => c.status === "verified").length} note="counted in published CO₂" />
                <InvertedFigure label="Awaiting" value={mine.filter((c) => c.status === "pending_review").length} note="with the science panel" />
                <InvertedFigure label="Photos" value={mine.reduce((a, c) => a + c.photos, 0)} note="uploaded from the field" />
                <InvertedFigure label="Geo-tagged" value={`${mine.filter((c) => c.geoTagged).length}/${mine.length || 0}`} note="location confirmed" />
              </div>
              <p className="mt-7 border-t border-white/10 pt-6 text-[13px] leading-5 text-white/55">
                Nothing Dhaatri publishes about survival or carbon exists without a volunteer
                standing on the plot and counting.
              </p>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
