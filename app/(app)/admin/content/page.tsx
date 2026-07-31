"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Globe,
  HelpCircle,
  Mail,
  Megaphone,
  Pencil,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FilterPills,
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

type Section = {
  id: string;
  title: string;
  route?: string;
  description: string;
  icon: React.ElementType;
  lastUpdated: string;
  status: "published" | "draft";
  words: number;
};

const SECTIONS: Section[] = [
  {
    id: "cnt-001",
    title: "Landing page",
    route: "/",
    description:
      "Hero, impact figures, the five feature rows, engagement models and the closing call to action.",
    icon: Globe,
    lastUpdated: "2026-07-28",
    status: "published",
    words: 1240,
  },
  {
    id: "cnt-002",
    title: "About",
    route: "/about",
    description:
      "Why the platform exists, the eight stakeholder roles, the carbon methodology and the pilot timeline.",
    icon: BookOpen,
    lastUpdated: "2026-07-31",
    status: "published",
    words: 940,
  },
  {
    id: "cnt-003",
    title: "Impact",
    route: "/impact",
    description:
      "Published trees, survival and CO₂ figures, per-site breakdown and the real-terms equivalences.",
    icon: Megaphone,
    lastUpdated: "2026-07-30",
    status: "published",
    words: 620,
  },
  {
    id: "cnt-004",
    title: "Transparency",
    route: "/transparency",
    description:
      "The public fund ledger, where every ₹100 lands, per-site funding and the month-by-month record.",
    icon: Shield,
    lastUpdated: "2026-07-31",
    status: "published",
    words: 780,
  },
  {
    id: "cnt-005",
    title: "FAQ",
    description:
      "Plantation, carbon credits, donations and volunteering — the questions the pilot team keeps being asked.",
    icon: HelpCircle,
    lastUpdated: "2026-07-22",
    status: "published",
    words: 2100,
  },
  {
    id: "cnt-006",
    title: "Privacy policy",
    description: "Data collection, geo-tag handling, retention and the grievance route.",
    icon: Shield,
    lastUpdated: "2026-06-30",
    status: "published",
    words: 1450,
  },
  {
    id: "cnt-007",
    title: "Volunteer handbook",
    description: "Field protocol for assessments and check-ins, including photo and geo-tag standards.",
    icon: BookOpen,
    lastUpdated: "2026-07-18",
    status: "draft",
    words: 3200,
  },
  {
    id: "cnt-008",
    title: "Notification templates",
    description: "Copy for every automated email and in-app notification the workflow raises.",
    icon: Mail,
    lastUpdated: "2026-07-25",
    status: "draft",
    words: 540,
  },
];

type Filter = "All" | "Published" | "Draft";

export default function ContentPage() {
  const [filter, setFilter] = React.useState<Filter>("All");
  const now = useNow();

  const visible = SECTIONS.filter((s) =>
    filter === "All" ? true : s.status === filter.toLowerCase()
  );

  const published = SECTIONS.filter((s) => s.status === "published");
  const words = SECTIONS.reduce((a, s) => a + s.words, 0);
  const stale = SECTIONS.filter(
    (s) => daysSince(s.lastUpdated, now) > 30
  );

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Administration"
        title="Public content"
        scene="forest"
        mascot="sprout-reading"
        figures={[
          { value: SECTIONS.length, unit: "sections", note: `${published.length} published` },
          { value: words, unit: "words", note: "across the public site" },
          { value: stale.length, unit: "stale", note: "not touched in 30 days" },
        ]}
      />

      <Reveal delay={0.08}>
        <Toolbar>
          <FilterPills
            layoutId="contentFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: SECTIONS.length },
              { label: "Published" as Filter, count: published.length },
              { label: "Draft" as Filter, count: SECTIONS.length - published.length },
            ]}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.12}>
          <SectionHead
            eyebrow="Sections"
            title={`${visible.length} ${visible.length === 1 ? "section" : "sections"}`}
            note="Live pages link straight through to what a visitor sees"
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((s, i) => {
            const isStale = daysSince(s.lastUpdated, now) > 30;
            return (
              <Reveal key={s.id} delay={0.04 * i}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-3">
                      <s.icon className="size-[18px] text-ink-brand" />
                    </span>
                    <div className="flex items-center gap-2">
                      {isStale && <Pill tone="amber">stale</Pill>}
                      <Pill tone={toneFor(s.status)}>{s.status}</Pill>
                    </div>
                  </div>

                  <h3 className="mt-4 font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                    {s.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[23px] text-ink-soft">
                    {s.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-3.5">
                    <span className="text-[12px] text-ink-ghost">
                      {s.words.toLocaleString("en-IN")} words · updated{" "}
                      {formatDateRelative(s.lastUpdated)}
                    </span>
                    {s.route ? (
                      <Link href={s.route} target="_blank">
                        <Button
                          variant="ghost"
                          className="h-8 rounded-full px-3 text-[13px] text-ink-brand hover:bg-[#D8F3DC]/50"
                        >
                          <Pencil className="mr-1.5 size-3.5" />
                          View live
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-[12px] text-ink-ghost">
                        {formatDate(s.lastUpdated)}
                      </span>
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
