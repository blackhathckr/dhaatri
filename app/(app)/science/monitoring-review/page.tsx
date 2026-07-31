"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatDate, formatDateRelative } from "@/lib/format";
import { getUserById } from "@/data/mock";

/** Below this, the panel treats survival as needing corrective action. */
const CONCERN = 85;

type Filter = "Awaiting review" | "Verified" | "Flagged" | "All";

export default function MonitoringReviewPage() {
  const { state, reviewCheckin } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("Awaiting review");

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? id;

  const pending = state.checkins.filter((c) => c.status === "pending_review");
  const verified = state.checkins.filter((c) => c.status === "verified");
  const flagged = state.checkins.filter((c) => c.status === "flagged");

  const visible = [...state.checkins]
    .filter((c) =>
      filter === "All"
        ? true
        : filter === "Awaiting review"
          ? c.status === "pending_review"
          : filter === "Verified"
            ? c.status === "verified"
            : c.status === "flagged"
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const avgSurvival = verified.length
    ? verified.reduce((a, c) => a + c.survivalPercent, 0) / verified.length
    : 0;

  const scientistId =
    currentUser.role === "scientist"
      ? currentUser.id
      : (state.users.find((u) => u.role === "scientist")?.id ?? currentUser.id);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Scientific panel"
        title={
          pending.length
            ? `${pending.length} ${pending.length === 1 ? "check-in" : "check-ins"} await review`
            : "Review queue is clear"
        }
        scene="canopy"
        mascot={pending.length ? "sprout-reading" : "sprout-celebrating"}
        figures={[
          { value: state.checkins.length, unit: "check-ins", note: "logged in total" },
          { value: avgSurvival, unit: "%", decimals: 1, note: "average verified survival" },
          { value: flagged.length, unit: "flagged", note: "carrying a live advisory" },
        ]}
      />

      {/* what verification actually decides */}
      <Reveal delay={0.08}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Why this queue matters
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-3">
            <InvertedFigure
              label="Awaiting"
              value={pending.length}
              note="not yet counted in any figure"
            />
            <InvertedFigure
              label="Verified"
              value={verified.length}
              note="feeding the carbon engine"
            />
            <InvertedFigure
              label="Flagged"
              value={flagged.length}
              note="advisory auto-published"
            />
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-[13px] leading-5 text-white/55">
            Only verified check-ins enter the published CO₂ figure. Flagging one immediately
            raises a corrective advisory against the site and notifies its owner — nothing has
            to be written by hand.
          </p>
        </InvertedPanel>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="reviewFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "Awaiting review" as Filter, count: pending.length },
              { label: "Verified" as Filter, count: verified.length },
              { label: "Flagged" as Filter, count: flagged.length },
              { label: "All" as Filter, count: state.checkins.length },
            ]}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Field reports"
            title={`${visible.length} ${visible.length === 1 ? "report" : "reports"}`}
            note="Survival below 85% is where the panel usually intervenes"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Awaiting
              pose="sprout-celebrating"
              title="Nothing to review"
              body="New reports land here as soon as a volunteer logs a geo-tagged visit."
            />
          )}

          {visible.map((c, i) => {
            const low = c.survivalPercent < CONCERN;
            const reporter = getUserById(c.userId);
            return (
              <Reveal key={c.id} delay={0.04 * i}>
                <div
                  className={
                    "rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] " +
                    (c.status === "flagged" ? "border-[#E8B4A6]" : "border-line")
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    {/* survival as a ring — the single number the review turns on */}
                    <div className="relative flex size-16 shrink-0 items-center justify-center">
                      <svg viewBox="0 0 40 40" className="absolute size-full -rotate-90">
                        <circle cx="20" cy="20" r="17" fill="none" stroke="#EBE6DE" strokeWidth="4" />
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="17"
                          fill="none"
                          stroke={low ? "#B4553F" : "#52B788"}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 17}
                          initial={{ strokeDashoffset: 2 * Math.PI * 17 }}
                          animate={{
                            strokeDashoffset: 2 * Math.PI * 17 * (1 - c.survivalPercent / 100),
                          }}
                          transition={{ duration: 0.9, delay: 0.04 * i }}
                        />
                      </svg>
                      <span className="font-onest text-[14px] font-semibold tracking-[-0.4px] text-ink-strong">
                        {Math.round(c.survivalPercent)}%
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Link
                          href={`/sites/${c.siteId}`}
                          className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong underline-offset-4 hover:underline"
                        >
                          {siteName(c.siteId)}
                        </Link>
                        <Pill tone={toneFor(c.status)}>{c.status.replace("_", " ")}</Pill>
                        {low && <Pill tone="red">below threshold</Pill>}
                      </div>

                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-faint">
                        <span>
                          {c.survivalCount} of {c.totalTrees} alive
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Camera className="size-3.5" />
                          {c.photos} photos
                        </span>
                        {c.geoTagged && (
                          <span className="flex items-center gap-1.5 text-ink-brand">
                            <MapPin className="size-3.5" />
                            geo-tagged
                          </span>
                        )}
                        <span>
                          {formatDate(c.date)} · {formatDateRelative(c.date)}
                        </span>
                      </p>

                      {c.notes && (
                        <p className="mt-2.5 rounded-xl bg-surface-3 px-4 py-3 text-[13px] leading-5 text-ink-soft">
                          &ldquo;{c.notes}&rdquo; — {reporter?.name ?? "field volunteer"}
                        </p>
                      )}
                    </div>

                    {c.status === "pending_review" ? (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          onClick={() =>
                            reviewCheckin({ checkinId: c.id, verdict: "verified", scientistId })
                          }
                          className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                        >
                          <Check className="mr-1.5 size-4" />
                          Verify
                        </Button>
                        <Button
                          onClick={() =>
                            reviewCheckin({ checkinId: c.id, verdict: "flagged", scientistId })
                          }
                          variant="outline"
                          className="h-10 rounded-full border-[#E8B4A6] px-5 text-[#B4553F] hover:bg-[#FBDDD2]/40 hover:text-[#8B4A38]"
                        >
                          <AlertTriangle className="mr-1.5 size-4" />
                          Flag
                        </Button>
                      </div>
                    ) : (
                      <p className="shrink-0 text-[12px] text-ink-ghost lg:w-32 lg:text-right">
                        {c.status === "verified"
                          ? "Counted in published figures"
                          : "Advisory published"}
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
