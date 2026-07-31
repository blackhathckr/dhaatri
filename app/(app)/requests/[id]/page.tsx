"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  HandHeart,
  Sparkles,
  Wallet,
} from "lucide-react";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Button } from "@/components/ui/button";
import {
  Awaiting,
  DataRows,
  InvertedPanel,
  InvertedFigure,
  Pill,
  Reveal,
  SectionHead,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore, useSiteBundle, computeCo2, CARBON_METHOD_VERSION } from "@/store";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { formatArea, formatCurrency, formatDate } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { RequestStatus } from "@/data/types";

/** Proposal §5 — thirteen states, grouped into the four phases people talk in. */
const FLOW: { status: RequestStatus; phase: string; who: string }[] = [
  { status: "pending", phase: "Intake", who: "Citizen" },
  { status: "assigned", phase: "Intake", who: "Dhaatri ops" },
  { status: "assessment_scheduled", phase: "Intake", who: "Volunteer" },
  { status: "assessment_complete", phase: "Intake", who: "Volunteer" },
  { status: "plan_ready", phase: "Planning", who: "Dhaatri ops" },
  { status: "plan_review", phase: "Planning", who: "Citizen" },
  { status: "approved", phase: "Planning", who: "Citizen" },
  { status: "order_placed", phase: "Fulfilment", who: "Dhaatri ops" },
  { status: "delivered", phase: "Fulfilment", who: "Supplier" },
  { status: "planting_scheduled", phase: "Fulfilment", who: "Dhaatri ops" },
  { status: "planted", phase: "Growing", who: "Volunteer" },
  { status: "monitoring", phase: "Growing", who: "Volunteer" },
  { status: "completed", phase: "Growing", who: "Dhaatri ops" },
];

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;

  const store = useStore();
  const { state } = store;
  const { currentUser } = useAuthContext();

  const request = state.requests.find((r) => r.id === requestId);
  const bundle = useSiteBundle(request?.siteId);

  if (!request || !bundle.site) {
    return (
      <div className="flex flex-col items-center py-24">
        <Image src="/mascot/sprout-sad.png" alt="" width={140} height={140} />
        <p className="mt-4 font-onest text-xl font-semibold tracking-[-0.5px] text-ink-strong">
          That request isn&apos;t here
        </p>
        <Link href="/requests" className="mt-6">
          <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to requests
          </Button>
        </Link>
      </div>
    );
  }

  const { site, assessment, plan, order, checkins, trees, latest } = bundle;
  const at = FLOW.findIndex((f) => f.status === request.status);
  const requester = getUserById(request.requesterId);

  /* ------------------------------------------------------------- actions */

  /**
   * The one thing that can happen next, and who does it. Every button below
   * writes to the shared store, so advancing here really does move the site,
   * the ledger, the volunteer's task list and everybody's notifications.
   */
  const advance = (): { label: string; who: string; note: string; run: () => void } | null => {
    if (!assessment) {
      return {
        label: "Record the assessment",
        who: "Volunteer",
        note: "Files soil, sunlight and water findings, and moves the site to Assessed.",
        run: () =>
          store.submitAssessment({
            taskId: state.tasks.find((t) => t.siteId === site.id && t.status !== "completed")?.id,
            assessment: {
              siteId: site.id,
              volunteerId:
                state.users.find((u) => u.role === "volunteer")?.id ?? currentUser.id,
              date: new Date().toISOString().slice(0, 10),
              soilPh: 6.8,
              soilType: site.soilType,
              areaConfirmed: site.area,
              sunlightHours: site.sunlight === "Full" ? "6-8 hours" : "4-6 hours",
              waterSource: site.waterAccess,
              obstacles: "None significant",
              photos: 4,
            },
          }),
      };
    }

    if (!plan) {
      return {
        label: "Draw up the plantation plan",
        who: "Dhaatri ops",
        note: "Picks a species mix from the assessment and sends it to the citizen for approval.",
        run: () => {
          // ~1 sapling per 12 sqm, spread across three suited species.
          const total = Math.max(6, Math.floor(assessment.areaConfirmed / 12));
          const picks = state.species.slice(0, 3);
          const species = picks.map((sp, i) => ({
            speciesId: sp.id,
            name: sp.commonName,
            quantity: i === 0 ? total - 2 * Math.floor(total / 3) : Math.floor(total / 3),
          }));
          const cost = Math.round(
            species.reduce(
              (sum, s) =>
                sum + (state.species.find((x) => x.id === s.speciesId)?.saplingCost ?? 50) * s.quantity,
              0
            ) * 1.35
          );
          store.createPlan({
            plan: {
              siteId: site.id,
              createdById: state.users.find((u) => u.role === "dhaatri_ops")?.id ?? currentUser.id,
              species,
              method: assessment.areaConfirmed >= 1000 ? "Miyawaki" : "Mixed",
              layout: "Grid, 2m spacing",
              estimatedCo2PerYear:
                Math.round((computeCo2(species, state.species) / 1000) * 100) / 100,
              cost,
            },
          });
        },
      };
    }

    if (plan.status !== "approved") {
      return {
        label: request.model === "paid" ? "Approve and pay" : "Approve the plan",
        who: "Citizen",
        note:
          request.model === "paid"
            ? `Records ${formatCurrency(plan.cost)} into the public fund ledger against this site.`
            : "Confirms the stewardship commitment; Dhaatri funds the planting.",
        run: () =>
          store.approvePlan({
            planId: plan.id,
            model: request.model,
            payerId: request.requesterId,
          }),
      };
    }

    if (!order) {
      const supplierId = state.inventory[0]?.supplierId ?? "usr-005";
      return {
        label: "Place the supply order",
        who: "Dhaatri ops",
        note: `Commits stock at ${getUserById(supplierId)?.name ?? "the supplier"} and records the outflow.`,
        run: () => store.placeOrder({ planId: plan.id, supplierId }),
      };
    }

    if (order.status === "processing") {
      return {
        label: "Dispatch the saplings",
        who: "Supplier",
        note: "Marks the order as on its way to the site.",
        run: () => store.advanceOrder({ orderId: order.id }),
      };
    }

    if (order.status === "dispatched") {
      return {
        label: "Confirm delivery",
        who: "Supplier",
        note: "Saplings received at site; planting can be scheduled.",
        run: () => store.advanceOrder({ orderId: order.id }),
      };
    }

    if (site.status !== "active" && site.status !== "completed") {
      return {
        label: "Mark as planted",
        who: "Volunteer",
        note: "Puts the site into active monitoring and tells the citizen their trees are in.",
        run: () => store.markPlanted({ siteId: site.id }),
      };
    }

    if (request.status !== "completed") {
      return {
        label: "Log a monitoring check-in",
        who: "Volunteer",
        note: "A geo-tagged visit counting how many trees are still alive. This is what the CO₂ figure rests on.",
        run: () =>
          store.submitCheckin({
            checkin: {
              siteId: site.id,
              userId: currentUser.id,
              date: new Date().toISOString().slice(0, 10),
              survivalCount: Math.max(1, Math.round(trees * 0.94)),
              totalTrees: trees || 1,
              photos: 3,
              geoTagged: true,
              notes: "Routine visit — canopy filling in, no visible stress.",
            },
          }),
      };
    }

    return null;
  };

  const next = advance();
  const survival = latest?.survivalPercent ?? null;
  const co2 = plan ? computeCo2(plan.species, state.species, survival ?? 100) : 0;

  return (
    <div className="space-y-8">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src={site.status === "active" ? "/scenes/canopy-banner.png" : "/scenes/empty-plot.png"}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

          <div className="relative p-6 lg:p-9">
            <Link
              href="/requests"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              All requests
            </Link>

            <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-[#52B788]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#95D5B2]">
                    {REQUEST_STATUS_LABELS[request.status]}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-white/45">
                    {request.model === "paid" ? (
                      <Wallet className="size-3.5" />
                    ) : (
                      <HandHeart className="size-3.5" />
                    )}
                    {request.model === "paid" ? "Paid adoption" : "Stewardship"}
                  </span>
                </div>

                <h1 className="mt-3 font-onest text-[26px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[36px]">
                  {site.name}
                </h1>

                <p className="mt-2 text-[13px] text-white/50">
                  {request.id} · raised by {requester?.name ?? "—"} on{" "}
                  {formatDate(request.createdAt)} · {formatArea(site.area)}
                </p>

                <div className="mt-7 flex flex-wrap items-end gap-x-9 gap-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-white">
                        {at + 1}
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">of 13</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      {FLOW[at]?.phase.toLowerCase()} phase
                    </p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[30px] font-semibold leading-none tracking-[-1px] text-white">
                        {trees || "—"}
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">trees</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      {plan ? "in the plan" : "not planned yet"}
                    </p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[30px] font-semibold leading-none tracking-[-1px] text-white">
                        {plan ? formatCurrency(plan.cost) : "—"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      {order ? `order ${order.status}` : "plan value"}
                    </p>
                  </div>
                </div>
              </div>

              <Image
                src={
                  request.status === "completed"
                    ? "/mascot/sprout-celebrating.png"
                    : site.status === "active"
                      ? "/mascot/sprout-watering.png"
                      : "/mascot/sprout-holding-phone.png"
                }
                alt=""
                width={132}
                height={132}
                className="shrink-0 self-end drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ======================================================= next step */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Move it forward"
            title={next ? "One thing happens next" : "Nothing left to do"}
            note={
              next
                ? "This writes to the shared prototype data — the site, ledger, tasks and notifications all move with it"
                : "This request has run the full lifecycle"
            }
          />
        </Reveal>

        <Reveal delay={0.05}>
          {next ? (
            <InvertedPanel>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#95D5B2]">
                    <Sparkles className="size-3" />
                    {next.who} does this
                  </span>
                  <h3 className="mt-4 font-onest text-[24px] font-semibold tracking-[-0.9px] text-white">
                    {next.label}
                  </h3>
                  <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-white/55">
                    {next.note}
                  </p>
                </div>

                <Button
                  onClick={next.run}
                  className="h-11 shrink-0 rounded-full bg-white px-6 text-[15px] text-[#12362A] hover:bg-[#D8F3DC]"
                >
                  {next.label}
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </div>
            </InvertedPanel>
          ) : (
            <Awaiting
              pose="sprout-celebrating"
              title="Fully through the lifecycle"
              body="Assessment, plan, approval, supply, planting and monitoring are all on record for this site."
              action={
                <Link href={`/sites/${site.id}`}>
                  <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                    Open the site
                  </Button>
                </Link>
              }
            />
          )}
        </Reveal>
      </section>

      {/* ========================================================= journey */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="The lifecycle"
            title="Thirteen stages, four phases"
            note="Each stage names the role responsible for clearing it"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
            <Stepper
              value={at + 1}
              orientation="vertical"
              indicators={{ completed: <CheckIcon className="size-3.5" /> }}
              className="w-full"
            >
              <StepperNav className="gap-0">
                {FLOW.map((f, i) => (
                  <StepperItem key={f.status} step={i + 1} className="relative items-start">
                    <StepperTrigger className="flex items-start gap-4 py-2.5">
                      <StepperIndicator>{i + 1}</StepperIndicator>
                      <div className="min-w-0 text-start">
                        <StepperTitle className="font-onest text-[15px] font-semibold tracking-[-0.3px] group-data-[state=inactive]/step:text-ink-ghost">
                          {REQUEST_STATUS_LABELS[f.status]}
                        </StepperTitle>
                        <p className="mt-0.5 text-[12px] text-ink-faint">
                          {f.who} · {f.phase}
                        </p>
                      </div>
                    </StepperTrigger>
                  </StepperItem>
                ))}
              </StepperNav>
              <StepperPanel />
            </Stepper>
          </div>
        </Reveal>
      </section>

      {/* ========================================================= records */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="On record"
            title="What exists so far"
            note="Every artefact this request has produced"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <DataRows
              rows={[
                { k: "Site", v: <Link href={`/sites/${site.id}`} className="text-ink-brand underline-offset-4 hover:underline">{site.name}</Link>, extra: formatArea(site.area) },
                { k: "Status", v: <Pill tone={toneFor(site.status)}>{site.status}</Pill> },
                { k: "Assessment", v: assessment ? "Filed" : "Not yet", extra: assessment ? formatDate(assessment.date) : "" },
                { k: "Plan", v: plan ? `${plan.method} · ${trees} trees` : "Not yet", extra: plan ? plan.status : "" },
                { k: "Order", v: order ? order.id : "Not yet", extra: order ? order.status : "" },
                { k: "Check-ins", v: checkins.length || "None", extra: latest ? `latest ${formatDate(latest.date)}` : "" },
              ]}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Impact on record
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure
                  label="CO₂ per year"
                  value={co2.toLocaleString("en-IN")}
                  note={`kg · method ${CARBON_METHOD_VERSION}`}
                />
                <InvertedFigure
                  label="Survival"
                  value={survival === null ? "—" : `${survival}%`}
                  note={latest ? `verified ${formatDate(latest.date)}` : "no check-in yet"}
                />
                <InvertedFigure
                  label="Trees"
                  value={trees || "—"}
                  note={plan ? `${plan.species.length} species` : "awaiting plan"}
                />
                <InvertedFigure
                  label="Value"
                  value={plan ? formatCurrency(plan.cost) : "—"}
                  note={request.model === "paid" ? "in the fund ledger" : "stewardship, unfunded"}
                />
              </div>

              {plan && (
                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#95D5B2]">
                    Species mix
                  </p>
                  <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    {plan.species.map((sp, i) => (
                      <motion.span
                        key={sp.speciesId}
                        initial={{ width: 0 }}
                        animate={{ width: `${(sp.quantity / trees) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.08 * i }}
                        style={{ background: ["#95D5B2", "#52B788", "#2D6A4F"][i % 3] }}
                        title={`${sp.name} — ${sp.quantity}`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-white/55">
                    {plan.species.map((s) => `${s.name} ${s.quantity}`).join(" · ")}
                  </p>
                </div>
              )}
            </InvertedPanel>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
