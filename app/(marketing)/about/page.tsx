"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Sprout,
} from "lucide-react";

import { SiteNav } from "@/components/landing/site-nav";
import CTAFooter from "@/components/landing/cta-footer";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteNav />

      {/* ============================================================ hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/scenes/empty-plot.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/88 via-ink/75 to-cream" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <Reveal>
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <Sprout className="size-4 text-mint" />
              <span className="text-[15px] font-medium text-white/85">
                A national public platform
              </span>
            </div>

            <h1 className="mt-6 max-w-[840px] font-onest text-[38px] font-semibold leading-[1.05] tracking-[-2px] text-white sm:text-[52px] lg:text-[62px]">
              Every open space is an{" "}
              <span className="font-playfair italic font-semibold text-mint">
                opportunity
              </span>
            </h1>

            <p className="mt-5 max-w-[620px] text-lg leading-[30px] tracking-[-0.3px] text-white/60">
              Dhaatri exists so that any available land in the country can become planned,
              monitored and measurable green cover — driven by citizens, guided by science,
              and governed with full public transparency.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================================================= mission */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[1.5px] text-emerald">
              Why it exists
            </p>
            <h2 className="mt-3 font-onest text-[30px] font-semibold leading-[1.08] tracking-[-1.6px] text-ink lg:text-[42px]">
              Planting is easy.
              <br />
              Proving it worked is not.
            </h2>

            <div className="mt-6 space-y-4 text-[17px] leading-[29px] text-ink/65">
              <p>
                Plenty of trees get planted. Far fewer are counted a year later. The gap
                between a planting drive and verified green cover is where most impact
                quietly disappears.
              </p>
              <p>
                Dhaatri closes that gap by treating the whole lifecycle as one system —
                assessment, a science-backed plan, verified supply, geo-tagged monitoring,
                and a public ledger of every rupee. Nothing advances on trust alone.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Citizen-driven", "Science-guided", "Publicly auditable"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-[14px] font-medium text-ink/70"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-[4/3] w-full max-w-[460px] overflow-hidden rounded-[28px] bg-pale lg:ml-auto">
              <Image
                src="/features/process.png"
                alt="A plot progressing from bare earth to mature trees"
                fill
                sizes="(max-width: 1024px) 90vw, 460px"
                className="object-contain p-4"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================== methodology */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <Reveal>
          <div className="relative grid gap-10 overflow-hidden rounded-[32px] bg-ink p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:p-14">
            <div className="pointer-events-none absolute -right-24 -top-28 size-[420px] rounded-full bg-fresh/10 blur-3xl" />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[1.5px] text-mint">
                The number that has to hold up
              </p>
              <h2 className="mt-4 font-onest text-[30px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[42px]">
                A carbon figure you can challenge
              </h2>
              <p className="mt-5 max-w-[460px] text-[17px] leading-[29px] text-white/60">
                CO₂ published by Dhaatri is a function of species, growth stage and{" "}
                <span className="text-mint">verified survival</span> — never a notional
                estimate. The scientific panel owns the formula; the platform implements it
                as a versioned engine.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Every figure traceable to its methodology version",
                  "Traceable to the site and its monitoring data",
                  "The same engine backs every carbon credit sold",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-mint" />
                    <span className="text-[15px] leading-6 text-white/75">{line}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/impact"
                className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-mint"
              >
                See the published data
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute size-64 rounded-full bg-mint/10 blur-2xl" />
              <Image
                src="/mascot/sprout-thinking.png"
                alt=""
                width={280}
                height={280}
                className="relative drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ========================================================== close */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Reveal>
          <div className="flex flex-col gap-4 rounded-[20px] bg-ink/[0.04] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] leading-6 text-ink/60">
              Built by{" "}
              <span className="font-medium text-ink">Canarys Automations Pvt. Ltd.</span> —
              the pilot runs on the same architecture intended for national scale, so new
              regions, languages and supplier networks are configuration, not rebuilds.
            </p>
            <Link
              href="/register"
              className="group flex shrink-0 items-center gap-2 text-[15px] font-medium text-emerald"
            >
              Register your space
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <CTAFooter />
    </div>
  );
}
