"use client";

import React from "react";
import Link from "next/link";
import { Bell, Check, ChevronDown, LogOut, Search, Sparkles } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/components/shared/auth-provider";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useData } from "@/store";
import { ROLE_LABELS } from "@/lib/roles";

const initials = (n: string) =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function AppHeader() {
  const { currentUser, switchUser } = useAuthContext();
  const state = useData();

  const unread = state.notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  // One demo account per role — the switcher is how the whole workflow is
  // demonstrated from every side without signing in and out.
  const roles = state.users.filter((u, i, arr) => arr.findIndex((x) => x.role === u.role) === i);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-sm">
      <SidebarTrigger />

      <div className="relative hidden w-72 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Search…"
          className="h-9 rounded-full border-0 bg-surface-3 pl-9 text-[14px]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <ThemeToggle />

        <Link
          href="/notifications"
          className="relative rounded-lg p-2 transition-colors hover:bg-surface-3"
        >
          <Bell className="size-5 text-ink-soft" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[#B4553F] px-1 text-[10px] font-semibold leading-[18px] text-white">
              {unread}
            </span>
          )}
        </Link>

        {/* role switcher — the top-right control the demo runs on */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#D8F3DC] text-[11px] font-semibold text-[#12362A]">
                  {initials(currentUser.name)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[12px] font-medium text-ink-strong">
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <span className="block text-[10px] text-ink-faint">
                    {ROLE_LABELS[currentUser.role]}
                  </span>
                </span>
                <ChevronDown className="size-3.5 text-ink-faint" />
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl">
            {/* Base UI requires GroupLabel to live inside a Group — without the
                wrapper it throws MenuGroupContext is missing. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                <Sparkles className="size-3" />
                Prototype · view as
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {roles.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => switchUser(u.id)}
                className="gap-2.5 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-3 text-[11px] font-semibold text-ink-brand">
                  {initials(u.name)}
                </span>
                <span className="grid flex-1 leading-tight">
                  <span className="text-[13px] font-medium text-ink-strong">
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span className="text-[11px] text-ink-faint">{u.name}</span>
                </span>
                  {u.id === currentUser.id && <Check className="size-3.5 text-[#52B788]" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5" render={<Link href="/profile" />}>
              Your profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 text-[#B4553F]" render={<Link href="/login" />}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
