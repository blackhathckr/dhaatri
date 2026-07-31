"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

import {
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
} from "@/components/shared/premium";
import { useData } from "@/store";
import { ROLE_LABELS, ROUTE_PERMISSIONS, SIDEBAR_NAV } from "@/lib/roles";
import type { UserRole } from "@/data/types";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const AREAS = Object.keys(ROUTE_PERMISSIONS);

/** What each role is actually accountable for in the lifecycle (proposal §3). */
const MANDATE: Record<UserRole, string> = {
  citizen: "Registers open space, approves the plan, and stewards or funds the planting.",
  dhaatri_ops: "Owns triage, plantation planning, supply orders and public reporting.",
  supplier: "Holds nursery stock, fulfils orders and confirms delivery to site.",
  volunteer: "Assesses sites and logs the geo-tagged check-ins everything else rests on.",
  scientist: "Defines the species table and carbon methodology; verifies field reports.",
  donor: "Contributes funds and receives receipts traceable through the public ledger.",
  organisation: "Purchases carbon credits backed by verified plantation.",
  admin: "User and master-data management, verification and grievance handling.",
};

export default function AdminRolesPage() {
  const state = useData();

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Administration"
        title="Roles and what they can reach"
        scene="plot"
        mascot="sprout-reading"
        figures={[
          { value: ROLES.length, unit: "roles", note: "in the access model" },
          { value: AREAS.length, unit: "areas", note: "under route permission" },
          { value: state.users.length, unit: "accounts", note: "assigned to a role" },
        ]}
      />

      {/* ------------------------------------------------------- mandates */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Accountability"
            title="What each role owns"
            note="Every stage of the lifecycle has exactly one role responsible for clearing it"
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((r, i) => {
            const count = state.users.filter((u) => u.role === r).length;
            return (
              <Reveal key={r} delay={0.04 * i}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                      {ROLE_LABELS[r]}
                    </h3>
                    <Pill tone={r === "admin" ? "ink" : "green"}>
                      {count} {count === 1 ? "account" : "accounts"}
                    </Pill>
                  </div>

                  <p className="mt-2.5 flex-1 text-[14px] leading-[23px] text-ink-soft">
                    {MANDATE[r]}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line-soft pt-3.5">
                    {SIDEBAR_NAV[r].slice(0, 5).map((item) => (
                      <span
                        key={item.url}
                        className="rounded-full bg-surface-3 px-2.5 py-1 text-[11px] text-ink-soft"
                      >
                        {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------ the matrix */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Route permissions"
            title="The access matrix"
            note="Exactly what the app enforces — read straight from the permission table"
          />
        </Reveal>

        <Reveal delay={0.05}>
          {/* wide table scrolls in its own container rather than the page */}
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-10 bg-surface px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                    Area
                  </th>
                  {ROLES.map((r) => (
                    <th
                      key={r}
                      className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-faint"
                    >
                      {ROLE_LABELS[r].split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AREAS.map((area) => (
                  <tr
                    key={area}
                    className="border-b border-line-soft transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="sticky left-0 z-10 bg-surface px-5 py-3.5 font-mono text-[13px] text-ink-strong">
                      {area}
                    </td>
                    {ROLES.map((r) => {
                      const allowed = ROUTE_PERMISSIONS[area].includes(r);
                      return (
                        <td key={r} className="px-3 py-3.5 text-center">
                          <span
                            className={
                              "inline-flex size-6 items-center justify-center rounded-full " +
                              (allowed ? "bg-[#D8F3DC]" : "bg-[#F3F1EC]")
                            }
                          >
                            {allowed ? (
                              <Check className="size-3.5 text-ink-brand" />
                            ) : (
                              <Minus className="size-3.5 text-ink-ghost" />
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------ separation */}
      <Reveal>
        <InvertedPanel>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
            Separation of duties
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-3">
            <InvertedFigure
              label="Records the data"
              value="Volunteer"
              note="counts trees on site, geo-tagged"
            />
            <InvertedFigure
              label="Verifies it"
              value="Scientist"
              note="a different role, always"
            />
            <InvertedFigure
              label="Publishes it"
              value="Dhaatri ops"
              note="only from verified inputs"
            />
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-[13px] leading-5 text-white/55">
            No single role can both record a survival figure and publish it. That split is what
            makes a Dhaatri carbon figure defensible to a sponsor who wasn&apos;t there.
          </p>
        </InvertedPanel>
      </Reveal>
    </div>
  );
}
