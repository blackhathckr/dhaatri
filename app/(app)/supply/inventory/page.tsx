"use client";

import React from "react";
import { motion } from "framer-motion";
import { PackageX, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Awaiting,
  FilterPills,
  PageHero,
  Pill,
  Reveal,
  SectionHead,
  StatStrip,
  Toolbar,
  VizBars,
} from "@/components/shared/premium";
import { useAuthContext } from "@/components/shared/auth-provider";
import { useData } from "@/store";
import { formatCurrency } from "@/lib/format";
import { getUserById } from "@/data/mock";

type Filter = "All" | "Healthy" | "Low" | "Out";

/** Below a quarter of the largest line is where a supplier starts worrying. */
const level = (stock: number, ceiling: number) =>
  stock === 0 ? "Out" : stock < ceiling * 0.25 ? "Low" : "Healthy";

export default function InventoryPage() {
  const { inventory, orders, species } = useData();
  const { currentUser } = useAuthContext();

  const [filter, setFilter] = React.useState<Filter>("All");
  const [query, setQuery] = React.useState("");

  // A supplier sees their own shelves; ops sees the whole network.
  const scoped =
    currentUser.role === "supplier"
      ? inventory.filter((i) => i.supplierId === currentUser.id)
      : inventory;

  const ceiling = Math.max(...scoped.map((i) => i.stock), 1);

  const q = query.trim().toLowerCase();
  const visible = scoped.filter((i) => {
    if (filter !== "All" && level(i.stock, ceiling) !== filter) return false;
    if (!q) return true;
    return i.speciesName.toLowerCase().includes(q);
  });

  const totalStock = scoped.reduce((a, i) => a + i.stock, 0);
  const stockValue = scoped.reduce((a, i) => a + i.stock * i.unitPrice, 0);
  const lowLines = scoped.filter((i) => level(i.stock, ceiling) !== "Healthy").length;

  // Committed = units already promised to orders that haven't been delivered.
  const committed = orders
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    .flatMap((o) => o.items)
    .reduce((a, it) => a + it.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Nursery stock"
        title={lowLines ? `${lowLines} lines need restocking` : "Every line is healthy"}
        scene="plot"
        mascot={lowLines ? "sprout-thinking" : "sprout-celebrating"}
        figures={[
          { value: totalStock, unit: "saplings", note: `across ${scoped.length} species lines` },
          { value: stockValue, unit: "₹", note: "stock at unit price", decimals: 0 },
          { value: committed, unit: "committed", note: "promised to open orders" },
        ]}
      />

      <Reveal delay={0.08}>
        <StatStrip
          items={[
            {
              label: "Species lines",
              value: scoped.length,
              note: `${scoped.filter((i) => level(i.stock, ceiling) === "Healthy").length} healthy`,
              viz: <VizBars values={scoped.map((i) => i.stock)} />,
            },
            {
              label: "Fastest delivery",
              value: `${Math.min(...scoped.map((i) => i.deliveryDays), 99)} days`,
              note: "on the quickest line",
              viz: <VizBars values={scoped.map((i) => 10 - i.deliveryDays)} color="#3B7EA1" />,
            },
            {
              label: "Average price",
              value: formatCurrency(
                Math.round(scoped.reduce((a, i) => a + i.unitPrice, 0) / (scoped.length || 1))
              ),
              note: "per sapling",
              viz: <VizBars values={scoped.map((i) => i.unitPrice)} color="#B7791F" />,
            },
            {
              label: "Needs attention",
              value: lowLines,
              note: "low or out of stock",
              viz: (
                <VizBars
                  values={scoped.map((i) => (level(i.stock, ceiling) === "Healthy" ? 2 : 10))}
                  color="#B4553F"
                />
              ),
            },
          ]}
        />
      </Reveal>

      <Reveal delay={0.12}>
        <Toolbar>
          <FilterPills
            layoutId="inventoryFilterPill"
            value={filter}
            onChange={setFilter}
            options={(["All", "Healthy", "Low", "Out"] as Filter[]).map((f) => ({
              label: f,
              count:
                f === "All"
                  ? scoped.length
                  : scoped.filter((i) => level(i.stock, ceiling) === f).length,
            }))}
          />
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search species…"
              className="h-10 rounded-full border-line bg-surface-2 pl-9 text-[14px]"
            />
          </div>
        </Toolbar>
      </Reveal>

      <section>
        <Reveal delay={0.16}>
          <SectionHead
            eyebrow="On the shelves"
            title={`${visible.length} species ${visible.length === 1 ? "line" : "lines"}`}
            note="Bar length is stock relative to the largest line held"
          />
        </Reveal>

        {visible.length === 0 ? (
          <Awaiting
            pose="sprout-thinking"
            title="Nothing matches"
            body="Try another stock level, or clear the search to see every line."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {visible.map((item, i) => {
              const lvl = level(item.stock, ceiling);
              const ref = species.find((s) => s.id === item.speciesId);
              return (
                <Reveal key={`${item.supplierId}-${item.speciesId}`} delay={0.03 * i}>
                  <div className="flex flex-col gap-4 border-b border-line-soft p-5 transition-colors last:border-b-0 hover:bg-surface-2 lg:flex-row lg:items-center">
                    <div className="min-w-0 lg:w-56">
                      <div className="flex items-center gap-2.5">
                        <p className="truncate font-onest text-[16px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {item.speciesName}
                        </p>
                        <Pill
                          tone={lvl === "Healthy" ? "green" : lvl === "Low" ? "amber" : "red"}
                        >
                          {lvl}
                        </Pill>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] italic text-ink-ghost">
                        {ref?.scientificName ?? "—"}
                      </p>
                    </div>

                    {/* stock as a bar, because "200" means nothing without a scale */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12px] text-ink-faint">Stock</span>
                        <span className="font-onest text-[15px] font-semibold tracking-[-0.3px] text-ink-strong">
                          {item.stock.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-track">
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.stock / ceiling) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.03 * i }}
                          style={{
                            background:
                              lvl === "Healthy" ? "#52B788" : lvl === "Low" ? "#B7791F" : "#B4553F",
                          }}
                          className="block h-full rounded-full"
                        />
                      </span>
                    </div>

                    <div className="flex shrink-0 gap-6 lg:gap-8">
                      <div className="w-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Unit
                        </p>
                        <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="w-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Min order
                        </p>
                        <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                          {item.minOrder}
                        </p>
                      </div>
                      <div className="w-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[1px] text-ink-faint">
                          Lead time
                        </p>
                        <p className="mt-1.5 font-onest text-[17px] font-semibold leading-none tracking-[-0.5px] text-ink-strong">
                          {item.deliveryDays}d
                        </p>
                      </div>
                    </div>

                    {currentUser.role !== "supplier" && (
                      <p className="shrink-0 text-[12px] text-ink-ghost lg:w-36 lg:text-right">
                        {getUserById(item.supplierId)?.name ?? item.supplierId}
                      </p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {lowLines > 0 && (
        <Reveal delay={0.2}>
          <div className="flex items-start gap-3 rounded-2xl border border-[#E8B4A6] bg-[#FBDDD2]/40 px-5 py-4">
            <PackageX className="mt-0.5 size-4 shrink-0 text-[#B4553F]" />
            <p className="text-[13px] leading-5 text-[#8B4A38]">
              {lowLines} {lowLines === 1 ? "line is" : "lines are"} low or out of stock. Orders
              placed against them will still be accepted, but the delivery date will slip past
              the quoted lead time.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
