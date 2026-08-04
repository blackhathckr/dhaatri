"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Maximize2 } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MOCK_SITES } from "@/data/mock";

/* ═══════════════════════════════════════════════ geography ══════════════ */

type Box = { latMin: number; latMax: number; lngMin: number; lngMax: number };

/** The pilot locality. */
const CITY: Box = { latMin: 12.78, latMax: 13.12, lngMin: 77.45, lngMax: 77.8 };

/** Karnataka around Bengaluru — the wider frame the pilot sits inside. */
const REGION: Box = { latMin: 11.4, latMax: 15.6, lngMin: 74.0, lngMax: 78.9 };

const ZOOM = { city: 12, region: 7 } as const;

/* slippy-tile maths — the two lines every web map is built on */
const tileX = (lng: number, z: number) => ((lng + 180) / 360) * 2 ** z;
const tileY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

/**
 * A real basemap, drawn as positioned tiles.
 *
 * A map library would be ~150 KB to do exactly this: fetch a handful of raster
 * tiles and lay them out. Positioning them by percentage against the bounding
 * box means the canopy overlay lines up with the streets underneath, however
 * the container is stretched.
 */
function TileLayer({ box, zoom }: { box: Box; zoom: number }) {
  const tiles = React.useMemo(() => {
    const x0 = tileX(box.lngMin, zoom);
    const x1 = tileX(box.lngMax, zoom);
    const y0 = tileY(box.latMax, zoom);
    const y1 = tileY(box.latMin, zoom);
    const out: { x: number; y: number; l: number; t: number; w: number; h: number }[] = [];
    for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
      for (let y = Math.floor(y0); y <= Math.floor(y1); y++) {
        out.push({
          x,
          y,
          l: ((x - x0) / (x1 - x0)) * 100,
          t: ((y - y0) / (y1 - y0)) * 100,
          w: (1 / (x1 - x0)) * 100,
          h: (1 / (y1 - y0)) * 100,
        });
      }
    }
    return out;
  }, [box, zoom]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${t.x}-${t.y}`}
          src={`https://a.basemaps.cartocdn.com/light_all/${zoom}/${t.x}/${t.y}@2x.png`}
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            left: `${t.l}%`,
            top: `${t.t}%`,
            width: `${t.w}%`,
            height: `${t.h}%`,
          }}
        />
      ))}
      {/* a whisper of warmth so the grey basemap sits on cream, nothing more */}
      <div className="absolute inset-0 bg-[#F5F1EB] mix-blend-multiply opacity-25" />
    </div>
  );
}

/* ═══════════════════════════════════════════════ canopy model ══════════ */

type Anchor = { lat: number; lng: number; r: number; w: number };

/** Bengaluru's real green lungs — canopy rises around these. */
const GREEN: Anchor[] = [
  { lat: 12.8, lng: 77.577, r: 0.075, w: 1 }, // Bannerghatta forest
  { lat: 13.076, lng: 77.576, r: 0.042, w: 0.95 }, // GKVK campus
  { lat: 12.888, lng: 77.517, r: 0.042, w: 0.85 }, // Turahalli forest
  { lat: 12.9763, lng: 77.5929, r: 0.028, w: 0.9 }, // Cubbon Park
  { lat: 12.9507, lng: 77.5848, r: 0.026, w: 0.85 }, // Lalbagh
  { lat: 13.018, lng: 77.566, r: 0.028, w: 0.8 }, // IISc & Sankey
  { lat: 13.048, lng: 77.591, r: 0.03, w: 0.65 }, // Hebbal lake
  { lat: 12.926, lng: 77.668, r: 0.034, w: 0.55 }, // Bellandur lake
];

