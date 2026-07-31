"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center text-center"
      >
        <Image src="/mascot/sprout-holding-phone.png" alt="" width={124} height={124} />

        <span className="mt-4 flex size-11 items-center justify-center rounded-full bg-[#D8F3DC]">
          <MailCheck className="size-5 text-[#2D6A4F]" />
        </span>

        <h1 className="mt-5 font-onest text-[26px] font-semibold tracking-[-1px] text-[#1B4332]">
          Check your inbox
        </h1>
        <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-[#6B7F75]">
          If <span className="font-medium text-[#1B4332]">{email}</span> is registered,
          a reset link is on its way. It expires in an hour.
        </p>

        <Link href="/login" className="mt-8">
          <Button className="h-11 rounded-full bg-[#1B4332] px-6 hover:bg-[#2D6A4F]">
            Back to sign in
          </Button>
        </Link>

        <button
          onClick={() => setSent(false)}
          className="mt-4 text-[13px] text-[#9AA39C] underline-offset-4 hover:text-[#2D6A4F] hover:underline"
        >
          Use a different address
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9AA39C] transition-colors hover:text-[#2D6A4F]"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>

      <h1 className="mt-6 font-onest text-[30px] font-semibold tracking-[-1.2px] text-[#1B4332]">
        Reset your password
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-[#6B7F75]">
        Give us the address you registered with and we&apos;ll send a link to set a new one.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes("@")) setSent(true);
        }}
        className="mt-8 space-y-4"
      >
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

        <Button
          type="submit"
          disabled={!email.includes("@")}
          className="h-11 w-full rounded-full bg-[#1B4332] text-[15px] hover:bg-[#2D6A4F] disabled:opacity-40"
        >
          Send the link
          <ArrowRight className="ml-1.5 size-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#6B7F75]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-[#2D6A4F] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
