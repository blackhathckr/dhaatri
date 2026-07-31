"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, HandHeart, Search, Wallet } from "lucide-react";

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
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from "@/store";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatDateRelative } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { RequestStatus } from "@/data/types";

/** Proposal §5 — the thirteen states a request passes through, in order. */
const FLOW: RequestStatus[] = [
  "pending",
  "assigned",
  "assessment_scheduled",
  "assessment_complete",
  "plan_ready",
  "plan_review",
  "approved",
  "order_placed",
  "delivered",
  "planting_scheduled",
  "planted",
  "monitoring",
  "completed",
];

/** Which of the four phases a state belongs to — the useful grouping. */
const PHASE: Record<string, "Intake" | "Planning" | "Fulfilment" | "Growing"> = {
  pending: "Intake",
  assigned: "Intake",
  assessment_scheduled: "Intake",
  assessment_complete: "Intake",
  plan_ready: "Planning",
  plan_review: "Planning",
  approved: "Planning",
  order_placed: "Fulfilment",
  delivered: "Fulfilment",
  planting_scheduled: "Fulfilment",
  planted: "Growing",
  monitoring: "Growing",
  completed: "Growing",
};

const PHASE_COLOR: Record<string, string> = {
  Intake: "#B7791F",
  Planning: "#3B7EA1",
  Fulfilment: "#7A9E3F",
  Growing: "#2D6A4F",
};

type Filter = "All" | "Intake" | "Planning" | "Fulfilment" | "Growing";
const FILTERS: Filter[] = ["All", "Intake", "Planning", "Fulfilment", "Growing"];

export default function RequestsPage() {
  const { requests, sites } = useData();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");

  // A citizen sees the requests they raised; every other role sees the queue.
  const scoped =
    currentUser.role === "citizen"
      ? requests.filter((r) => r.requesterId === currentUser.id)
      : requests;

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;

  const q = query.trim().toLowerCase();
  const visible = scoped.filter((r) => {
    if (filter !== "All" && PHASE[r.status] !== filter) return false;
    if (!q) return true;
    return `${siteName(r.siteId)} ${REQUEST_STATUS_LABELS[r.status]}`.toLowerCase().includes(q);
  });

  const open = scoped.filter((r) => r.status !== "completed").length;
  const paid = scoped.filter((r) => r.model === "paid").length;

  // Where the queue is bunching up — the thing an ops lead actually looks for.
  const byPhase = (["Intake", "Planning", "Fulfilment", "Growing"] as const).map((p) => ({
    phase: p,
    count: scoped.filter((r) => PHASE[r.status] === p).length,
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={currentUser.role === "citizen" ? "Your requests" : "The queue"}
        title={
          currentUser.role === "citizen"
            ? "Every space you've put forward"
            : "Plantation requests in flight"
        }
        scene="forest"
        mascot={open > 0 ? "sprout-holding-phone" : "sprout-sleeping"}
        figures={[
          { value: scoped.length, unit: "requests", note: `${open} still moving` },
          { value: paid, unit: "paid", note: `${scoped.length - paid} on stewardship` },
          {
            value: scoped.filter((r) => r.status === "completed").length,
            unit: "done",
            note: "reached completion",
          },
        ]}
      />

      {/* where the queue is bunching up */}
      <Reveal delay={0.08}>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
          {byPhase.map((p) => (
            <button
              key={p.phase}
              onClick={() => setFilter(p.phase)}
              className="border-b border-r border-line p-5 text-left transition-colors last:border-r-0 hover:bg-surface-2 lg:border-b-0"
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PHASE_COLOR[p.phase] }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                  {p.phase}
                </span>
              </span>
              <p className="mt-3 font-onest text-[30px] font-semibold leading-none tracking-[-1.3px] text-ink-strong">
                {p.count}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-soft">
                {p.count === 1 ? "request" : "requests"} here
              </p>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="requestFilterPill"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((f) => ({
              label: f,
              count:
                f === "All" ? scoped.length : scoped.filter((r) => PHASE[r.status] === f).length,
            }))}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by site or stage…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="In flight"
            title={`${visible.length} ${visible.length === 1 ? "request" : "requests"}`}
            note="Each bar is the thirteen-stage lifecycle; the filled part is the distance travelled"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Reveal delay={0.2}>
              <Awaiting
                pose="sprout-thinking"
                title="Nothing in this phase"
                body="Try another phase, or clear the search to see the whole queue."
              />
            </Reveal>
          )}

          {visible.map((r, i) => {
            const at = FLOW.indexOf(r.status);
            const phase = PHASE[r.status];
            const requester = getUserById(r.requesterId);

            return (
              <Reveal key={r.id} delay={0.04 * i}>
                <Link href={`/requests/${r.id}`} className="block">
                  <div className="group rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      {/* engagement model, as the plainest possible signal */}
                      <span
                        className={
                          "flex size-11 shrink-0 items-center justify-center rounded-xl " +
                          (r.model === "paid" ? "bg-[#FAEDCD]" : "bg-[#E9EDC9]")
                        }
                      >
                        {r.model === "paid" ? (
                          <Wallet className="size-[18px] text-[#B7791F]" />
                        ) : (
                          <HandHeart className="size-[18px] text-[#7A9E3F]" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <h3 className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                            {siteName(r.siteId)}
                          </h3>
                          <Pill tone={r.status === "completed" ? "green" : "amber"}>
                            {REQUEST_STATUS_LABELS[r.status]}
                          </Pill>
                        </div>

                        <p className="mt-1.5 truncate text-[13px] text-ink-faint">
                          {r.id} · raised by {requester?.name ?? "—"} ·{" "}
                          {formatDateRelative(r.createdAt)} · updated{" "}
                          {formatDateRelative(r.updatedAt)}
                        </p>

                        <div className="mt-4 max-w-[420px]">
                          <div className="flex items-center gap-[3px]">
                            {FLOW.map((s, idx) => (
                              <span
                                key={s}
                                title={REQUEST_STATUS_LABELS[s]}
                                style={{
                                  background:
                                    idx < at
                                      ? "#95D5B2"
                                      : idx === at
                                        ? PHASE_COLOR[phase]
                                        : "#EBE6DE",
                                }}
                                className="h-1.5 flex-1 rounded-full transition-colors"
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-[12px] text-ink-faint">
                            Stage {at + 1} of {FLOW.length} · {phase.toLowerCase()} phase
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-start gap-6">
                        <div className="w-20 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                            Model
                          </p>
                          <p className="mt-1.5 text-[15px] font-semibold text-ink-strong">
                            {r.model === "paid" ? "Paid" : "Steward"}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 size-5 -translate-x-1 text-ink-ghost transition-all group-hover:translate-x-0 group-hover:text-ink-brand" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
