"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, animate, useInView } from "framer-motion";
import { ShieldCheck } from "lucide-react";

/** Counts up once the section scrolls into view, then holds. */
function Counter({
  value,
  suffix = "",
  decimals = 0,
  duration = 1.8,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/** Supporting figures — rendered as a divided row, deliberately not as cards. */
const FIGURES = [
  { value: 93.8, suffix: "%", decimals: 1, label: "Verified survival", note: "from geo-tagged check-ins" },
  { value: 100, suffix: "%", label: "Funds traceable", note: "every rupee purpose-tagged" },
  { value: 8, suffix: "", label: "Stakeholder roles", note: "coordinated on one platform" },
];

export default function ImpactMetrics() {
  return (
    <section className="relative w-full bg-cream py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------- headline + hero stat */}
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <p className="text-sm font-semibold tracking-[1.5px] uppercase text-emerald mb-4">
              Measured, not estimated
            </p>
            <h2 className="font-onest text-[34px] sm:text-[44px] lg:text-[52px] font-semibold leading-[1.05] tracking-[-2px] text-ink">
              Impact you can{" "}
              <span className="font-playfair italic font-semibold text-black opacity-45">
                audit
              </span>
            </h2>

            {/* The headline figure gets to be genuinely large — a stat this
                central shouldn't sit in a box the same size as the others. */}
            <div className="mt-10 flex items-end gap-5">
              <p className="font-onest text-[72px] sm:text-[92px] lg:text-[108px] font-semibold leading-[0.85] tracking-[-5px] text-ink">
                <Counter value={12480} />
              </p>
              <div className="pb-2">
                <p className="font-onest text-xl font-semibold tracking-[-0.5px] text-ink">
                  trees planted
                </p>
                <p className="text-[15px] text-ink/50">across the pilot locality</p>
              </div>
            </div>

            <p className="mt-8 max-w-[460px] text-lg leading-[30px] tracking-[-0.3px] text-ink/65">
              Every figure traces back to a specific site, a verified check-in and a
              versioned carbon methodology — never a notional estimate.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            <div className="relative aspect-[3/2] w-full max-w-[480px] lg:ml-auto overflow-hidden rounded-[24px] bg-pale">
              <Image
                src="/features/process.png"
                alt="A single plot progressing from bare earth to mature trees"
                fill
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover"
              />
            </div>

            {/* caption tag riding the image edge */}
            <div className="absolute -bottom-4 left-6 lg:left-auto lg:right-6 rounded-full bg-ink px-5 py-2.5 shadow-[0_16px_36px_-20px_rgba(4,39,24,0.6)]">
              <p className="text-[13px] font-medium text-white">
                One plot · bare earth → monitored canopy
              </p>
            </div>
          </motion.div>
        </div>

        {/* ---------------------------------------------- supporting figures */}
        <div className="mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-3 border-t border-ink/10">
          {FIGURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className={
                "py-8 sm:py-10 " +
                (i > 0 ? "sm:pl-10 sm:border-l border-ink/10 border-t sm:border-t-0" : "sm:pr-10")
              }
            >
              <p className="font-onest text-[44px] lg:text-[54px] font-semibold leading-none tracking-[-2.5px] text-ink">
                <Counter value={f.value} suffix={f.suffix} decimals={f.decimals ?? 0} />
              </p>
              <p className="mt-3 text-[17px] font-semibold tracking-[-0.3px] text-ink">
                {f.label}
              </p>
              <p className="mt-1 text-[15px] leading-6 text-ink/50">{f.note}</p>
            </motion.div>
          ))}
        </div>

        {/* methodology note — the credibility line from proposal §7 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-4 flex items-start gap-3 border-t border-ink/10 pt-8"
        >
          <ShieldCheck className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
          <p className="max-w-[760px] text-[15px] leading-6 text-ink/60">
            CO₂ figures are produced by a scientist-owned, versioned computation engine — a
            function of species, growth stage and verified survival. Every published number
            is traceable to its methodology version, its site and its monitoring data.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
