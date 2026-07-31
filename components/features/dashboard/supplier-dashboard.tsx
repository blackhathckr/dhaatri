"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  InvertedPanel,
  InvertedFigure,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  VizBars,
  VizPips,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatCurrency, formatDateRelative } from "@/lib/format";

export function SupplierDashboard() {
  const { state, advanceOrder } = useStore();
  const { currentUser } = useAuthContext();

  const stock = state.inventory.filter((i) => i.supplierId === currentUser.id);
  const orders = state.orders.filter((o) => o.supplierId === currentUser.id);
  const open = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  const ceiling = Math.max(...stock.map((i) => i.stock), 1);
  const lowLines = stock.filter((i) => i.stock < ceiling * 0.25);

  const revenue = orders.reduce((a, o) => a + o.total, 0);
  const units = stock.reduce((a, i) => a + i.stock, 0);
  const committed = open.flatMap((o) => o.items).reduce((a, i) => a + i.quantity, 0);

  const siteFor = (planId: string) => {
    const plan = state.plans.find((p) => p.id === planId);
    return state.sites.find((s) => s.id === plan?.siteId);
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Nursery"
        title={open.length ? `${open.length} ${open.length === 1 ? "order" : "orders"} to fulfil` : "Nothing outstanding"}
        scene="plot"
        mascot={open.length ? "sprout-holding-phone" : "sprout-celebrating"}
        figures={[
          { value: units, unit: "saplings", note: `across ${stock.length} species lines` },
          { value: committed, unit: "committed", note: "promised to open orders" },
          { value: revenue, unit: "₹ earned", note: `${orders.length} orders all-time` },
        ]}
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Species lines",
              value: stock.length,
              note: `${stock.length - lowLines.length} healthy`,
              viz: <VizBars values={stock.map((i) => i.stock)} />,
            },
            {
              label: "Open orders",
              value: open.length,
              note: `${orders.length - open.length} delivered`,
              viz: <VizPips states={orders.map((o) => o.status === "delivered")} color="#B7791F" />,
            },
            {
              label: "Needs restock",
              value: lowLines.length,
              note: lowLines.length ? lowLines.map((l) => l.speciesName).join(", ") : "nothing low",
              viz: (
                <VizBars
                  values={stock.map((i) => (i.stock < ceiling * 0.25 ? 10 : 2))}
                  color="#B4553F"
                />
              ),
            },
            {
              label: "Fastest line",
              value: `${Math.min(...stock.map((i) => i.deliveryDays), 99)} days`,
              note: "quoted lead time",
              viz: <VizBars values={stock.map((i) => 10 - i.deliveryDays)} color="#3B7EA1" />,
            },
          ]}
        />
      </Reveal>

      {/* ---------------------------------------------------- fulfilment */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Fulfilment"
            title="Orders on your book"
            note="Advancing one here updates the site and the citizen waiting on it"
            right={
              <Link href="/supply/orders">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  All orders
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <div className="space-y-3.5">
          {orders.length === 0 && (
            <Awaiting
              pose="sprout-sleeping"
              title="No orders yet"
              body="Orders arrive when Dhaatri commits stock from your nursery against an approved plan."
            />
          )}

          {orders.slice(0, 5).map((o, i) => {
            const site = siteFor(o.planId);
            const qty = o.items.reduce((a, it) => a + it.quantity, 0);
            return (
              <Reveal key={o.id} delay={0.04 * i}>
                <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)] lg:flex-row lg:items-center">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FAEDCD]">
                    <Truck className="size-[18px] text-[#B7791F]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                        {site?.name ?? o.planId}
                      </p>
                      <Pill tone={toneFor(o.status)}>{o.status}</Pill>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-faint">
                      {o.id} · {qty} saplings · ordered {formatDateRelative(o.orderedAt)}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-ink-soft">
                      {o.items.map((it) => `${it.name} ${it.quantity}`).join(" · ")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <p className="w-24 font-onest text-[20px] font-semibold tracking-[-0.7px] text-ink-strong">
                      {formatCurrency(o.total)}
                    </p>
                    {o.status !== "delivered" && o.status !== "cancelled" && (
                      <Button
                        onClick={() => advanceOrder({ orderId: o.id })}
                        className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                      >
                        {o.status === "processing" ? "Dispatch" : "Confirm delivery"}
                      </Button>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------------- stock */}
      <section>
        <Reveal>
          <SectionHead
            eyebrow="Shelves"
            title="What you're holding"
            right={
              <Link href="/supply/inventory">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-ink-brand hover:bg-[#D8F3DC]/50 hover:text-ink-strong"
                >
                  Full inventory
                  <ArrowUpRight className="ml-1 size-4" />
                </Button>
              </Link>
            }
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {stock.map((item, i) => {
                const low = item.stock < ceiling * 0.25;
                return (
                  <div
                    key={item.speciesId}
                    className="flex items-center gap-4 border-b border-line-soft px-5 py-4 last:border-b-0"
                  >
                    <p className="w-28 shrink-0 truncate text-[15px] font-medium text-ink-strong">
                      {item.speciesName}
                    </p>
                    <span className="block h-2 flex-1 overflow-hidden rounded-full bg-track">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.stock / ceiling) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.04 * i }}
                        style={{ background: low ? "#B7791F" : "#52B788" }}
                        className="block h-full rounded-full"
                      />
                    </span>
                    <p className="w-16 shrink-0 text-right font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
                      {item.stock}
                    </p>
                    <p className="w-16 shrink-0 text-right text-[13px] text-ink-faint">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <InvertedPanel className="h-full">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#95D5B2]">
                Your position
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <InvertedFigure label="Stock value" value={formatCurrency(stock.reduce((a, i) => a + i.stock * i.unitPrice, 0))} note="at unit price" />
                <InvertedFigure label="Delivered" value={orders.filter((o) => o.status === "delivered").length} note="orders completed" />
                <InvertedFigure label="Revenue" value={formatCurrency(revenue)} note="all-time" />
                <InvertedFigure label="Restock" value={lowLines.length} note="lines running low" />
              </div>
            </InvertedPanel>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