/** Dense built-up and industrial belts — canopy falls away. */
const BUILT: Anchor[] = [
  { lat: 13.028, lng: 77.52, r: 0.048, w: 1 }, // Peenya industrial
  { lat: 12.977, lng: 77.573, r: 0.032, w: 0.95 }, // Majestic & KR Market
  { lat: 12.8452, lng: 77.6602, r: 0.046, w: 0.9 }, // Electronic City
  { lat: 12.9698, lng: 77.75, r: 0.046, w: 0.85 }, // Whitefield & ITPL
  { lat: 12.9591, lng: 77.6974, r: 0.036, w: 0.8 }, // Marathahalli
  { lat: 13.023, lng: 77.554, r: 0.03, w: 0.7 }, // Yeshwanthpur
  { lat: 12.9116, lng: 77.6389, r: 0.032, w: 0.6 }, // HSR & Sarjapur road
];

/**
 * Canopy index at a point, 0–1.
 *
 * Modelled from named parks, lakes, forests and built-up belts rather than
 * randomised, so the map is stable between renders and every red patch can be
 * explained by something actually on the ground. It illustrates where cover is
 * thin; it is not a satellite measurement, and the legend says so.
 */
function canopyAt(lat: number, lng: number) {
  const pull = (a: Anchor) => {
    const d = Math.hypot(lat - a.lat, lng - a.lng);
    return a.w * Math.exp(-((d / a.r) ** 2));
  };
  const green = GREEN.reduce((s, a) => s + pull(a), 0);
  const built = BUILT.reduce((s, a) => s + pull(a), 0);
  return Math.max(0, Math.min(1, 0.4 + green * 0.42 - built * 0.34));
}

/** Seven steps from dense canopy to bare ground. */
function shade(v: number) {
  if (v >= 0.66) return "#1FA36B";
  if (v >= 0.56) return "#2D6A4F";
  if (v >= 0.47) return "#52B788";
  if (v >= 0.39) return "#7FC79B";
  if (v >= 0.32) return "#C9B87A";
  if (v >= 0.25) return "#E0A05C";
  if (v >= 0.18) return "#D9704A";
  return "#C1414A";
}

const COLS = 30;
const ROWS = 26;

type Cell = { x: number; y: number; v: number; lat: number; lng: number };

function useGrid() {
  return React.useMemo(() => {
    const cells: Cell[] = [];
    const latSpan = CITY.latMax - CITY.latMin;
    const lngSpan = CITY.lngMax - CITY.lngMin;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const lat = CITY.latMax - ((r + 0.5) / ROWS) * latSpan;
        const lng = CITY.lngMin + ((c + 0.5) / COLS) * lngSpan;
        cells.push({ x: c, y: r, lat, lng, v: canopyAt(lat, lng) });
      }
    }
    return cells;
  }, []);
}

/** Where a real coordinate lands, as a percentage of a box. */
const project = (lat: number, lng: number, box: Box) => ({
  x: ((lng - box.lngMin) / (box.lngMax - box.lngMin)) * 100,
  y: ((box.latMax - lat) / (box.latMax - box.latMin)) * 100,
});

/* ═══════════════════════════════════════════════ overlays ══════════════ */

