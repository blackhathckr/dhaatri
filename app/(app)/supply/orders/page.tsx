"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  Toolbar,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatCurrency, formatDate, formatDateRelative } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { OrderStatus } from "@/data/types";

/** An order moves through these three states before it's done. */
const STAGES: OrderStatus[] = ["processing", "dispatched", "delivered"];

type Filter = "All" | "Processing" | "Dispatched" | "Delivered";

export default function OrdersPage() {
  const { state, advanceOrder } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");

  // A supplier sees their own book; ops sees every order placed.
  const scoped =
    currentUser.role === "supplier"
      ? state.orders.filter((o) => o.supplierId === currentUser.id)
      : state.orders;

  const siteFor = (planId: string) => {
    const plan = state.plans.find((p) => p.id === planId);
    return state.sites.find((s) => s.id === plan?.siteId);
  };

  const q = query.trim().toLowerCase();
  const visible = scoped.filter((o) => {
    if (filter !== "All" && o.status !== filter.toLowerCase()) return false;
    if (!q) return true;
    return `${o.id} ${siteFor(o.planId)?.name ?? ""}`.toLowerCase().includes(q);
  });

  const open = scoped.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const value = scoped.reduce((a, o) => a + o.total, 0);
  const saplings = scoped.reduce(
    (a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={currentUser.role === "supplier" ? "Your order book" : "Supply pipeline"}
        title={open.length ? `${open.length} ${open.length === 1 ? "order" : "orders"} in motion` : "Nothing outstanding"}
        scene="forest"
        mascot={open.length ? "sprout-holding-phone" : "sprout-sleeping"}
        figures={[
          { value: scoped.length, unit: "orders", note: `${open.length} still moving` },
          { value: saplings, unit: "saplings", note: "across all orders" },
          { value: value, unit: "₹", note: "total order value" },
        ]}
      />

      <Reveal delay={0.08}>
        <Toolbar>
          <FilterPills
            layoutId="orderFilterPill"
            value={filter}
            onChange={setFilter}
            options={(["All", "Processing", "Dispatched", "Delivered"] as Filter[]).map((f) => ({
              label: f,
              count:
                f === "All"
                  ? scoped.length
                  : scoped.filter((o) => o.status === f.toLowerCase()).length,
            }))}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order or site…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.12}>
          <SectionHead
            eyebrow="Fulfilment"
            title={`${visible.length} ${visible.length === 1 ? "order" : "orders"}`}
            note="Advancing an order here really moves it — the request and the site move with it"
          />
        </Reveal>

        <div className="space-y-3.5">
          {visible.length === 0 && (
            <Awaiting
              pose="sprout-sleeping"
              title="No orders here"
              body="Orders appear once Dhaatri approves a plantation plan and commits stock against it."
            />
          )}

          {visible.map((o, i) => {
            const site = siteFor(o.planId);
            const at = STAGES.indexOf(o.status);
            const units = o.items.reduce((s, it) => s + it.quantity, 0);

            return (
              <Reveal key={o.id} delay={0.04 * i}>
                <div className="rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FAEDCD]">
                      <Truck className="size-[18px] text-[#B7791F]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="truncate font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                          {site?.name ?? o.planId}
                        </h3>
                        <Pill tone={toneFor(o.status)}>{o.status}</Pill>
                      </div>

                      <p className="mt-1.5 truncate text-[13px] text-ink-faint">
                        {o.id} · {units} saplings across {o.items.length} species · ordered{" "}
                        {formatDateRelative(o.orderedAt)}
                        {currentUser.role !== "supplier" &&
                          ` · ${getUserById(o.supplierId)?.name ?? o.supplierId}`}
                      </p>

                      {/* the three fulfilment stages */}
                      <div className="mt-4 max-w-[300px]">
                        <div className="flex items-center gap-1.5">
                          {STAGES.map((s, idx) => (
                            <span
                              key={s}
                              title={s}
                              className={
                                "h-1.5 flex-1 rounded-full transition-colors " +
                                (idx < at ? "bg-[#95D5B2]" : idx === at ? "bg-[#2D6A4F]" : "bg-track")
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-[12px] text-ink-faint">
                          {o.deliveredAt
                            ? `Delivered ${formatDate(o.deliveredAt)}`
                            : `Stage ${at + 1} of 3`}
                        </p>
                      </div>

                      <p className="mt-3 truncate text-[13px] text-ink-soft">
                        {o.items.map((it) => `${it.name} ${it.quantity}`).join(" · ")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-start gap-6">
                      <div className="w-24">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Value
                        </p>
                        <p className="mt-1.5 font-onest text-[20px] font-semibold leading-none tracking-[-0.7px] text-ink-strong">
                          {formatCurrency(o.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {o.status !== "delivered" && o.status !== "cancelled" && (
                          <Button
                            onClick={() => advanceOrder({ orderId: o.id })}
                            className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]"
                          >
                            {o.status === "processing" ? "Dispatch" : "Confirm delivery"}
                          </Button>
                        )}
                        <Link href={`/supply/orders/${o.id}`}>
                          <Button
                            variant="outline"
                            className="size-10 rounded-full border-line p-0 text-ink-brand hover:bg-[#D8F3DC]/40"
                          >
                            <ArrowUpRight className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
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
