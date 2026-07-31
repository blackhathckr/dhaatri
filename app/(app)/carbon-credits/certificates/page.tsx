"use client";

import React from "react";
import Link from "next/link";
import { Download, Leaf, ShieldCheck } from "lucide-react";

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
import { useData, CARBON_METHOD_VERSION } from "@/store";
import { formatCurrency, formatDate } from "@/lib/format";
import { getUserById } from "@/data/mock";

export default function CertificatesPage() {
  const state = useData();
  const { currentUser } = useAuthContext();

  const scoped = (
    currentUser.role === "organisation"
      ? state.credits.filter((c) => c.organisationId === currentUser.id)
      : state.credits
  ).filter((c) => c.certificateId);

  const total = scoped.reduce((a, c) => a + c.credits, 0);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Documents"
        title="Your carbon certificates"
        scene="canopy"
        mascot="sprout-reading"
        figures={[
          { value: scoped.length, unit: "issued", note: "certificates on record" },
          { value: total, unit: "tCO₂e", decimals: 1, note: "total certified" },
        ]}
      />

      <section>
        <Reveal>
          <SectionHead
            eyebrow="On file"
            title={`${scoped.length} ${scoped.length === 1 ? "certificate" : "certificates"}`}
            note="Each one names the sites and the methodology version behind the figure"
          />
        </Reveal>

        {scoped.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="No certificates yet"
            body="A certificate is issued the moment a carbon credit purchase completes."
            action={
              <Link href="/carbon-credits/purchase">
                <Button className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F]">
                  Purchase credits
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {scoped.map((c, i) => (
              <Reveal key={c.id} delay={0.05 * i}>
                {/* the certificate itself, not a row describing one */}
                <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1 hover:shadow-[0_20px_44px_-26px_rgba(4,39,24,0.45)]">
                  {/* guilloche-ish rule at the top, the way paper certificates carry one */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#1B4332] via-[#52B788] to-[#95D5B2]" />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-ink-faint">
                          Certificate of sequestration
                        </p>
                        <p className="mt-1 font-mono text-[13px] text-ink-brand">
                          {c.certificateId}
                        </p>
                      </div>
                      <Pill tone={toneFor(c.status)}>{c.status}</Pill>
                    </div>

                    <p className="mt-7 font-onest text-[44px] font-semibold leading-none tracking-[-2px] text-ink-strong">
                      {c.credits}
                      <span className="ml-2 text-[15px] font-medium text-ink-faint">tCO₂e</span>
                    </p>

                    <p className="mt-3 text-[14px] leading-6 text-ink-soft">
                      Issued to{" "}
                      <span className="font-semibold text-ink-strong">
                        {getUserById(c.organisationId)?.name ?? c.organisationId}
                      </span>{" "}
                      on {formatDate(c.purchasedAt)}, against verified plantation across{" "}
                      {c.siteIds.length} {c.siteIds.length === 1 ? "site" : "sites"}.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {c.siteIds.map((id) => (
                        <Link
                          key={id}
                          href={`/sites/${id}`}
                          className="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1 text-[12px] text-ink-soft transition-colors hover:bg-[#D8F3DC]"
                        >
                          <Leaf className="size-3 text-[#52B788]" />
                          {state.sites.find((s) => s.id === id)?.name ?? id}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
                      <div className="flex items-center gap-2 text-[12px] text-ink-faint">
                        <ShieldCheck className="size-4 text-[#52B788]" />
                        Method {CARBON_METHOD_VERSION} · {formatCurrency(c.amount)} paid
                      </div>
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
        )}
      </section>
    </div>
  );
}
