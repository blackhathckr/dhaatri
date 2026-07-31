"use client";

import React from "react";
import Link from "next/link";
import { Bug, Leaf, Send, Sprout, Mountain, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  Toolbar,
  VizPips,
  toneFor,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useStore } from "@/store";
import { formatDate, formatDateRelative } from "@/lib/format";
import { getUserById } from "@/data/mock";
import type { AdvisoryType } from "@/data/types";

const KIND: Record<AdvisoryType, { icon: React.ElementType; tint: string; ink: string }> = {
  care: { icon: Sprout, tint: "bg-[#E9F5EE]", ink: "text-ink-brand" },
  growth: { icon: Leaf, tint: "bg-[#E9EDC9]", ink: "text-[#7A9E3F]" },
  soil: { icon: Mountain, tint: "bg-[#FAEDCD]", ink: "text-[#B7791F]" },
  pest: { icon: Bug, tint: "bg-[#FBDDD2]", ink: "text-[#B4553F]" },
  general: { icon: Compass, tint: "bg-[#DCEAF5]", ink: "text-[#3B7EA1]" },
};

type Filter = "All" | "Published" | "Draft";

export default function AdvisoriesPage() {
  const { state, publishAdvisory } = useStore();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [open, setOpen] = React.useState(false);

  const [siteId, setSiteId] = React.useState(state.sites[0]?.id ?? "");
  const [type, setType] = React.useState<AdvisoryType>("care");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const siteName = (id: string) => state.sites.find((s) => s.id === id)?.name ?? id;

  const published = state.advisories.filter((a) => a.status === "published");
  const drafts = state.advisories.filter((a) => a.status === "draft");

  const visible = [...state.advisories]
    .filter((a) =>
      filter === "All" ? true : filter === "Published" ? a.status === "published" : a.status === "draft"
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const canPublish = title.trim().length > 3 && content.trim().length > 10 && siteId;

  const send = () => {
    publishAdvisory({
      advisory: {
        scientistId: currentUser.id,
        siteId,
        date: new Date().toISOString().slice(0, 10),
        type,
        title: title.trim(),
        content: content.trim(),
        status: "published",
      },
    });
    setTitle("");
    setContent("");
    setOpen(false);
  };

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Scientific panel"
        title="Guidance published to the field"
        scene="canopy"
        mascot="sprout-reading"
        figures={[
          { value: state.advisories.length, unit: "advisories", note: `${drafts.length} still draft` },
          {
            value: new Set(published.map((a) => a.siteId)).size,
            unit: "sites",
            note: "carrying live guidance",
          },
        ]}
        actions={
          <Button
            onClick={() => setOpen((v) => !v)}
            className="h-10 rounded-full bg-white px-5 text-[#12362A] hover:bg-[#D8F3DC]"
          >
            <Send className="mr-1.5 size-4" />
            {open ? "Close composer" : "Write an advisory"}
          </Button>
        }
      />

      {/* ------------------------------------------------------- composer */}
      {open && (
        <Reveal>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <SectionHead
              eyebrow="New advisory"
              title="Publish guidance to a site"
              note="Publishing puts it on the site's page immediately"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">Site</label>
                <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-line">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                  Category
                </label>
                <Select value={type} onValueChange={(v) => setType((v ?? "care") as AdvisoryType)}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-line">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND) as AdvisoryType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reduce watering through the monsoon"
                className="h-11 rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-ink-strong">
                Guidance
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="What the steward or volunteer should actually do, and by when."
                className="rounded-xl border-line focus-visible:border-[#52B788] focus-visible:ring-[#52B788]/20"
              />
            </div>

            <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
              <Button
                onClick={send}
                disabled={!canPublish}
                className="h-10 rounded-full bg-[#1B4332] px-5 hover:bg-[#2D6A4F] disabled:opacity-40"
              >
                Publish to {siteName(siteId)}
              </Button>
              <span className="text-[12px] text-ink-faint">
                The site owner is notified as soon as it goes out.
              </span>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.08}>
        <StatStrip
          items={(Object.keys(KIND) as AdvisoryType[]).slice(0, 4).map((k) => {
            const of = state.advisories.filter((a) => a.type === k);
            return {
              label: k,
              value: of.length,
              note: `${of.filter((a) => a.status === "published").length} published`,
              viz: <VizPips states={of.map((a) => a.status === "published")} />,
            };
          })}
        />
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="advisoryFilterPill"
            value={filter}
            onChange={setFilter}
            options={[
              { label: "All" as Filter, count: state.advisories.length },
              { label: "Published" as Filter, count: published.length },
              { label: "Draft" as Filter, count: drafts.length },
            ]}
          />
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="On the record"
            title={`${visible.length} ${visible.length === 1 ? "advisory" : "advisories"}`}
            note="A flagged check-in raises one of these automatically"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-sleeping"
            title="Nothing here"
            body="Advisories appear when the panel publishes guidance, or when a check-in is flagged."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((a, i) => {
              const kind = KIND[a.type];
              return (
                <Reveal key={a.id} delay={0.04 * i}>
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-[#52B788]/50 hover:shadow-[0_16px_38px_-24px_rgba(4,39,24,0.45)]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${kind.tint}`}
                      >
                        <kind.icon className={`size-4 ${kind.ink}`} />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                        {a.type}
                      </span>
                      <Pill tone={toneFor(a.status)}>{a.status}</Pill>
                      <span className="ml-auto text-[12px] text-ink-ghost">
                        {formatDateRelative(a.date)}
                      </span>
                    </div>

                    <h3 className="mt-4 font-onest text-[17px] font-semibold tracking-[-0.4px] text-ink-strong">
                      {a.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[14px] leading-[23px] text-ink-soft">
                      {a.content}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-line-soft pt-3.5">
                      <Link
                        href={`/sites/${a.siteId}`}
                        className="truncate text-[13px] font-medium text-ink-brand underline-offset-4 hover:underline"
                      >
                        {siteName(a.siteId)}
                      </Link>
                      <span className="shrink-0 text-[12px] text-ink-ghost">
                        {getUserById(a.scientistId)?.name ?? "Panel"} · {formatDate(a.date)}
                      </span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
