"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Mail, MapPin, Phone, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CountUp,
  DataRows,
  InvertedPanel,
  InvertedFigure,
  Pill,
  Reveal,
  SectionHead,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData, computeCo2 } from "@/store";
import { ROLE_LABELS } from "@/lib/roles";
import { formatCurrency, formatDate } from "@/lib/format";

/** Milestones that unlock from real activity rather than a made-up score. */
function badges(stats: {
  sites: number;
  trees: number;
  checkins: number;
  co2: number;
  donated: number;
}) {
  return [
    { name: "First ground", note: "Registered a space", got: stats.sites >= 1 },
    { name: "Grove keeper", note: "Three spaces or more", got: stats.sites >= 3 },
    { name: "Hundred strong", note: "100 trees in the ground", got: stats.trees >= 100 },
    { name: "Reliable eyes", note: "Three verified check-ins", got: stats.checkins >= 3 },
    { name: "Tonne of good", note: "1,000 kg CO₂ per year", got: stats.co2 >= 1000 },
    { name: "Backer", note: "Contributed funds", got: stats.donated > 0 },
  ];
}

export default function ProfilePage() {
  const { currentUser } = useAuthContext();
  const state = useData();

  const mySites = state.sites.filter((s) => s.ownerId === currentUser.id);
  const siteIds = mySites.map((s) => s.id);
  const myPlans = state.plans.filter((p) => siteIds.includes(p.siteId));
  const myCheckins = state.checkins.filter(
    (c) => siteIds.includes(c.siteId) || c.userId === currentUser.id
  );
  const myTasks = state.tasks.filter((t) => t.volunteerId === currentUser.id);
  const myDonations = state.donations.filter((d) => d.donorId === currentUser.id);
  const myCredits = state.credits.filter((c) => c.organisationId === currentUser.id);

  const trees = myPlans.reduce(
    (sum, p) => sum + p.species.reduce((a, sp) => a + sp.quantity, 0),
    0
  );
  const survival = myCheckins.length
    ? myCheckins.reduce((a, c) => a + c.survivalPercent, 0) / myCheckins.length
    : 0;
  const co2 = myPlans.reduce(
    (sum, p) => sum + computeCo2(p.species, state.species, survival || 100),
    0
  );
  const donated = myDonations.reduce((a, d) => a + d.amount, 0);

  const list = badges({
    sites: mySites.length,
    trees,
    checkins: myCheckins.filter((c) => c.status === "verified").length,
    co2,
    donated,
  });
  const earned = list.filter((b) => b.got);

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src="/scenes/canopy-banner.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

          <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* a monogram beats a stock avatar nobody chose */}
              <div className="relative flex size-[88px] shrink-0 items-center justify-center rounded-2xl bg-[#52B788]/20 ring-1 ring-surface/15">
                <span className="font-onest text-[30px] font-semibold tracking-[-1px] text-white">
                  {initials}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                  {ROLE_LABELS[currentUser.role] ?? currentUser.role}
                </p>
                <h1 className="mt-2 font-onest text-[28px] font-semibold tracking-[-1px] text-white lg:text-[34px]">
                  {currentUser.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {currentUser.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {currentUser.location}
                  </span>
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-x-9 gap-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[34px] font-semibold leading-none tracking-[-1.4px] text-white">
                        <CountUp value={co2} />
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">kg CO₂/yr</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">attributable to you</p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[28px] font-semibold leading-none tracking-[-1px] text-white">
                        <CountUp value={trees} />
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">trees</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      across {mySites.length} {mySites.length === 1 ? "space" : "spaces"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Image
              src={survival >= 90 ? "/mascot/sprout-celebrating.png" : "/mascot/sprout-waving.png"}
              alt=""
              width={130}
              height={130}
              className="shrink-0 self-end drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)] lg:self-center"
            />
          </div>
        </div>
      </Reveal>

      {/* ========================================================= details */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Account"
            title="Who you are on Dhaatri"
            note="Everything a volunteer or the ops team can see"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <DataRows
              rows={[
                { k: "Name", v: currentUser.name },
                { k: "Role", v: <Pill>{ROLE_LABELS[currentUser.role] ?? currentUser.role}</Pill> },
                { k: "Email", v: currentUser.email },
                { k: "Phone", v: currentUser.phone },
                { k: "Locality", v: currentUser.location },
                { k: "User ID", v: <span className="font-mono text-[13px]">{currentUser.id}</span> },
              ]}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Your record
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure
                  label="Spaces"
                  value={mySites.length}
                  note={`${mySites.filter((s) => s.status === "active").length} growing now`}
                />
                <InvertedFigure
                  label="Check-ins"
                  value={myCheckins.length}
                  note={`${myCheckins.filter((c) => c.status === "verified").length} verified`}
                />
                <InvertedFigure
                  label="Survival"
                  value={survival ? `${survival.toFixed(1)}%` : "—"}
                  note="average across visits"
                />
                <InvertedFigure
                  label={currentUser.role === "volunteer" ? "Field tasks" : "Contributed"}
                  value={
                    currentUser.role === "volunteer"
                      ? myTasks.filter((t) => t.status === "completed").length
                      : donated
                        ? formatCurrency(donated)
                        : "—"
                  }
                  note={
                    currentUser.role === "volunteer"
                      ? `${myTasks.length} assigned in total`
                      : `${myDonations.length} donations`
                  }
                />
              </div>

              {myCredits.length > 0 && (
                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-[13px] text-white/55">
                    Holding{" "}
                    <span className="font-semibold text-white">
                      {myCredits.reduce((a, c) => a + c.credits, 0)} tCO₂e
                    </span>{" "}
                    in carbon credits across {myCredits.length} purchases.
                  </p>
                </div>
              )}
            </InvertedPanel>
          </Reveal>
        </div>
      </section>

      {/* ========================================================== badges */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Milestones"
            title={`${earned.length} of ${list.length} reached`}
            note="Unlocked by what actually happened on your sites, not by a points score"
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b, i) => (
            <Reveal key={b.name} delay={0.04 * i}>
              <div
                className={
                  "flex h-full items-center gap-4 rounded-2xl border p-5 transition-all " +
                  (b.got
                    ? "border-[#52B788]/40 bg-surface hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-24px_rgba(4,39,24,0.4)]"
                    : "border-dashed border-line bg-surface/50")
                }
              >
                <motion.span
                  initial={b.got ? { scale: 0.6, rotate: -12 } : false}
                  animate={b.got ? { scale: 1, rotate: 0 } : {}}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 * i }}
                  className={
                    "flex size-12 shrink-0 items-center justify-center rounded-xl " +
                    (b.got ? "bg-[#D8F3DC]" : "bg-track")
                  }
                >
                  <Award className={b.got ? "size-5 text-ink-brand" : "size-5 text-ink-ghost"} />
                </motion.span>
                <div className="min-w-0">
                  <p
                    className={
                      "font-onest text-[16px] font-semibold tracking-[-0.3px] " +
                      (b.got ? "text-ink-strong" : "text-ink-ghost")
                    }
                  >
                    {b.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-faint">{b.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =========================================================== sites */}
      {mySites.length > 0 && (
        <section>
          <Reveal>
            <SectionHead
              eyebrow="Your ground"
              title="Spaces in your name"
              right={
                <Link href="/sites">
                  <Button
                    variant="ghost"
                    className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                  >
                    See all
                  </Button>
                </Link>
              }
            />
          </Reveal>

          <div className="grid gap-3.5 md:grid-cols-2">
            {mySites.map((s, i) => (
              <Reveal key={s.id} delay={0.04 * i}>
                <Link href={`/sites/${s.id}`} className="block">
                  <div className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_14px_34px_-24px_rgba(4,39,24,0.4)]">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
                      <Sprout className="size-5 text-ink-brand" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                        {s.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-faint">
                        {s.area} sqm · {s.soilType} · {s.status}
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* contact block — kept last, it's the least interesting thing here */}
      <Reveal>
        <div className="flex flex-col gap-4 rounded-2xl bg-[#1B4332]/[0.04] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[13px] text-ink-soft">
            <Phone className="size-4 text-[#52B788]" />
            Reachable on {currentUser.phone} · joined the pilot {formatDate("2026-06-01")}
          </p>
          <Link href="/settings">
            <Button
              variant="outline"
              className="h-9 rounded-full border-line px-4 text-ink-brand hover:bg-[#D8F3DC]/40"
            >
              Edit in settings
            </Button>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
