"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckIcon, Truck } from "lucide-react";

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
  DataRows,
  InvertedPanel,
  InvertedFigure,
  Pill,
  Reveal,
  SectionHead,
  toneFor,
} from "@/components/shared/premium";
import { useStore } from "@/store";
import { formatCurrency, formatDate } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { OrderStatus } from "@/data/types";

const STAGES: { status: OrderStatus; label: string; note: string }[] = [
  { status: "processing", label: "Processing", note: "Stock committed at the nursery" },
  { status: "dispatched", label: "Dispatched", note: "On its way to the site" },
  { status: "delivered", label: "Delivered", note: "Received; planting can be scheduled" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { state, advanceOrder } = useStore();
  const order = state.orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="flex flex-col items-center py-24">
        <Image src="/mascot/sprout-sad.png" alt="" width={140} height={140} />
        <p className="mt-4 font-onest text-xl font-semibold tracking-[-0.5px] text-ink-strong">
          That order isn&apos;t here
        </p>
        <Link href="/supply/orders" className="mt-6">
          <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to orders
          </Button>
        </Link>
      </div>
    );
  }

  const plan = state.plans.find((p) => p.id === order.planId);
  const site = state.sites.find((s) => s.id === plan?.siteId);
  const supplier = getUserById(order.supplierId);
  const at = STAGES.findIndex((s) => s.status === order.status);
  const units = order.items.reduce((a, i) => a + i.quantity, 0);
  const inventory = state.inventory.filter((i) => i.supplierId === order.supplierId);

  const next = order.status === "processing" ? "Dispatch" : order.status === "dispatched" ? "Confirm delivery" : null;

  return (
    <div className="space-y-8">
      {/* ============================================================ hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#12362A]">
          <Image
            src="/scenes/empty-plot.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12362A] via-[#12362A]/88 to-[#12362A]/45" />

          <div className="relative p-6 lg:p-9">
            <Link
              href="/supply/orders"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              All orders
            </Link>

            <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <span className="rounded-full bg-[#52B788]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#95D5B2]">
                  {order.status}
                </span>

                <h1 className="mt-3 font-onest text-[26px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[34px]">
                  {order.id}
                </h1>
                <p className="mt-2 text-[13px] text-white/50">
                  For {site?.name ?? plan?.siteId ?? "—"} · supplied by {supplier?.name ?? "—"} ·
                  ordered {formatDate(order.orderedAt)}
                </p>

                <div className="mt-7 flex flex-wrap items-end gap-x-9 gap-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[38px] font-semibold leading-none tracking-[-1.6px] text-white">
                        {units}
                      </span>
                      <span className="text-sm font-medium text-[#95D5B2]">saplings</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">
                      across {order.items.length} species
                    </p>
                  </div>

                  <div className="h-9 w-px bg-white/15 max-sm:hidden" />

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-onest text-[30px] font-semibold leading-none tracking-[-1px] text-white">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-white/50">recorded as an outflow</p>
                  </div>
                </div>

                {next && (
                  <Button
                    onClick={() => advanceOrder({ orderId: order.id })}
                    className="mt-7 h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]"
                  >
                    {next}
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                )}
              </div>

              <Image
                src={
                  order.status === "delivered"
                    ? "/mascot/sprout-celebrating.png"
                    : "/mascot/sprout-holding-phone.png"
                }
                alt=""
                width={130}
                height={130}
                className="shrink-0 self-end drop-shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ========================================================== stages */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Fulfilment"
            title="Three stages to the ground"
            note="Each stage updates the plantation request behind it"
          />
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
            <Stepper
              value={at + 1}
              indicators={{ completed: <CheckIcon className="size-3.5" /> }}
              className="w-full"
            >
              <StepperNav className="gap-3">
                {STAGES.map((s, i) => (
                  <StepperItem key={s.status} step={i + 1} className="relative flex-1 items-start">
                    <StepperTrigger className="flex grow flex-col items-start justify-center gap-3">
                      <StepperIndicator>{i + 1}</StepperIndicator>
                      <div className="text-start">
                        <StepperTitle className="font-onest text-[15px] font-semibold tracking-[-0.3px] group-data-[state=inactive]/step:text-ink-ghost">
                          {s.label}
                        </StepperTitle>
                        <p className="mt-0.5 text-[12px] text-ink-faint">{s.note}</p>
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

      {/* =========================================================== lines */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Order lines"
            title="What was committed"
            note="Stock was decremented at the nursery the moment this order was raised"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {order.items.map((it) => {
                const line = inventory.find((x) => x.speciesId === it.speciesId);
                const ref = state.species.find((s) => s.id === it.speciesId);
                return (
                  <div
                    key={it.speciesId}
                    className="flex items-center gap-4 border-b border-line-soft px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-ink-strong">{it.name}</p>
                      <p className="truncate text-[12px] italic text-ink-ghost">
                        {ref?.scientificName ?? "—"}
                      </p>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                        {it.quantity}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-faint">units</p>
                    </div>
                    <div className="w-24 text-right max-sm:hidden">
                      <p className="font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-brand">
                        {formatCurrency((line?.unitPrice ?? ref?.saplingCost ?? 50) * it.quantity)}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-faint">line value</p>
                    </div>
                    <div className="w-20 text-right max-lg:hidden">
                      <p className="text-[13px] text-ink-soft">{line?.stock ?? "—"}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">left</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Order summary
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure label="Units" value={units} note="saplings committed" />
                <InvertedFigure
                  label="Value"
                  value={formatCurrency(order.total)}
                  note="paid to supplier"
                />
                <InvertedFigure
                  label="Ordered"
                  value={formatDate(order.orderedAt)}
                  note="stock decremented"
                />
                <InvertedFigure
                  label="Delivered"
                  value={order.deliveredAt ? formatDate(order.deliveredAt) : "—"}
                  note={order.deliveredAt ? "confirmed on site" : "not yet received"}
                />
              </div>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>

      {/* ========================================================= context */}
      <section>
        <Reveal>
          <SectionHead eyebrow="Behind the order" title="Plan, site and supplier" />
        </Reveal>

        <Reveal delay={0.05}>
          <DataRows
            rows={[
              {
                k: "Site",
                v: site ? (
                  <Link
                    href={`/sites/${site.id}`}
                    className="text-ink-brand underline-offset-4 hover:underline"
                  >
                    {site.name}
                  </Link>
                ) : (
                  "—"
                ),
                extra: site ? `${site.area} sqm` : "",
              },
              { k: "Plan", v: plan ? `${plan.method} · ${plan.layout}` : "—", extra: plan?.status },
              { k: "Supplier", v: supplier?.name ?? "—", extra: supplier?.location },
              { k: "Status", v: <Pill tone={toneFor(order.status)}>{order.status}</Pill> },
              {
                k: "Fund entry",
                v: <span className="flex items-center gap-1.5"><Truck className="size-3.5 text-[#B7791F]" />Supplier payment</span>,
                extra: formatCurrency(order.total),
              },
            ]}
          />
        </Reveal>
      </section>
    </div>
  );
}
