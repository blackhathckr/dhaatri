"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Leaf, Menu, X } from "lucide-react";
import BrandMark from "next/image";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Impact", href: "/impact" },
  { label: "Transparency", href: "/transparency" },
  { label: "About", href: "/about" },
];

/** The stakeholder network the platform coordinates (proposal §3). */
const NETWORK = ["Citizens", "Volunteers", "Scientists", "Suppliers", "Donors", "Organisations"];

export default function Hero() {
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isCTAHovered, setIsCTAHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Video mounts client-side only so SSR doesn't ship a paused first frame.
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative w-full overflow-hidden min-h-[800px] lg:min-h-[900px]"
    >
      {/* Living background. A flat gradient here is the single biggest thing
          separating this from a template — motion behind still type is what
          makes the section feel alive. The generated forest scene is the
          poster, so there is never an empty frame while the video loads. */}
      <div className="absolute inset-0 z-0">
        <img
          src="/scenes/forest-banner.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        {isMounted && (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/scenes/forest-banner.png"
            className="relative w-full h-full object-cover"
          >
            <source
              src="https://cdn.jiro.build/Amox/All%20Images/P01-Header-01-BG.mp4"
              type="video/mp4"
            />
          </video>
        )}
        {/* Scrim so dark type stays legible over any frame, resolving to the
            page colour so the section dissolves rather than ending on a seam. */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-cream" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-12">
        {/* ------------------------------------------------------- nav ---- */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <BrandMark
              src="/brand/logo-mark.png"
              alt="Dhaatri"
              width={38}
              height={38}
              priority
              className="rounded-[11px]"
            />
            <span className="font-onest text-xl font-semibold tracking-[-0.5px] text-ink">
              Dhaatri
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={
                    "text-base leading-6 tracking-[-0.3px] text-ink transition-all " +
                    (item.label === "Home"
                      ? "font-bold opacity-100"
                      : "font-normal opacity-80 hover:opacity-100 hover:font-bold")
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <motion.button
                onMouseEnter={() => setIsNavHovered(true)}
                onMouseLeave={() => setIsNavHovered(false)}
                layout
                className={
                  "hidden sm:flex items-center gap-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 group cursor-pointer relative h-11 transition-all duration-300 " +
                  (isNavHovered ? "flex-row-reverse pl-1.5 pr-[18px]" : "flex-row pl-[18px] pr-1.5")
                }
              >
                <motion.span
                  layout
                  className="text-base font-medium leading-6 tracking-[-0.3px] text-ink"
                >
                  Sign in
                </motion.span>
                <motion.div
                  layout
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
                >
                  <motion.div
                    animate={{
                      x: isNavHovered ? [-20, 0] : 0,
                      opacity: isNavHovered ? [0, 1] : 1,
                    }}
                    transition={{ duration: 0.3, delay: isNavHovered ? 0.1 : 0 }}
                  >
                    <ArrowUpRight className="w-3 h-3 text-ink" />
                  </motion.div>
                </motion.div>
              </motion.button>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              className="lg:hidden p-2 text-ink bg-white/20 backdrop-blur-md rounded-full"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </motion.nav>

        {/* ------------------------------------------------ mobile menu --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] lg:hidden bg-white px-6 py-8 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandMark
                    src="/brand/logo-mark.png"
                    alt="Dhaatri"
                    width={38}
                    height={38}
                    className="rounded-[11px]"
                  />
                  <span className="font-onest text-xl font-semibold text-ink">Dhaatri</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-ink bg-ink/5 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <ul className="flex flex-col gap-6">
                {NAV_ITEMS.map((item, idx) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx, ease: "easeOut" }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-onest text-2xl font-semibold text-ink"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link href="/register">
                  <button className="w-full py-4 rounded-full bg-ink text-white font-medium text-lg">
                    Register your space
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------------------------------------------- content -- */}
        <div className="flex flex-col items-center mt-12 lg:mt-[80px]">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="flex flex-row items-center gap-1.5 sm:gap-2 px-3 sm:px-[14px] py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 mb-6 whitespace-nowrap"
          >
            <div className="flex items-center gap-1 shrink-0">
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-ink text-ink" />
              <span className="text-sm sm:text-base lg:text-[18px] font-medium leading-[28px] text-ink">
                Pilot live in Bengaluru
              </span>
            </div>
            <span className="text-sm sm:text-base lg:text-[18px] font-normal leading-[28px] text-black opacity-60 shrink-0">
              open to every citizen
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            className="max-w-[820px] w-full text-center font-onest text-[40px] sm:text-[50px] lg:text-[66px] font-semibold leading-tight lg:leading-[72px] tracking-tight lg:tracking-[-3px] text-ink"
          >
            Turn open spaces into{" "}
            <span className="font-playfair italic font-semibold text-black opacity-50 tracking-normal lg:tracking-[-3.566px]">
              measurable
            </span>{" "}
            green cover
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="max-w-[630px] w-full text-center mt-5 text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] tracking-[-0.4px] text-ink"
          >
            Register your land, receive a science-backed plantation plan, and follow every
            tree through verified survival data — with full public transparency on where
            the money goes.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-3 mt-8 lg:mt-12"
          >
            <Link href="/register">
              <motion.button
                onMouseEnter={() => setIsCTAHovered(true)}
                onMouseLeave={() => setIsCTAHovered(false)}
                layout
                className={
                  "flex items-center gap-3 py-2 rounded-full bg-ink group cursor-pointer relative h-14 border border-white/20 transition-all duration-300 " +
                  (isCTAHovered ? "flex-row-reverse pl-2 pr-5" : "flex-row pl-5 pr-2")
                }
              >
                <motion.span
                  layout
                  className="text-base lg:text-[18px] font-medium leading-[28px] text-white"
                >
                  Register your space
                </motion.span>
                <motion.div
                  layout
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
                >
                  <motion.div
                    animate={{
                      x: isCTAHovered ? [-24, 0] : 0,
                      opacity: isCTAHovered ? [0, 1] : 1,
                    }}
                    transition={{ duration: 0.3, delay: isCTAHovered ? 0.1 : 0 }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-ink" />
                  </motion.div>
                </motion.div>
              </motion.button>
            </Link>

            <Link
              href="/impact"
              className="h-14 flex items-center px-6 rounded-full border border-ink/20 bg-white/20 backdrop-blur-sm text-ink text-base lg:text-[18px] font-medium hover:bg-white/40 transition-colors"
            >
              See the impact
            </Link>
          </motion.div>

          {/* -------------------------------------------------- network --- */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
            className="mt-20 lg:mt-[180px] flex flex-col items-center gap-10 w-full"
          >
            <div className="px-[16px] py-1.5 rounded-full bg-ink/10 backdrop-blur-sm border border-ink/10">
              <p className="text-sm lg:text-base font-medium leading-6 tracking-[-0.3px] text-ink text-center">
                One platform coordinating every stakeholder in the chain
              </p>
            </div>

            {/* Stakeholder marquee — the reference ran client logos here; the
                platform's equivalent is the network it brings together. */}
            <div
              className="w-full mt-4 overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
              }}
            >
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, ease: "linear", repeat: Infinity }}
                className="flex items-center gap-12 sm:gap-16 lg:gap-24 w-fit"
              >
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={i}>
                    {NETWORK.map((role) => (
                      <span
                        key={`${i}-${role}`}
                        className="font-onest text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-[-1px] text-ink/40 whitespace-nowrap hover:text-ink/70 transition-colors"
                      >
                        {role}
                      </span>
                    ))}
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
