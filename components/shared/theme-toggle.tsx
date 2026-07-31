"use client";

import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * A two-state track rather than a bare icon button — you can see which mode
 * you're in without having to reason about what the icon is offering.
 */
/** Server-rendered markup can't know the stored theme; treat it as light until mounted. */
const noSubscribe = () => () => {};
const useMounted = () =>
  React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-9 w-[68px] items-center rounded-full border border-line bg-surface-3 p-1 transition-colors"
    >
      <motion.span
        animate={{ x: dark ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 480, damping: 34 }}
        className="absolute size-7 rounded-full bg-[#2D6A4F] shadow-sm"
      />
      <span className="relative z-10 flex size-7 items-center justify-center">
        <Sun className={dark ? "size-4 text-ink-faint" : "size-4 text-white"} />
      </span>
      <span className="relative z-10 flex size-7 items-center justify-center">
        <Moon className={dark ? "size-4 text-white" : "size-4 text-ink-faint"} />
      </span>
    </button>
  );
}
