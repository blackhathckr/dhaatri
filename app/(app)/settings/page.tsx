"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHero, Reveal, SectionHead } from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";

/* ---------------------------------------------------------------- switch */

/** A switch that reads as one — shadcn has no switch installed and this is 12 lines. */
function Toggle({
  on,
  onChange,
  label,
  note,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-6 border-b border-line-soft px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-surface-2"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink-strong">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-5 text-ink-faint">{note}</span>
      </span>
      <span
        className={
          "flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-[3px] transition-colors " +
          (on ? "bg-[#2D6A4F]" : "bg-[#E0DDD6]")
        }
      >
        <motion.span
          animate={{ x: on ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="size-5 rounded-full bg-surface shadow-sm"
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ page */

export default function SettingsPage() {
  const { currentUser } = useAuthContext();
  const { reset, state } = useStore();

  const [name, setName] = React.useState(currentUser.name);
  const [phone, setPhone] = React.useState(currentUser.phone);
  const [location, setLocation] = React.useState(currentUser.location);
  const [language, setLanguage] = React.useState("English");

  const [prefs, setPrefs] = React.useState({
    planReady: true,
    checkinDue: true,
    advisories: true,
    ledger: false,
    digest: true,
  });

  const [saved, setSaved] = React.useState(false);
  const [wasReset, setWasReset] = React.useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const doReset = () => {
    reset();
    setWasReset(true);
    setTimeout(() => setWasReset(false), 2600);
  };

  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Settings"
        title="How Dhaatri works for you"
        scene="plot"
        mascot="sprout-reading"
      />

      {/* ========================================================= profile */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Your details"
            title="Contact and locality"
            note="Volunteers use this to reach you about site visits"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                  Full name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                  Phone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                  Locality
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                  Language
                </label>
                <Select value={language} onValueChange={(v) => setLanguage(v ?? "English")}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-line">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["English", "ಕನ್ನಡ (Kannada)", "हिन्दी (Hindi)"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <Button
                onClick={save}
                className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
              >
                Save changes
              </Button>
              <motion.span
                initial={false}
                animate={{ opacity: saved ? 1 : 0, x: saved ? 0 : -6 }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-ink-brand"
              >
                <Check className="size-4" />
                Saved
              </motion.span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* =================================================== notifications */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Notifications"
            title="What reaches you"
            note="Everything else stays in the inbox until you look"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Toggle
              on={prefs.planReady}
              onChange={set("planReady")}
              label="Plan ready for approval"
              note="When Dhaatri has drawn up a plantation plan for one of your spaces."
            />
            <Toggle
              on={prefs.checkinDue}
              onChange={set("checkinDue")}
              label="Check-in reminders"
              note="A nudge when a site is due its monthly geo-tagged visit."
            />
            <Toggle
              on={prefs.advisories}
              onChange={set("advisories")}
              label="Scientific advisories"
              note="Guidance published by the panel for sites you're attached to."
            />
            <Toggle
              on={prefs.ledger}
              onChange={set("ledger")}
              label="Fund ledger movements"
              note="Every inflow or outflow recorded against your sites. Noisy by design."
            />
            <Toggle
              on={prefs.digest}
              onChange={set("digest")}
              label="Monthly impact digest"
              note="One summary a month: trees, survival and CO₂ across your spaces."
            />
          </div>
        </Reveal>
      </section>

      {/* ======================================================== the demo */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Prototype"
            title="Reset the demo data"
            note="This build keeps everything in memory — no backend, nothing written to disk"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="relative overflow-hidden rounded-2xl bg-[#1B4332] p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#52B788]/12 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="font-onest text-[22px] font-semibold tracking-[-0.8px] text-white">
                  Back to the seed state
                </h3>
                <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-white/55">
                  Registering sites, approving plans, placing orders and logging check-ins all
                  change the shared data for every role. Reloading the page restores the seed
                  automatically — this button does it without a reload.
                </p>

                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-white/45">
                  <span>
                    <span className="font-semibold text-white">{state.sites.length}</span> sites
                  </span>
                  <span>
                    <span className="font-semibold text-white">{state.requests.length}</span>{" "}
                    requests
                  </span>
                  <span>
                    <span className="font-semibold text-white">{state.checkins.length}</span>{" "}
                    check-ins
                  </span>
                  <span>
                    <span className="font-semibold text-white">{state.ledger.length}</span>{" "}
                    ledger entries
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <Image src="/mascot/sprout-thinking.png" alt="" width={96} height={96} />
                <Button
                  onClick={doReset}
                  className="h-11 rounded-full bg-white px-6 text-[15px] text-[#12362A] hover:bg-[#D8F3DC]"
                >
                  <RotateCcw className="mr-1.5 size-4" />
                  {wasReset ? "Reset done" : "Reset data"}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
