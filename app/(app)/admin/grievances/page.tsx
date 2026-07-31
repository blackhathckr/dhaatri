"use client";

import React from "react";
import { motion } from "framer-motion";
import { CreditCard, MapPin, MessageSquare, UserCog } from "lucide-react";

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
  daysSince,
  useNow,
} from "@/components/shared/premium";
import { formatDate, formatDateRelative } from "@/lib/format";

type Status = "open" | "in_progress" | "resolved";

type Grievance = {
  id: string;
  subject: string;
  description: string;
  submittedBy: string;
  email: string;
  category: "site_issue" | "payment" | "account" | "general";
  status: Status;
  priority: "low" | "medium" | "high";
  createdAt: string;
};

const CATEGORY: Record<
  Grievance["category"],
  { icon: React.ElementType; tint: string; ink: string; label: string }
> = {
  site_issue: { icon: MapPin, tint: "bg-[#E9F5EE]", ink: "text-ink-brand", label: "Site issue" },
  payment: { icon: CreditCard, tint: "bg-[#FAEDCD]", ink: "text-[#B7791F]", label: "Payment" },
  account: { icon: UserCog, tint: "bg-[#DCEAF5]", ink: "text-[#3B7EA1]", label: "Account" },
  general: { icon: MessageSquare, tint: "bg-track", ink: "text-ink-soft", label: "General" },
};

const SEED: Grievance[] = [
  {
    id: "grv-001",
    subject: "Saplings not delivered on the scheduled date",
    description:
      "I was expecting 25 saplings on 15 July but nothing has arrived. The order still shows dispatched.",
    submittedBy: "Priya Sharma",
    email: "priya@example.com",
    category: "site_issue",
    status: "open",
    priority: "high",
    createdAt: "2026-07-20",
  },
  {
    id: "grv-002",
    subject: "Donation receipt not generated",
    description:
      "I contributed ₹5,000 on 10 July but haven't received the 80G receipt. Transaction TXN-2026-0710.",
    submittedBy: "Deepa Mohan",
    email: "deepa@example.com",
    category: "payment",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-07-12",
  },
  {
    id: "grv-003",
    subject: "Cannot switch my account to volunteer",
    description:
      "I completed the volunteer onboarding form last week but my account still shows as a citizen.",
    submittedBy: "Arjun Rao",
    email: "arjun@example.com",
    category: "account",
    status: "open",
    priority: "low",
    createdAt: "2026-07-25",
  },
  {
    id: "grv-004",
    subject: "Survival figure on my site looks wrong",
    description:
      "The last check-in says 78% but I counted the trees myself this weekend and nearly all are alive.",
    submittedBy: "Rahul Nair",
    email: "rahul@example.com",
    category: "site_issue",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-07-27",
  },
  {
    id: "grv-005",
    subject: "Carbon certificate shows the wrong organisation name",
    description: "Certificate cert-002 lists our old registered name. Please reissue it.",
    submittedBy: "GreenTech Solutions",
    email: "ops@greentech.example",
    category: "general",
    status: "resolved",
    priority: "medium",
    createdAt: "2026-07-05",
  },
];

const NEXT: Record<Status, Status> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "open",
};

type Filter = "All" | "Open" | "In progress" | "Resolved";