function CanopyOverlay({
  cells,
  detail,
  strength = 0.62,
  hovered,
  onHover,
}: {
  cells: Cell[];
  detail: boolean;
  /** Kept low on purpose — the streets underneath are half the point. */
  strength?: number;
  hovered?: Cell | null;
  onHover?: (c: Cell | null) => void;
}) {
  const cw = 100 / COLS;
  const ch = 100 / ROWS;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
    >
      <g style={{ mixBlendMode: "multiply" }}>
        {cells.map((c, i) => (
          <motion.rect
            key={`${c.x}-${c.y}`}
            x={c.x * cw}
            y={c.y * ch}
            width={cw * 0.92}
            height={ch * 0.92}
            rx={0.5}
            fill={shade(c.v)}
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered === c ? 1 : strength }}
            transition={{ duration: 0.5, delay: detail ? (i % COLS) * 0.004 : 0 }}
            onMouseEnter={detail ? () => onHover?.(c) : undefined}
            onMouseLeave={detail ? () => onHover?.(null) : undefined}
            className={detail ? "cursor-crosshair" : undefined}
          />
        ))}
      </g>

      {/* Dhaatri plots — the only measured data on the plate */}
      {MOCK_SITES.map((s) => {
        const p = project(s.latitude, s.longitude, CITY);
        return (
          <g key={s.id}>
            <circle cx={p.x} cy={p.y} r="2.4" fill="#12362A" opacity="0.28">
              <animate attributeName="r" values="2;4.4;2" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={p.x}
              cy={p.y}
              r={detail ? 1.1 : 1.5}
              fill="#12362A"
              stroke="#FFFFFF"
              strokeWidth="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** The pilot box, seen from the state. */
function PilotFrame() {
  const a = project(CITY.latMax, CITY.lngMin, REGION);
  const b = project(CITY.latMin, CITY.lngMax, REGION);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <motion.rect
        x={a.x}
        y={a.y}
        width={b.x - a.x}
        height={b.y - a.y}
        rx="0.6"
        fill="#52B788"
        fillOpacity="0.22"
        stroke="#1B4332"
        strokeWidth="0.45"
        initial={{ opacity: 0, scale: 1.4 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${(a.x + b.x) / 2}% ${(a.y + b.y) / 2}%` }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      />
      <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="1.6" fill="#95D5B2" opacity="0.5">
        <animate attributeName="r" values="1.4;5;1.4" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <text
        x={(a.x + b.x) / 2}
        y={a.y - 2}
        textAnchor="middle"
        style={{ fontSize: 2.6, fill: "#12362A", fontWeight: 700, letterSpacing: 0.1,
          paintOrder: "stroke", stroke: "#FFFFFF", strokeWidth: 0.8 }}
      >
        Pilot locality
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════ the full map ══════════ */

const LEGEND = [
  { c: "#1FA36B", l: "Dense canopy" },
  { c: "#52B788", l: "Healthy" },
  { c: "#C9B87A", l: "Thin" },
  { c: "#E0A05C", l: "Sparse" },
  { c: "#C1414A", l: "Bare" },
];

function FullMap() {
  const cells = useGrid();
  const [view, setView] = React.useState<"city" | "region">("city");
  const [hovered, setHovered] = React.useState<Cell | null>(null);

  const bare = cells.filter((c) => c.v < 0.32).length;
  const barePct = Math.round((bare / cells.length) * 100);
  const avg = cells.reduce((s, c) => s + c.v, 0) / cells.length;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="relative min-w-0 flex-1">
        <div className="relative aspect-[30/26] w-full overflow-hidden rounded-2xl bg-[#EAE7E0] ring-1 ring-ink-strong/10">
          {view === "city" ? (
            <>
              <TileLayer box={CITY} zoom={ZOOM.city} />
              <CanopyOverlay cells={cells} detail hovered={hovered} onHover={setHovered} />
            </>
          ) : (
            <>
              <TileLayer box={REGION} zoom={ZOOM.region} />
              <PilotFrame />
            </>
          )}

          {/* zoom out to the state, and back */}
          <div className="absolute right-4 top-4 flex rounded-full bg-black/45 p-1 backdrop-blur-sm">
            {(["city", "region"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={
                  "relative rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors " +
                  (view === v ? "text-[#0A1F13]" : "text-white/60 hover:text-white")
                }
              >
                {view === v && (
                  <motion.span
                    layoutId="canopyView"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#95D5B2]"
                  />
                )}
                <span className="relative">{v === "city" ? "Bengaluru" : "Karnataka"}</span>
              </button>
            ))}
          </div>

          {view === "city" && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/50 px-3.5 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#95D5B2]">
                {hovered ? "Canopy here" : "Hover the grid"}
              </p>
              <p className="mt-1 font-onest text-[22px] font-semibold leading-none tracking-[-0.8px] text-white">
                {hovered ? `${Math.round(hovered.v * 100)}%` : "—"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-white/45">
                {hovered
                  ? `${hovered.lat.toFixed(3)}, ${hovered.lng.toFixed(3)}`
                  : "12.78–13.12 N · 77.45–77.80 E"}
              </p>
            </div>
          )}

          <p className="pointer-events-none absolute bottom-2.5 right-4 text-[9px] text-ink-strong/40">
            © OpenStreetMap contributors · © CARTO
          </p>
        </div>
      </div>

      {/* the reading */}
      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[290px]">
        <div className="rounded-2xl bg-[#12362A] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#95D5B2]">
            The gap
          </p>
          <p className="mt-3 font-onest text-[40px] font-semibold leading-none tracking-[-1.8px] text-white">
            {barePct}%
          </p>
          <p className="mt-2 text-[13px] leading-5 text-white/55">
            of the pilot locality sits at thin, sparse or bare cover. Every one of those
            cells is somewhere a plot could be registered.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
              Average cover
            </p>
            <p className="mt-2 font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-ink-strong">
              {Math.round(avg * 100)}%
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
              Dhaatri plots
            </p>
            <p className="mt-2 font-onest text-[24px] font-semibold leading-none tracking-[-1px] text-ink-strong">
              {MOCK_SITES.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-faint">
            Canopy
          </p>
          <div className="mt-3 space-y-2">
            {LEGEND.map((k) => (
              <span key={k.l} className="flex items-center gap-2.5 text-[12px] text-ink-soft">
                <span className="size-3 rounded-[3px]" style={{ background: k.c }} />
                {k.l}
              </span>
            ))}
            <span className="flex items-center gap-2.5 pt-1 text-[12px] text-ink-soft">
              <span className="size-3 rounded-full border-2 border-white bg-[#12362A] ring-1 ring-[#12362A]/30" />
              Registered Dhaatri plot
            </span>
          </div>
        </div>

        <Link href="/register" className="mt-auto">
          <Button className="h-11 w-full rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
            Register a space in a gap
            <ArrowUpRight className="ml-1.5 size-4" />
          </Button>
        </Link>

        <p className="text-[11px] leading-4 text-ink-ghost">
          Basemap is real. Coverage is modelled from Bengaluru&apos;s known parks, lakes,
          forests and built-up belts for the pilot — an illustration of where cover is
          thin, not a satellite measurement. Plot markers are live platform data.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ the FAB ═══════════════ */

export function CanopyFab() {
  const cells = useGrid();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 1.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7"
      >
        <button
          onClick={() => setOpen(true)}
          className="group relative block size-[200px] overflow-hidden rounded-[22px] bg-[#EAE7E0] text-left shadow-[0_20px_50px_-16px_rgba(4,39,24,0.65)] ring-1 ring-white/12 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_64px_-18px_rgba(4,39,24,0.75)] sm:size-[248px]"
        >
          <div className="absolute inset-0 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]">
            <TileLayer box={CITY} zoom={ZOOM.city} />
            <CanopyOverlay cells={cells} detail={false} strength={0.7} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F13] via-[#0A1F13]/45 to-transparent" />

          <span className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#52B788] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#52B788]" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[1px] text-white/75">
              Live canopy map
            </span>
          </span>

          <span className="absolute inset-x-4 bottom-4">
            <span className="block font-onest text-[18px] font-semibold leading-[1.12] tracking-[-0.5px] text-white sm:text-[21px]">
              Where the city
              <br />
              is still bare
            </span>
            <span className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-[#95D5B2]">
              Open the map
              <Maximize2 className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
            </span>
          </span>
        </button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-5 sm:max-w-[1120px] lg:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 pr-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#52B788]">
                Live canopy map
              </p>
              <DialogTitle className="mt-1.5 font-onest text-[24px] font-semibold tracking-[-1px] text-ink-strong lg:text-[30px]">
                Where the city is still bare
              </DialogTitle>
              <DialogDescription className="mt-1.5 max-w-[560px] text-[14px] leading-6 text-ink-soft">
                Green is canopy Bengaluru already has. Red is where it doesn&apos;t — and
                where a registered plot changes the picture fastest. Zoom out to see the
                pilot inside Karnataka.
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-line px-4 text-ink-soft max-sm:hidden"
                />
              }
            >
              Close
            </DialogClose>
          </div>

          <div className="mt-4">
            <FullMap />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
