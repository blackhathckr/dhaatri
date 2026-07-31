"use client";

import React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  Toolbar,
  VizSplit,
} from "@/components/shared/premium";
import { useData } from "@/store";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/data/types";

const ROLE_COLOR: Record<UserRole, string> = {
  citizen: "#52B788",
  dhaatri_ops: "#1B4332",
  supplier: "#B7791F",
  volunteer: "#7A9E3F",
  scientist: "#3B7EA1",
  donor: "#B4553F",
  organisation: "#6B5CA5",
  admin: "#2D6A4F",
};

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export default function AdminUsersPage() {
  const state = useData();

  const [role, setRole] = React.useState<string>("All");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const visible = state.users.filter((u) => {
    if (role !== "All" && ROLE_LABELS[u.role] !== role) return false;
    if (!q) return true;
    return `${u.name} ${u.email} ${u.location}`.toLowerCase().includes(q);
  });

  /** How much of the platform each role actually touches. */
  const activity = (u: (typeof state.users)[number]) => {
    switch (u.role) {
      case "citizen":
        return `${state.sites.filter((s) => s.ownerId === u.id).length} sites`;
      case "volunteer":
        return `${state.tasks.filter((t) => t.volunteerId === u.id).length} tasks`;
      case "supplier":
        return `${state.orders.filter((o) => o.supplierId === u.id).length} orders`;
      case "scientist":
        return `${state.advisories.filter((a) => a.scientistId === u.id).length} advisories`;
      case "donor":
        return `${state.donations.filter((d) => d.donorId === u.id).length} donations`;
      case "organisation":
        return `${state.credits.filter((c) => c.organisationId === u.id).length} credits`;
      default:
        return "platform-wide";
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Administration"
        title="Everyone on the platform"
        scene="forest"
        mascot="sprout-waving"
        figures={[
          { value: state.users.length, unit: "accounts", note: `across ${ROLES.length} roles` },
          {
            value: state.users.filter((u) => u.role === "citizen").length,
            unit: "citizens",
            note: "the largest group",
          },
          {
            value: state.notifications.filter((n) => !n.read).length,
            unit: "unread",
            note: "notifications platform-wide",
          },
        ]}
      />

      {/* role mix as one bar, then the breakdown */}
      <Reveal delay={0.08}>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52B788]">
            Role mix
          </p>
          <div className="mt-4">
            <VizSplit
              parts={ROLES.map((r) => ({
                value: state.users.filter((u) => u.role === r).length,
                color: ROLE_COLOR[r],
                label: ROLE_LABELS[r],
              }))}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
            {ROLES.map((r) => {
              const n = state.users.filter((u) => u.role === r).length;
              return (
                <span key={r} className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: ROLE_COLOR[r] }}
                  />
                  {ROLE_LABELS[r]}
                  <span className="font-semibold text-ink-strong">{n}</span>
                </span>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="userFilterPill"
            value={role}
            onChange={setRole}
            options={[
              { label: "All", count: state.users.length },
              ...ROLES.map((r) => ({
                label: ROLE_LABELS[r],
                count: state.users.filter((u) => u.role === r).length,
              })),
            ]}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, locality…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="Directory"
            title={`${visible.length} ${visible.length === 1 ? "account" : "accounts"}`}
            note="Activity counts come from the live prototype data"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="Nobody matches"
            body="Try a different role, or clear the search to see every account."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {visible.map((u, i) => (
              <Reveal key={u.id} delay={0.02 * i}>
                <div className="flex flex-col gap-4 border-b border-line-soft p-5 transition-colors last:border-b-0 hover:bg-surface-2 sm:flex-row sm:items-center">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl font-onest text-[14px] font-semibold text-white"
                    style={{ background: ROLE_COLOR[u.role] }}
                  >
                    {u.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                        {u.name}
                      </p>
                      <Pill tone={u.role === "admin" ? "ink" : "green"}>
                        {ROLE_LABELS[u.role]}
                      </Pill>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-faint">
                      {u.email} · {u.phone}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-8">
                    <div className="w-40">
                      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                        Locality
                      </p>
                      <p className="mt-1 truncate text-[13px] text-ink-soft">{u.location}</p>
                    </div>
                    <div className="w-28">
                      <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                        Activity
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-ink-brand">{activity(u)}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
