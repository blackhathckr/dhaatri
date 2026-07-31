"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/components/shared/auth-provider";
import { MOCK_USERS } from "@/data/mock";
import { ROLE_LABELS } from "@/lib/roles";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** One demo account per role — the fastest way into any part of the prototype. */
const QUICK = MOCK_USERS.filter(
  (u, i, all) => all.findIndex((x) => x.role === u.role) === i
);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || MOCK_USERS[0].email);
    router.push("/dashboard");
  };

  const enter = (userEmail: string) => {
    login(userEmail);
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <h1 className="font-onest text-[30px] font-semibold tracking-[-1.2px] text-[#1B4332]">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-[#6B7F75]">
        Sign in to check on your spaces, or pick a role below to explore the prototype.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#1B4332]">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-xl border-[#E0DDD6] bg-white focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label className="text-[13px] font-medium text-[#1B4332]">Password</label>
            <Link
              href="/forgot-password"
              className="text-[13px] text-[#2D6A4F] underline-offset-4 hover:underline"
            >
              Forgot it?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl border-[#E0DDD6] bg-white pr-11 focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA39C] transition-colors hover:text-[#2D6A4F]"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-full bg-[#1B4332] text-[15px] hover:bg-[#2D6A4F]"
        >
          Sign in
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </form>

      {/* ------------------------------------------------------ role entry */}
      <div className="mt-9">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[#E0DDD6]" />
          <span className="text-[12px] font-medium uppercase tracking-[1px] text-[#9AA39C]">
            Or enter as
          </span>
          <span className="h-px flex-1 bg-[#E0DDD6]" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {QUICK.map((u, i) => (
            <motion.button
              key={u.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.04 * i, ease: EASE }}
              onClick={() => enter(u.email)}
              className="group rounded-xl border border-[#E0DDD6] bg-white px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#52B788] hover:shadow-[0_12px_28px_-20px_rgba(4,39,24,0.4)]"
            >
              <p className="text-[13px] font-semibold text-[#1B4332]">
                {ROLE_LABELS[u.role]}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[#9AA39C]">{u.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6B7F75]">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-medium text-[#2D6A4F] underline-offset-4 hover:underline"
        >
          Register a space
        </Link>
      </p>
    </motion.div>
  );
}
