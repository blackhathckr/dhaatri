"use client";

import React from "react";
import { CheckCheck, Dot } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Reveal,
  SectionHead,
  Toolbar,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatDateRelative } from "@/lib/format";

/** Notification type → the accent it reads in. Colour carries the category. */
const TYPE_TONE: Record<string, { dot: string; tint: string; ink: string }> = {
  request: { dot: "#B7791F", tint: "bg-[#FAEDCD]", ink: "text-[#8B5E3C]" },
  task: { dot: "#3B7EA1", tint: "bg-[#DCEAF5]", ink: "text-[#3B7EA1]" },
  assessment: { dot: "#3B7EA1", tint: "bg-[#DCEAF5]", ink: "text-[#3B7EA1]" },
  plan: { dot: "#7A9E3F", tint: "bg-[#E9EDC9]", ink: "text-[#7A9E3F]" },
  plan_ready: { dot: "#7A9E3F", tint: "bg-[#E9EDC9]", ink: "text-[#7A9E3F]" },
  approval: { dot: "#2D6A4F", tint: "bg-[#E9F5EE]", ink: "text-ink-brand" },
  order: { dot: "#B7791F", tint: "bg-[#FAEDCD]", ink: "text-[#8B5E3C]" },
  planted: { dot: "#2D6A4F", tint: "bg-[#E9F5EE]", ink: "text-ink-brand" },
  monitoring: { dot: "#52B788", tint: "bg-[#E9F5EE]", ink: "text-ink-brand" },
  monitoring_due: { dot: "#52B788", tint: "bg-[#E9F5EE]", ink: "text-ink-brand" },
  donation: { dot: "#B4553F", tint: "bg-[#FBDDD2]", ink: "text-[#B4553F]" },
  credit: { dot: "#6B5CA5", tint: "bg-[#E4E0F2]", ink: "text-[#6B5CA5]" },
};

const fallback = { dot: "#9AA39C", tint: "bg-track", ink: "text-ink-soft" };

type Filter = "All" | "Unread" | "Read";

export default function NotificationsPage() {
  const { state, markNotification, markAllNotifications } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");

  const mine = state.notifications.filter((n) => n.userId === currentUser.id);
  const unread = mine.filter((n) => !n.read);

  const visible = mine.filter((n) =>
    filter === "All" ? true : filter === "Unread" ? !n.read : n.read
  );

  // Grouped by day, newest first — a flat list of forty makes you read dates twice.
  const grouped = Object.entries(
    [...visible]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .reduce<Record<string, typeof visible>>((acc, n) => {
        const key = formatDateRelative(n.date);
        (acc[key] ||= []).push(n);
        return acc;
      }, {})
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Your inbox"
        title={unread.length ? `${unread.length} things need you` : "You're all caught up"}
        scene="forest"
        mascot={unread.length ? "sprout-holding-phone" : "sprout-sleeping"}
        figures={[
          { value: mine.length, unit: "total", note: "since you joined" },
          { value: unread.length, unit: "unread", note: "waiting on you" },
        ]}
        actions={
          unread.length > 0 ? (
            <Button
              onClick={() => markAllNotifications({ userId: currentUser.id })}
              className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]"
            >
              <CheckCheck className="mr-1.5 size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Reveal delay={0.08}>
        <Toolbar>
          <FilterPills
            layoutId="notifFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: mine.length },
              { label: "Unread" as Filter, count: unread.length },
              { label: "Read" as Filter, count: mine.length - unread.length },
            ]}
          />
        </Toolbar>
      </Reveal>

      {visible.length === 0 ? (
        <Reveal delay={0.12}>
          <Awaiting
            pose="sprout-sleeping"
            title={filter === "Unread" ? "Nothing unread" : "Nothing here"}
            body="Notifications arrive as your sites move through assessment, planning, planting and monitoring."
          />
        </Reveal>
      ) : (
        grouped.map(([day, items], gi) => (
          <section key={day}>
            <Reveal delay={0.1 + gi * 0.04}>
              <SectionHead
                eyebrow={day}
                title={`${items.length} ${items.length === 1 ? "update" : "updates"}`}
              />
            </Reveal>

            <div className="space-y-2.5">
              {items.map((n, i) => {
                const tone = TYPE_TONE[n.type] ?? fallback;
                return (
                  <Reveal key={n.id} delay={0.03 * i}>
                    <button
                      onClick={() => markNotification({ id: n.id, read: !n.read })}
                      className={
                        "group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_rgba(4,39,24,0.4)] " +
                        (n.read ? "border-line bg-surface/70" : "border-[#52B788]/40 bg-surface")
                      }
                    >
                      {/* the category, as a coloured rule rather than another icon square */}
                      <span
                        style={{ background: tone.dot }}
                        className="mt-1 h-10 w-1 shrink-0 rounded-full"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={
                              "font-onest text-[16px] tracking-[-0.3px] " +
                              (n.read
                                ? "font-medium text-ink-soft"
                                : "font-semibold text-ink-strong")
                            }
                          >
                            {n.title}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.6px] ${tone.tint} ${tone.ink}`}
                          >
                            {n.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[14px] leading-[22px] text-ink-soft">
                          {n.message}
                        </p>
                        <p className="mt-2 text-[12px] text-ink-ghost">
                          {formatDateRelative(n.date)}
                          <span className="ml-2 opacity-0 transition-opacity group-hover:opacity-100">
                            · click to mark {n.read ? "unread" : "read"}
                          </span>
                        </p>
                      </div>

                      {!n.read && <Dot className="size-8 shrink-0 text-[#52B788]" />}
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
