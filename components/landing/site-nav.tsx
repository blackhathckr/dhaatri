"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Impact", href: "/impact" },
  { label: "Transparency", href: "/transparency" },
  { label: "About", href: "/about" },
];

/**
 * Marketing navigation for the inner pages.
 *
 * The home hero carries its own copy overlaid on the video; this is the solid
 * variant that sticks to the top of every other public page, so those pages
 * stop rendering as bare documents with no way back.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <header
      className={
        "sticky top-0 z-50 w-full transition-all duration-300 " +
        (scrolled
          ? "border-b border-ink/8 bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent bg-cream")
      }
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image
            src="/brand/logo-mark.png"
            alt="Dhaatri"
            width={36}
            height={36}
            className="rounded-[10px]"
          />
          <span className="font-onest text-xl font-semibold tracking-[-0.5px] text-ink">
            Dhaatri
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={
                    "text-base leading-6 tracking-[-0.3px] text-ink transition-all " +
                    (active
                      ? "font-bold opacity-100"
                      : "font-normal opacity-70 hover:font-bold hover:opacity-100")
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Link href="/login" className="max-sm:hidden">
            <motion.button
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              layout
              className={
                "flex h-11 items-center gap-3 rounded-full border border-ink/15 bg-white py-1.5 transition-all duration-300 " +
                (hovered ? "flex-row-reverse pl-1.5 pr-[18px]" : "flex-row pl-[18px] pr-1.5")
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
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink"
              >
                <motion.div
                  animate={{ x: hovered ? [-20, 0] : 0, opacity: hovered ? [0, 1] : 1 }}
                  transition={{ duration: 0.3, delay: hovered ? 0.1 : 0 }}
                >
                  <ArrowUpRight className="size-3 text-white" />
                </motion.div>
              </motion.div>
            </motion.button>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="rounded-full bg-ink/5 p-2 text-ink lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col gap-8 bg-white px-6 py-8 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/brand/logo-mark.png"
                  alt="Dhaatri"
                  width={36}
                  height={36}
                  className="rounded-[10px]"
                />
                <span className="font-onest text-xl font-semibold text-ink">Dhaatri</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-full bg-ink/5 p-2 text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <ul className="flex flex-col gap-6">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="font-onest text-2xl font-semibold text-ink"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link href="/register">
                <button className="w-full rounded-full bg-ink py-4 text-lg font-medium text-white">
                  Register your space
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
