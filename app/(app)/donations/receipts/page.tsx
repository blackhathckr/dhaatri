"use client";

import React from "react";
import Link from "next/link";
import { Download, Heart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Awaiting,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from "@/store";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ReceiptsPage() {
  const state = useData();
  const { currentUser } = useAuthContext();

  const isOps = currentUser.role === "dhaatri_ops" || currentUser.role === "admin";
  const scoped = (isOps ? state.donations : state.donations.filter((d) => d.donorId === currentUser.id))
    .filter((d) => d.receiptId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const total = scoped.reduce((a, d) => a + d.amount, 0);

  // Grouped by financial year — the grouping that matters for a tax receipt.
  const byYear = Object.entries(
    scoped.reduce<Record<string, typeof scoped>>((acc, d) => {
      const y = new Date(d.date).getFullYear();
      const key = `FY ${y}–${String(y + 1).slice(2)}`;
      (acc[key] ||= []).push(d);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Documents"
        title="Donation receipts"
        scene="plot"
        mascot="sprout-reading"
        figures={[
          { value: scoped.length, unit: "receipts", note: "on file" },
          { value: total, unit: "₹", note: "contributed in total" },
        ]}
      />

      {scoped.length === 0 ? (
        <Awaiting
          pose="sprout-waving"
          title="No receipts yet"
          body="A receipt is issued automatically the moment a contribution completes."
          action={
            <Link href="/donations">
              <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                Make a contribution
              </Button>
            </Link>
          }
        />
      ) : (
        byYear.map(([year, items], gi) => (
          <section key={year}>
            <Reveal delay={0.05 * gi}>
              <SectionHead
                eyebrow={year}
                title={`${formatCurrency(items.reduce((a, d) => a + d.amount, 0))} contributed`}
                note={`${items.length} ${items.length === 1 ? "receipt" : "receipts"} in this year`}
              />
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2">
              {items.map((d, i) => (
                <Reveal key={d.id} delay={0.04 * i}>
                  <div className="group h-full overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(4,39,24,0.45)]">
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#B4553F] via-[#E8B4A6] to-[#FBDDD2]" />

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-ink-faint">
                            Receipt
                          </p>
                          <p className="mt-1 font-mono text-[13px] text-[#B4553F]">
                            {d.receiptId}
                          </p>
                        </div>
                        <Pill tone={toneFor(d.status)}>{d.status}</Pill>
                      </div>

                      <p className="mt-6 font-onest text-[36px] font-semibold leading-none tracking-[-1.6px] text-ink-strong">
                        {formatCurrency(d.amount)}
                      </p>

                      <p className="mt-3 text-[14px] leading-6 text-ink-soft">
                        Received from{" "}
                        <span className="font-semibold text-ink-strong">{d.donorName}</span> on{" "}
                        {formatDate(d.date)} towards{" "}
                        <span className="font-medium text-ink-strong">{d.purpose}</span>.
                      </p>

                      {d.siteId && (
                        <Link
                          href={`/sites/${d.siteId}`}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1 text-[12px] text-ink-soft transition-colors hover:bg-[#D8F3DC]"
                        >
                          <Heart className="size-3 text-[#B4553F]" />
                          {state.sites.find((s) => s.id === d.siteId)?.name ?? d.siteId}
                        </Link>
                      )}

                      <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
                        <span className="flex items-center gap-2 text-[12px] text-ink-faint">
                          <ShieldCheck className="size-4 text-[#52B788]" />
                          Recorded in the public fund ledger
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => window.print()}
                          className="h-9 rounded-full border-line px-4 text-[13px] text-ink-brand hover:bg-[#D8F3DC]/40"
                        >
                          <Download className="mr-1.5 size-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
