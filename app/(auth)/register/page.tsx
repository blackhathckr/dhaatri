"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckIcon } from "lucide-react";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/components/shared/auth-provider";
import { ROLE_LABELS } from "@/lib/roles";
import { MOCK_USERS } from "@/data/mock";
import type { UserRole } from "@/data/types";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** What each role signs up to do. Picking one is the only real decision here. */
const JOINABLE: { role: UserRole; note: string }[] = [
  { role: "citizen", note: "Register open space near you and watch it become green cover." },
  { role: "volunteer", note: "Assess sites and log the check-ins everything else rests on." },
  { role: "donor", note: "Fund plantation and follow every rupee through the public ledger." },
  { role: "organisation", note: "Offset emissions against trees that have been counted." },
];

const STEPS = [{ title: "You" }, { title: "Role" }, { title: "Done" }];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthContext();

  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("citizen");

  const canContinue = step === 1 ? name.trim().length > 1 && email.includes("@") : true;

  const finish = () => {
    // The prototype has no signup backend, so we drop into the matching demo account.
    const match = MOCK_USERS.find((u) => u.role === role) ?? MOCK_USERS[0];
    login(match.email);
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <h1 className="font-onest text-[30px] font-semibold tracking-[-1.2px] text-[#1B4332]">
        Join Dhaatri
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-[#6B7F75]">
        Three questions, then you&apos;re in.
      </p>

      <div className="mt-8">
        <Stepper
          value={step}
          onValueChange={setStep}
          indicators={{ completed: <CheckIcon className="size-3.5" /> }}
          className="space-y-7"
        >
          <StepperNav className="gap-3">
            {STEPS.map((s, i) => (
              <StepperItem key={s.title} step={i + 1} className="relative flex-1 items-start">
                <StepperTrigger className="flex grow flex-col items-start justify-center gap-2.5">
                  <StepperIndicator>{i + 1}</StepperIndicator>
                  <StepperTitle className="font-onest text-[14px] font-semibold tracking-[-0.2px] group-data-[state=inactive]/step:text-[#C4C0B7]">
                    {s.title}
                  </StepperTitle>
                </StepperTrigger>
              </StepperItem>
            ))}
          </StepperNav>

          <StepperPanel>
            <StepperContent value={1}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1B4332]">
                    Full name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="h-11 rounded-xl border-[#E0DDD6] bg-white focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1B4332]">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border-[#E0DDD6] bg-white focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1B4332]">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 rounded-xl border-[#E0DDD6] bg-white focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
                  />
                </div>
              </div>
            </StepperContent>

            <StepperContent value={2}>
              <div className="space-y-2.5">
                {JOINABLE.map((j) => {
                  const on = role === j.role;
                  return (
                    <button
                      key={j.role}
                      type="button"
                      onClick={() => setRole(j.role)}
                      className={
                        "flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all " +
                        (on
                          ? "border-[#52B788] bg-[#F3F9F5]"
                          : "border-[#E0DDD6] bg-white hover:border-[#C9D6CC]")
                      }
                    >
                      <span
                        className={
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
                          (on ? "border-[#2D6A4F] bg-[#2D6A4F]" : "border-[#D5D0C6]")
                        }
                      >
                        {on && <Check className="size-3 text-white" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-[#1B4332]">
                          {ROLE_LABELS[j.role]}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-[#6B7F75]">
                          {j.note}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </StepperContent>

            <StepperContent value={3}>
              <div className="flex flex-col items-center rounded-xl bg-[#F3F6F0] py-8">
                <Image src="/mascot/sprout-celebrating.png" alt="" width={104} height={104} />
                <p className="mt-3 font-onest text-[18px] font-semibold tracking-[-0.4px] text-[#1B4332]">
                  Ready when you are, {name.split(" ")[0] || "friend"}
                </p>
                <p className="mt-1.5 max-w-[300px] text-center text-[13px] leading-5 text-[#6B7F75]">
                  You&apos;ll join as a {ROLE_LABELS[role].toLowerCase()}. In the prototype this
                  drops you into a seeded account with data already in it.
                </p>
              </div>
            </StepperContent>
          </StepperPanel>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="h-10 rounded-full px-4 text-[#6B7F75] hover:bg-[#EDE9E1] disabled:opacity-40"
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep(step + 1)}
                className="h-10 rounded-full bg-[#1B4332] px-6 hover:bg-[#2D6A4F] disabled:opacity-40"
              >
                Continue
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={finish}
                className="h-10 rounded-full bg-[#2D6A4F] px-6 hover:bg-[#1B4332]"
              >
                Get started
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            )}
          </div>
        </Stepper>
      </div>

      <p className="mt-8 text-center text-[14px] text-[#6B7F75]">
        Already registered?{" "}
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
