"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Leaf } from "lucide-react";

const FOOTER_NAV = [
  {
    heading: "Platform",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Impact dashboard", href: "/impact" },
      { label: "Fund transparency", href: "/transparency" },
    ],
  },
  {
    heading: "Take part",
    links: [
      { label: "Register your space", href: "/register" },
      { label: "Volunteer with us", href: "/register" },
      { label: "Donate", href: "/donations" },
      { label: "Buy carbon credits", href: "/carbon-credits/purchase" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "About Dhaatri", href: "/about" },
      { label: "Carbon methodology", href: "/science/carbon-engine" },
      { label: "Species catalogue", href: "/science/species" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export default function CTAFooter() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer className="relative w-full bg-ink overflow-hidden">
      {/* light source behind the CTA */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full bg-fresh/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------- CTA ---- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="flex flex-col items-center text-center pt-20 lg:pt-28 pb-16 lg:pb-20"
        >
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-7">
            <Leaf className="w-4 h-4 text-mint" />
            <span className="text-[15px] font-medium text-white/80">
              Pilot open in Bengaluru
            </span>
          </div>

          <h2 className="max-w-[820px] font-onest text-[36px] sm:text-[48px] lg:text-[60px] font-semibold leading-[1.08] tracking-[-2.5px] text-white">
            There is a forest waiting in your{" "}
            <span className="font-playfair italic font-semibold text-mint">
              empty
            </span>{" "}
            plot
          </h2>

          <p className="max-w-[560px] mt-6 text-lg leading-[30px] tracking-[-0.3px] text-white/60">
            Register the space. We handle the science, the saplings and the monitoring —
            and publish exactly where every rupee went.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
            <Link href="/register">
              <motion.button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                layout
                className={
                  "flex items-center gap-3 py-2 rounded-full bg-white group cursor-pointer relative h-14 transition-all duration-300 " +
                  (isHovered ? "flex-row-reverse pl-2 pr-5" : "flex-row pl-5 pr-2")
                }
              >
                <motion.span
                  layout
                  className="text-base lg:text-[18px] font-medium leading-[28px] text-ink"
                >
                  Register your space
                </motion.span>
                <motion.div
                  layout
                  className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0"
                >
                  <motion.div
                    animate={{
                      x: isHovered ? [-24, 0] : 0,
                      opacity: isHovered ? [0, 1] : 1,
                    }}
                    transition={{ duration: 0.3, delay: isHovered ? 0.1 : 0 }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
              </motion.button>
            </Link>

            <Link
              href="/transparency"
              className="h-14 flex items-center px-6 rounded-full border border-white/20 text-white text-base lg:text-[18px] font-medium hover:bg-white/10 transition-colors"
            >
              See where funds go
            </Link>
          </div>
        </motion.div>

        {/* ---------------------------------------------------- footer ---- */}
        <div className="border-t border-white/10 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-10 lg:gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/brand/logo-mark.png"
                  alt="Dhaatri"
                  width={36}
                  height={36}
                  className="rounded-[10px]"
                />
                <span className="font-onest text-xl font-semibold tracking-[-0.5px] text-white">
                  Dhaatri
                </span>
              </Link>

              <p className="mt-5 max-w-[320px] text-[15px] leading-[26px] text-white/50">
                A national public platform for citizen-driven plantation and carbon
                footprint reduction — governed with full public transparency.
              </p>

              <p className="mt-6 text-[13px] text-white/35">
                Nurturing Earth. Growing Impact.
              </p>
            </div>

            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <p className="text-[13px] font-semibold uppercase tracking-[1.5px] text-mint mb-5">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-3.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[15px] text-white/55 hover:text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-white/35">
              © {new Date().getFullYear()} Dhaatri · Built by Canarys Automations Pvt. Ltd.
            </p>
            <p className="text-[13px] text-white/35">
              Pilot v0.1 · Bengaluru
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
