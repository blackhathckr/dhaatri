"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ClipboardCheck, Compass, Ruler, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  Toolbar,
  VizPips,
  toneFor,
  useNow,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatDate, formatDateRelative } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { VolunteerTaskType } from "@/data/types";

/** What each task type actually involves in the field. */
const TASK_KIND: Record<
  VolunteerTaskType,
  { label: string; icon: React.ElementType; tint: string; ink: string; note: string }
> = {
  site_assessment: {
    label: "Site assessment",
    icon: Ruler,
    tint: "bg-[#DCEAF5]",
    ink: "text-[#3B7EA1]",
    note: "Measure soil, sunlight, water and obstacles",
  },
  inspection: {
    label: "Inspection",
    icon: ClipboardCheck,
    tint: "bg-[#E9F5EE]",
    ink: "text-ink-brand",
    note: "Count surviving trees and photograph the plot",
  },
  data_collection: {
    label: "Data collection",
    icon: Compass,
    tint: "bg-[#E9EDC9]",
    ink: "text-[#7A9E3F]",
    note: "Growth measurements for the scientific panel",
  },
  planting_support: {
    label: "Planting support",
    icon: Sprout,
    tint: "bg-[#FAEDCD]",
    ink: "text-[#B7791F]",
    note: "On-site help the day the saplings go in",
  },
};

type Filter = "All" | "Assigned" | "In progress" | "Completed";

export default function VolunteerTasksPage() {
  const { state, toggleTask, submitAssessment } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");
  const now = useNow();

  // A volunteer sees their own list; ops and admin see the whole roster.
  const scoped =
    currentUser.role === "volunteer"
      ? state.tasks.filter((t) => t.volunteerId === currentUser.id)
      : state.tasks;

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? id;

  const visible = scoped.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Assigned") return t.status === "assigned";
    if (filter === "In progress") return t.status === "in_progress";
    return t.status === "completed";
  });

  const open = scoped.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => now > 0 && +new Date(t.dueDate) < now);
  const done = scoped.filter((t) => t.status === "completed");

  /** An assessment task files a real assessment, which moves the site on. */
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
    <div className="space-y-6">
      <PageHero
        eyebrow={currentUser.role === "volunteer" ? "Your field list" : "Volunteer roster"}
        title={
          open.length ? `${open.length} ${open.length === 1 ? "visit" : "visits"} to make` : "Nothing outstanding"
        }
        scene="plot"
        mascot={open.length ? "sprout-planting" : "sprout-celebrating"}
        figures={[
          { value: scoped.length, unit: "tasks", note: `${done.length} completed` },
          { value: overdue.length, unit: "overdue", note: "past their due date" },
          {
            value: new Set(scoped.map((t) => t.siteId)).size,
            unit: "sites",
            note: "under your care",
          },
        ]}
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={(Object.keys(TASK_KIND) as VolunteerTaskType[]).map((k) => {
            const of = scoped.filter((t) => t.type === k);
            return {
              label: TASK_KIND[k].label,
              value: of.length,
              note: `${of.filter((t) => t.status === "completed").length} done`,
              viz: <VizPips states={of.map((t) => t.status === "completed")} />,
            };
          })}
        />
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="taskFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: scoped.length },
              { label: "Assigned" as Filter, count: scoped.filter((t) => t.status === "assigned").length },
              { label: "In progress" as Filter, count: scoped.filter((t) => t.status === "in_progress").length },
              { label: "Completed" as Filter, count: done.length },
            ]}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Field work"
            title={`${visible.length} ${visible.length === 1 ? "task" : "tasks"}`}
            note="Completing an assessment files real findings and advances the site"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Awaiting
              pose="sprout-sleeping"
              title="Nothing here"
              body="New assessment tasks arrive automatically whenever a citizen registers a space."
            />
          )}

          {visible.map((t, i) => {
            const kind = TASK_KIND[t.type];
            const late = t.status !== "completed" && now > 0 && +new Date(t.dueDate) < now;
            const hasAssessment = state.assessments.some((a) => a.siteId === t.siteId);

            return (
              <Reveal key={t.id} delay={0.04 * i}>
                <div
                  className={
                    "rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] " +
                    (late ? "border-[#E8B4A6]" : "border-line")
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${kind.tint}`}
                    >
                      <kind.icon className={`size-[18px] ${kind.ink}`} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Link
                          href={`/sites/${t.siteId}`}
                          className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong underline-offset-4 hover:underline"
                        >
                          {siteName(t.siteId)}
                        </Link>
                        <Pill tone={toneFor(t.status)}>{t.status.replace("_", " ")}</Pill>
                        {late && <Pill tone="red">overdue</Pill>}
                      </div>

                      <p className="mt-1.5 text-[13px] text-ink-faint">
                        {kind.label} · {kind.note}
                      </p>
                      <p className="mt-1 text-[13px] text-ink-soft">{t.notes}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      <div className="w-28">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Due
                        </p>
                        <p
                          className={
                            "mt-1.5 text-[14px] font-semibold " +
                            (late ? "text-[#B4553F]" : "text-ink-strong")
                          }
                        >
                          {formatDate(t.dueDate)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-ghost">
                          {formatDateRelative(t.dueDate)}
                        </p>
                      </div>

                      {/* an assessment task does real work; everything else just closes */}
                      {t.type === "site_assessment" && !hasAssessment ? (
                        <Button
                          onClick={() => fileAssessment(t.id, t.siteId)}
                          className="h-10 shrink-0 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                        >
                          File findings
                        </Button>
                      ) : (
                        <button
                          onClick={() => toggleTask({ taskId: t.id })}
                          className={
                            "flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors " +
                            (t.status === "completed"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]"
                              : "border-line hover:border-[#52B788]")
                          }
                          title={t.status === "completed" ? "Reopen" : "Mark complete"}
                        >
                          <motion.span
                            initial={false}
                            animate={{ scale: t.status === "completed" ? 1 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <Check className="size-5 text-white" />
                          </motion.span>
                        </button>
                      )}
                    </div>
                  </div>

                  {currentUser.role !== "volunteer" && (
                    <p className="mt-4 border-t border-line-soft pt-3.5 text-[12px] text-ink-ghost">
                      Assigned to {getUserById(t.volunteerId)?.name ?? t.volunteerId}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
