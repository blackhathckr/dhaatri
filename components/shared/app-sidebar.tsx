"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Sparkles } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
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
import { useData } from "@/store";
import { SIDEBAR_NAV, ROLE_LABELS } from "@/lib/roles";

const initials = (n: string) =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/**
 * The rail is a dark forest panel in both themes, so every colour here is an
 * on-dark colour. Using the light-mode ink tokens is what made the wordmark and
 * the hover state invisible — dark green text on a dark green panel.
 */
const ITEM =
  "text-[#C9E4D3] hover:bg-white/10 hover:text-white " +
  "data-[active=true]:bg-[#D8F3DC] data-[active=true]:font-medium data-[active=true]:text-[#12362A]";

export function AppSidebar() {
  const { currentUser, switchUser } = useAuthContext();
  const state = useData();
  const pathname = usePathname();
  const nav = SIDEBAR_NAV[currentUser.role];

  /** Live counts from the workflow store, so the rail moves as the demo runs. */
  const badgeFor = (url: string): number | null => {
    if (url === "/notifications")
      return state.notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
    if (url === "/requests")
      return state.requests.filter((r) => r.status !== "completed").length;
    if (url.includes("monitoring-review"))
      return state.checkins.filter((c) => c.status === "pending_review").length;
    if (url === "/volunteers/tasks")
      return state.tasks.filter(
        (t) => t.volunteerId === currentUser.id && t.status !== "completed"
      ).length;
    return null;
  };

  const workspace = nav.filter((i) => i.url !== "/profile" && i.url !== "/notifications");
  const account = nav.filter((i) => i.url === "/profile" || i.url === "/notifications");

  const roles = state.users.filter((u, i, arr) => arr.findIndex((x) => x.role === u.role) === i);

  return (
    // collapsible="icon" is the mode that makes this feel like a real app shell —
    // the rail collapses to icons rather than vanishing entirely.
    <Sidebar collapsible="icon" className="border-white/10">
      <SidebarHeader className="border-b border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-transparent"
              render={<Link href="/dashboard" />}
            >
              <Image
                src="/brand/logo-mark.png"
                alt="Dhaatri"
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-lg"
              />
              <div className="grid flex-1 text-left leading-tight">
                <span className="font-onest truncate text-[15px] font-semibold tracking-[-0.3px] text-white">
                  Dhaatri
                </span>
                <span className="truncate text-[11px] text-[#95D5B2]">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7FAF93]">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                const badge = badgeFor(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      className={ITEM}
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="text-[#95D5B2]">{badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/10" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7FAF93]">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {account.map((item) => {
                const active = pathname === item.url;
                const badge = badgeFor(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      className={ITEM}
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="text-[#95D5B2]">{badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC] text-[12px] font-semibold text-[#12362A]">
                      {initials(currentUser.name)}
                    </span>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-[13px] font-medium text-white">
                        {currentUser.name}
                      </span>
                      <span className="truncate text-[11px] text-[#7FAF93]">
                        {currentUser.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-[#7FAF93]" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                align="end"
                side="right"
                className="w-64 rounded-xl"
                sideOffset={8}
              >
                {/* Base UI requires GroupLabel to live inside a Group. */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                    <Sparkles className="size-3" />
                    Prototype · switch role
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
                        {u.name.split(" ")[0]}
                      </span>
                      <span className="text-[11px] text-ink-faint">{ROLE_LABELS[u.role]}</span>
                    </span>
                      {u.id === currentUser.id ? (
                        <span className="size-1.5 rounded-full bg-[#52B788]" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2.5 text-[#B4553F]" render={<Link href="/login" />}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Drag/click edge to collapse — the affordance that was missing entirely. */}
      <SidebarRail />
    </Sidebar>
  );
}
