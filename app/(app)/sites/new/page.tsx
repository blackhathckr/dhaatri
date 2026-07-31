"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckIcon, Crosshair, HandHeart, Wallet } from "lucide-react";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Reveal, PageHero } from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatArea } from "@/lib/format";
import type { EngagementModel } from "@/data/types";

const SOIL_TYPES = ["Loamy", "Clay", "Sandy Loam", "Red Soil", "Black Soil", "Laterite", "Alluvial"];
const SUNLIGHT = ["Full", "Partial", "Shade"];
const WATER = ["Borewell", "Municipal", "Rain-fed", "Lake", "River", "Canal", "None"];

const STEPS = [
  { title: "The space", note: "Name and size" },
  { title: "Conditions", note: "Soil, sun, water" },
  { title: "Location", note: "Where it sits" },
  { title: "Engagement", note: "How it's funded" },
];

/* ------------------------------------------------------------------ field */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
    </div>
  );
}

const inputClass =
  "h-11 rounded-xl border-line bg-surface focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20";

/* ------------------------------------------------------------------- page */

export default function NewSitePage() {
  const { createSite, state } = useStore();
  const { currentUser } = useAuthContext();

  const [step, setStep] = React.useState(1);
  const [done, setDone] = React.useState(false);

  const [name, setName] = React.useState("");
  const [area, setArea] = React.useState("");
  const [soilType, setSoilType] = React.useState("");
  const [sunlight, setSunlight] = React.useState("");
  const [waterAccess, setWaterAccess] = React.useState("");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [model, setModel] = React.useState<EngagementModel>("paid");

  // Each step gates the next — you cannot review a space you haven't described.
  const complete: Record<number, boolean> = {
    1: name.trim().length > 1 && Number(area) > 0,
    2: Boolean(soilType && sunlight && waterAccess),
    3: Number(latitude) !== 0 && Number(longitude) !== 0,
    4: true,
  };

  const submit = () => {
    createSite({
      site: {
        name: name.trim(),
        ownerId: currentUser.id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        area: Number(area),
        soilType,
        sunlight,
        waterAccess,
      },
      model,
      requesterId: currentUser.id,
    });
    setDone(true);
  };

  /* ------------------------------------------------------------ success */

  if (done) {
    // The reducer prepends, so the site just created is at the head.
    const created = state.sites[0];
    return (
      <div className="space-y-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-[#12362A] p-8 lg:p-12">
            <Image
              src="/scenes/canopy-banner.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="flex size-11 items-center justify-center rounded-full bg-[#52B788]">
                  <Check className="size-5 text-white" />
                </span>
                <h1 className="mt-5 font-onest text-[28px] font-semibold tracking-[-1px] text-white lg:text-[34px]">
                  {created?.name} is registered
                </h1>
                <p className="mt-2 max-w-[440px] text-[15px] leading-6 text-white/55">
                  A request has been raised, Dhaatri operations has been notified, and a
                  volunteer now has an assessment task for this plot.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <Link href={`/sites/${created?.id}`}>
                    <Button className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]">
                      Open the site
                      <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                  </Link>
                  <Link href="/requests">
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border-white/25 bg-white/5 px-5 text-white hover:bg-white/15 hover:text-white"
                    >
                      Track the request
                    </Button>
                  </Link>
                </div>
              </div>

              <Image
                src="/mascot/sprout-celebrating.png"
                alt=""
                width={150}
                height={150}
                className="relative drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52B788]">
              What just happened
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { t: "Request raised", b: "Queued for triage by Dhaatri operations." },
                { t: "Volunteer tasked", b: "An assessment visit is on their list, due in 5 days." },
                { t: "You'll be notified", b: "When the plan is ready for your approval." },
              ].map((s, i) => (
                <div key={s.t} className="rounded-xl bg-surface-3 p-4">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#1B4332] text-[12px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-[14px] font-semibold text-ink-strong">{s.t}</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-soft">{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  /* --------------------------------------------------------------- form */

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="New registration"
        title="Tell us about the space"
        scene="plot"
        mascot="sprout-pointing"
        actions={
          <Link href="/sites">
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/25 bg-white/5 px-5 text-white hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="mr-1.5 size-4" />
              All sites
            </Button>
          </Link>
        }
      />

      <Reveal delay={0.08}>
        <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
          <Stepper
            value={step}
            onValueChange={setStep}
            indicators={{ completed: <CheckIcon className="size-3.5" /> }}
            className="space-y-8"
          >
            <StepperNav className="gap-3">
              {STEPS.map((s, i) => (
                <StepperItem
                  key={s.title}
                  step={i + 1}
                  completed={i + 1 < step && complete[i + 1]}
                  className="relative flex-1 items-start"
                >
                  <StepperTrigger className="flex grow flex-col items-start justify-center gap-3">
                    <StepperIndicator>{i + 1}</StepperIndicator>
                    <div className="text-start">
                      <StepperTitle className="font-onest text-[15px] font-semibold tracking-[-0.3px] group-data-[state=inactive]/step:text-ink-ghost">
                        {s.title}
                      </StepperTitle>
                      <p className="mt-0.5 text-[12px] text-ink-faint max-sm:hidden">{s.note}</p>
                    </div>
                  </StepperTrigger>
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel>
              {/* ------------------------------------------------ step 1 */}
              <StepperContent value={1}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-5">
                    <Field label="What do people call this place?" hint="A name a volunteer could find it by.">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Whitefield Community Garden"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Roughly how big is it?" hint="Square metres. An estimate is fine — the volunteer will measure it.">
                      <Input
                        type="number"
                        min={1}
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. 500"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  {/* the plot drawn against a 2,000 sqm frame as you type */}
                  <div className="flex flex-col rounded-xl bg-surface-3 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
                      Footprint
                    </p>
                    <div className="relative mt-4 aspect-square w-full rounded-lg border border-dashed border-[#D5DECF]">
                      <motion.div
                        animate={{
                          width: `${Math.min(100, Math.sqrt(Math.max(0, Number(area)) / 2000) * 100)}%`,
                          height: `${Math.min(100, Math.sqrt(Math.max(0, Number(area)) / 2000) * 100)}%`,
                        }}
                        transition={{ type: "spring", stiffness: 180, damping: 26 }}
                        className="absolute bottom-0 left-0 rounded-md bg-[#7A9E3F]/30 ring-1 ring-[#7A9E3F]/55"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-medium text-[#B8C2B0]">
                        2,000 sqm
                      </span>
                    </div>
                    <p className="mt-4 font-onest text-[20px] font-semibold leading-none tracking-[-0.8px] text-ink-strong">
                      {Number(area) > 0 ? formatArea(Number(area)) : "—"}
                    </p>
                  </div>
                </div>
              </StepperContent>

              {/* ------------------------------------------------ step 2 */}
              <StepperContent value={2}>
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Soil">
                      <Select value={soilType} onValueChange={(v) => setSoilType(v ?? "")}>
                        <SelectTrigger className="h-11 w-full rounded-xl border-line">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOIL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Sunlight">
                      <Select value={sunlight} onValueChange={(v) => setSunlight(v ?? "")}>
                        <SelectTrigger className="h-11 w-full rounded-xl border-line">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUNLIGHT.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Water access">
                      <Select value={waterAccess} onValueChange={(v) => setWaterAccess(v ?? "")}>
                        <SelectTrigger className="h-11 w-full rounded-xl border-line">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {WATER.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field
                    label="Anything a volunteer should know?"
                    hint="Access roads, gates, debris, overhead cables, nearby landmarks."
                  >
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Narrow access from the east; a small pile of construction debris in one corner…"
                      className="rounded-xl border-line bg-surface focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                    />
                  </Field>
                </div>
              </StepperContent>

              {/* ------------------------------------------------ step 3 */}
              <StepperContent value={3}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Latitude">
                        <Input
                          type="number"
                          step="0.0001"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="12.9698"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Longitude">
                        <Input
                          type="number"
                          step="0.0001"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="77.7500"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    {/* the browser already knows where you are — no map library needed */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigator.geolocation?.getCurrentPosition((pos) => {
                          setLatitude(pos.coords.latitude.toFixed(4));
                          setLongitude(pos.coords.longitude.toFixed(4));
                        })
                      }
                      className="h-10 rounded-full border-line px-5 text-ink-brand hover:bg-[#D8F3DC]/40"
                    >
                      <Crosshair className="mr-1.5 size-4" />
                      Use my current location
                    </Button>

                    <p className="text-[13px] leading-5 text-ink-faint">
                      Coordinates are what make every later check-in geo-tagged. Get them
                      roughly right and the volunteer will confirm them on site.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center rounded-xl bg-surface-3 p-5">
                    <div className="relative aspect-square w-full">
                      <svg viewBox="0 0 100 100" className="size-full">
                        <defs>
                          <pattern id="newSiteGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M10 0 L0 0 0 10" fill="none" stroke="#E2E9DE" strokeWidth="0.4" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#newSiteGrid)" />
                        {complete[3] && (
                          <>
                            <circle cx="50" cy="50" r="14" fill="#52B788" opacity="0.18" />
                            <circle cx="50" cy="50" r="5" fill="#2D6A4F" stroke="#fff" strokeWidth="1.2" />
                          </>
                        )}
                      </svg>
                    </div>
                    <p className="mt-4 text-center font-mono text-[12px] text-ink-soft">
                      {complete[3]
                        ? `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`
                        : "awaiting coordinates"}
                    </p>
                  </div>
                </div>
              </StepperContent>

              {/* ------------------------------------------------ step 4 */}
              <StepperContent value={4}>
                <div className="space-y-6">
                  {/* proposal §4.1 — the two engagement models */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        id: "paid" as const,
                        icon: Wallet,
                        title: "Adopt the saplings",
                        body: "You fund the plan. Dhaatri sources, plants and monitors, and the cost enters the public fund ledger against this site.",
                      },
                      {
                        id: "stewardship" as const,
                        icon: HandHeart,
                        title: "Commit to stewardship",
                        body: "Dhaatri funds the planting; you commit to watering and care. Verified through geo-tagged check-ins.",
                      },
                    ].map((opt) => {
                      const on = model === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setModel(opt.id)}
                          className={
                            "rounded-2xl border p-5 text-left transition-all " +
                            (on
                              ? "border-[#52B788] bg-[#F3F9F5] shadow-[0_14px_34px_-24px_rgba(4,39,24,0.45)]"
                              : "border-line bg-surface hover:border-[#C9D6CC]")
                          }
                        >
                          <div className="flex items-center justify-between">
                            <opt.icon className={on ? "size-5 text-ink-brand" : "size-5 text-ink-faint"} />
                            <span
                              className={
                                "flex size-5 items-center justify-center rounded-full border transition-colors " +
                                (on ? "border-[#2D6A4F] bg-[#2D6A4F]" : "border-line")
                              }
                            >
                              {on && <Check className="size-3 text-white" />}
                            </span>
                          </div>
                          <p className="mt-4 font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                            {opt.title}
                          </p>
                          <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{opt.body}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* review */}
                  <div className="overflow-hidden rounded-xl border border-line">
                    {[
                      { k: "Space", v: name || "—" },
                      { k: "Area", v: Number(area) > 0 ? formatArea(Number(area)) : "—" },
                      { k: "Conditions", v: [soilType, sunlight && `${sunlight} sun`, waterAccess].filter(Boolean).join(" · ") || "—" },
                      { k: "Coordinates", v: complete[3] ? `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}` : "—" },
                      { k: "Engagement", v: model === "paid" ? "Paid adoption" : "Stewardship commitment" },
                    ].map((r) => (
                      <div
                        key={r.k}
                        className="flex items-center justify-between gap-4 border-b border-line-soft bg-white px-5 py-3.5 last:border-b-0"
                      >
                        <span className="text-[13px] font-medium text-ink-faint">{r.k}</span>
                        <span className="truncate text-[14px] font-semibold text-ink-strong">
                          {r.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </StepperContent>
            </StepperPanel>

            {/* -------------------------------------------------- footer */}
            <div className="flex items-center justify-between border-t border-line pt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className="h-10 rounded-full px-5 text-ink-soft hover:bg-surface-3 disabled:opacity-40"
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Back
              </Button>

              {step < STEPS.length ? (
                <Button
                  type="button"
                  disabled={!complete[step]}
                  onClick={() => setStep(step + 1)}
                  className="h-10 rounded-full bg-[#1B4332] px-6 hover:bg-[#2D6A4F] disabled:opacity-40"
                >
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  className="h-10 rounded-full bg-[#2D6A4F] px-6 hover:bg-[#1B4332]"
                >
                  Register this space
                  <Check className="ml-1.5 size-4" />
                </Button>
              )}
            </div>
          </Stepper>
        </div>
      </Reveal>
    </div>
  );
}
