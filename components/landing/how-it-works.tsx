"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The seven-stage lifecycle the pilot implements (proposal §5).
 *
 * Each stage is carried by a mascot pose rather than a generic icon — the
 * character is already the product's visual signature, and a pose can express
 * *what is happening* in a way a line icon can't.
 */
const STAGES = [
  {
    title: "Request",
    who: "Citizen",
    mascot: "/mascot/sprout-holding-phone.png",
    body: "You register an open space with its geo-location and raise a plantation request. A volunteer assessment is scheduled automatically.",
    output: "Request raised",
  },
  {
    title: "Site assessment",
    who: "Volunteer",
    mascot: "/mascot/sprout-reading.png",
    body: "A trained volunteer visits and captures soil pH, confirmed area, sunlight hours, water access and obstacles — geo-tagged, on the mobile app.",
    output: "Field report filed",
  },
  {
    title: "Plantation plan",
    who: "Dhaatri",
    mascot: "/mascot/sprout-thinking.png",
    body: "An in-depth plan is prepared from the assessment: recommended native species, quantities, layout, method and the rationale behind each choice.",
    output: "Plan drafted",
  },
  {
    title: "Approval",
    who: "Citizen",
    mascot: "/mascot/sprout-celebrating.png",
    body: "You review the plan and choose your model — pay for the saplings, or commit to nurturing them under the stewardship agreement.",
    output: "Model chosen",
  },
  {
    title: "Fulfilment",
    who: "Supplier",
    mascot: "/mascot/sprout-pointing.png",
    body: "The order routes to a verified supplier. Stock is committed, dispatch and delivery tracked, and the payment recorded in the public ledger.",
    output: "Saplings delivered",
  },
  {
    title: "Planting",
    who: "Field team",
    mascot: "/mascot/sprout-planting.png",
    body: "Planting is carried out and the site is geo-tagged with baseline photographs, establishing the reference point for all future monitoring.",
    output: "Baseline captured",
  },
  {
    title: "Monitoring",
    who: "Everyone",
    mascot: "/mascot/sprout-watering.png",
    body: "Periodic geo-tagged check-ins record survival. Scientists verify each one and issue advisories — and the data flows into the carbon engine.",
    output: "Survival verified",
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <section id="how-it-works" className="relative w-full bg-ink py-20 lg:py-28 overflow-hidden">
      <div className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full bg-fresh/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="max-w-[720px]"
        >
          <p className="text-sm font-semibold tracking-[1.5px] uppercase text-mint mb-4">
            The full lifecycle
          </p>
          <h2 className="font-onest text-[34px] sm:text-[44px] lg:text-[52px] font-semibold leading-[1.1] tracking-[-2px] text-white">
            From an empty plot to a{" "}
            <span className="font-playfair italic font-semibold text-mint">monitored</span>{" "}
            forest
          </h2>
          <p className="mt-5 text-lg leading-[30px] tracking-[-0.3px] text-white/60">
            Seven stages, each with a named owner and a verifiable output. Nothing moves
            forward on trust alone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-14 mt-14">
          {/* -------------------------------------------------- stage rail */}
          <div className="flex flex-col gap-1.5">
            {STAGES.map((s, i) => {
              const on = i === active;
              return (
                <motion.button
                  key={s.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={
                    "group relative flex items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors duration-300 " +
                    (on ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  {/* mascot chip — grows and brightens when active */}
                  <span
                    className={
                      "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden transition-all duration-300 " +
                      (on ? "bg-mint/25 scale-105" : "bg-white/[0.07]")
                    }
                  >
                    <Image
                      src={s.mascot}
                      alt=""
                      width={44}
                      height={44}
                      className={
                        "object-contain transition-all duration-300 " +
                        (on ? "opacity-100" : "opacity-55 group-hover:opacity-85")
                      }
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        "block font-onest text-[17px] font-semibold tracking-[-0.4px] transition-colors " +
                        (on ? "text-white" : "text-white/70 group-hover:text-white")
                      }
                    >
                      {s.title}
                    </span>
                    <span className="block text-[13px] text-white/40">{s.who}</span>
                  </span>

                  <span className="font-onest text-sm tabular-nums text-white/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ------------------------------------------------ stage detail */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-sm p-8 lg:p-10 min-h-[420px] flex flex-col overflow-hidden"
          >
            {/* soft halo behind the mascot */}
            <div className="absolute -top-10 -right-10 w-[240px] h-[240px] rounded-full bg-mint/10 blur-2xl pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col h-full"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[1.5px] text-mint">
                      Stage {active + 1} · {stage.who}
                    </p>
                    <h3 className="mt-2 font-onest text-[30px] lg:text-[38px] font-semibold leading-tight tracking-[-1.2px] text-white">
                      {stage.title}
                    </h3>
                  </div>

                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="shrink-0"
                  >
                    <Image
                      src={stage.mascot}
                      alt=""
                      width={132}
                      height={132}
                      className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                    />
                  </motion.div>
                </div>

                <p className="mt-4 max-w-[440px] text-[17px] leading-[28px] text-white/65">
                  {stage.body}
                </p>

                <div className="mt-6 inline-flex self-start items-center gap-2 rounded-full bg-mint/15 border border-mint/25 px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                  <span className="text-[14px] font-medium text-mint">{stage.output}</span>
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex items-center gap-1.5">
                    {STAGES.map((s, i) => (
                      <span
                        key={s.title}
                        className={
                          "h-1 flex-1 rounded-full transition-colors duration-300 " +
                          (i <= active ? "bg-mint" : "bg-white/15")
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-white/40">
                    {active + 1} of {STAGES.length} — hover or tap a stage to explore
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