export default function GrievancesPage() {
  const [rows, setRows] = React.useState(SEED);
  const [filter, setFilter] = React.useState<Filter>("All");
  const now = useNow();

  const advance = (id: string) =>
    setRows((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: NEXT[g.status] } : g))
    );

  const visible = rows.filter((g) => {
    if (filter === "All") return true;
    if (filter === "Open") return g.status === "open";
    if (filter === "In progress") return g.status === "in_progress";
    return g.status === "resolved";
  });

  const open = rows.filter((g) => g.status !== "resolved");
  const high = open.filter((g) => g.priority === "high");

  // Days the oldest unresolved complaint has been sitting.
  const oldest = open.length
    ? Math.max(...open.map((g) => daysSince(g.createdAt, now)))
    : 0;

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Administration"
        title={open.length ? `${open.length} open complaints` : "Nothing outstanding"}
        scene="plot"
        mascot={high.length ? "sprout-sad" : open.length ? "sprout-thinking" : "sprout-celebrating"}
        figures={[
          { value: rows.length, unit: "total", note: `${rows.length - open.length} resolved` },
          { value: high.length, unit: "high", note: "priority, still open" },
          { value: oldest, unit: "days", note: "the oldest one has waited" },
        ]}
      />

      <Reveal delay={0.08}>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Where the complaints come from
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(CATEGORY) as Grievance["category"][]).map((c) => {
              const of = rows.filter((g) => g.category === c);
              return (
                <InvertedFigure
                  key={c}
                  label={CATEGORY[c].label}
                  value={of.length}
                  note={`${of.filter((g) => g.status !== "resolved").length} still open`}
                />
              );
            })}
          </div>
        </InvertedPanel>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="grievanceFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: rows.length },
              { label: "Open" as Filter, count: rows.filter((g) => g.status === "open").length },
              {
                label: "In progress" as Filter,
                count: rows.filter((g) => g.status === "in_progress").length,
              },
              {
                label: "Resolved" as Filter,
                count: rows.filter((g) => g.status === "resolved").length,
              },
            ]}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Queue"
            title={`${visible.length} ${visible.length === 1 ? "complaint" : "complaints"}`}
            note="Advancing one moves it open → in progress → resolved"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Awaiting
              pose="sprout-celebrating"
              title="Nothing in this state"
              body="Try another filter — or enjoy the empty queue."
            />
          )}

          {visible.map((g, i) => {
            const cat = CATEGORY[g.category];
            const age = daysSince(g.createdAt, now);
            return (
              <Reveal key={g.id} delay={0.04 * i}>
                <div
                  className={
                    "rounded-2xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] " +
                    (g.priority === "high" && g.status !== "resolved"
                      ? "border-[#E8B4A6]"
                      : "border-line")
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${cat.tint}`}
                    >
                      <cat.icon className={`size-[18px] ${cat.ink}`} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                          {g.subject}
                        </h3>
                        <Pill tone={toneFor(g.status)}>{g.status.replace("_", " ")}</Pill>
                        {g.priority === "high" && g.status !== "resolved" && (
                          <Pill tone="red">high priority</Pill>
                        )}
                      </div>

                      <p className="mt-1.5 text-[13px] text-ink-faint">
                        {g.id} · {g.submittedBy} · {g.email} · raised {formatDate(g.createdAt)} (
                        {formatDateRelative(g.createdAt)})
                      </p>

                      <p className="mt-3 rounded-xl bg-surface-3 px-4 py-3 text-[13px] leading-5 text-ink-soft">
                        {g.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-5">
                      <div className="w-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Waiting
                        </p>
                        <p
                          className={
                            "mt-1.5 font-onest text-[18px] font-semibold leading-none tracking-[-0.5px] " +
                            (age > 14 && g.status !== "resolved"
                              ? "text-[#B4553F]"
                              : "text-ink-strong")
                          }
                        >
                          {age}d
                        </p>
                      </div>

                      <Button
                        onClick={() => advance(g.id)}
                        variant={g.status === "resolved" ? "outline" : "default"}
                        className={
                          g.status === "resolved"
                            ? "h-10 rounded-full border-line px-5 text-ink-soft hover:bg-surface-3"
                            : "h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                        }
                      >
                        {g.status === "open"
                          ? "Start work"
                          : g.status === "in_progress"
                            ? "Resolve"
                            : "Reopen"}
                      </Button>
                    </div>
                  </div>

                  {/* three-state progress, so the queue reads at a glance */}
                  <div className="mt-4 flex items-center gap-1.5 border-t border-line-soft pt-4">
                    {(["open", "in_progress", "resolved"] as Status[]).map((s, idx) => {
                      const at = ["open", "in_progress", "resolved"].indexOf(g.status);
                      return (
                        <motion.span
                          key={s}
                          animate={{
                            backgroundColor:
                              idx < at ? "#95D5B2" : idx === at ? "#2D6A4F" : "#EBE6DE",
                          }}
                          className="h-1.5 flex-1 rounded-full"
                        />
                      );
                    })}
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
