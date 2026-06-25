"use client";

import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import {
  guillotineBinPack,
  type PackingResult,
} from "@/utils/guillotineAlgorithm";

type ViewMode = "imposition" | "trim" | "gripper";

const MODES: {
  id: ViewMode;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "imposition",
    label: "Imposition",
    hint: "How every up is ganged onto the press sheet.",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    id: "trim",
    label: "Cut & Trim",
    hint: "Crop marks and guillotine cut lines for the bindery.",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
      </svg>
    ),
  },
  {
    id: "gripper",
    label: "Press Setup",
    hint: "Gripper edge, lay edge and color bar the press needs.",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 8h18" />
        <path d="M7 5.5h2M11 5.5h2M15 5.5h2" />
      </svg>
    ),
  },
];

// Prepress palette — the press sheet always reads as bright paper against a
// flat, theme-aware backdrop (no gradient, never pure black).
const PAPER = "#fcfbf8";
const PAPER_EDGE = "#c7bfae";
const INK = "#c2603a"; // press ink / brand terracotta
const MARK = "#1c1917"; // registration + crop marks
const GRIPPER = "#d4452f";
const BAR = ["#22b6c4", "#d94a9e", "#e8c33a", "#1c1917"]; // C M Y K control bar

export default function CanvasVisualizerCSR() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const productName =
    useQuoteStore((state) => state.productDetails.basicInfo.productName) ||
    "Untitled job";
  const opDetails = useQuoteStore(
    (state) => state.operationalDetails.paperDetails,
  );
  const sizeDetails = useQuoteStore((state) => state.productDetails.sizeDetails);
  const setOpDetails = useQuoteStore((state) => state.setOperationalDetails);

  const containerW = Number(opDetails.inputSheetWidth) || 100;
  const containerH = Number(opDetails.inputSheetHeight) || 70;

  const itemW = sizeDetails.isSameAsFlat
    ? Number(sizeDetails.flat.width) || 9
    : Number(sizeDetails.close.width) || 9;
  const itemH = sizeDetails.isSameAsFlat
    ? Number(sizeDetails.flat.height) || 5.5
    : Number(sizeDetails.close.height) || 5.5;

  const gripperMargin = 1.5;
  const printableW = containerW;
  const printableH = Math.max(0, containerH - gripperMargin);

  const requestedQuantity =
    Number(useQuoteStore.getState().productDetails.basicInfo.quantity) || 1;

  const [packResult, setPackResult] = useState<PackingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mode, setMode] = useState<ViewMode>("imposition");
  const [themeTick, setThemeTick] = useState(0);

  // Redraw the canvas when the app theme flips (light/dark).
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  // CSR: the guillotine pack runs synchronously on the browser main thread.
  useEffect(() => {
    let active = true;
    const runPack = () => {
      if (printableW > 0 && printableH > 0 && itemW > 0 && itemH > 0) {
        setIsCalculating(true);
        try {
          const result = guillotineBinPack(printableW, printableH, [
            { width: itemW, height: itemH, quantity: requestedQuantity },
          ]);
          if (active) setPackResult(result);
        } catch (error) {
          console.error("Failed to calculate bin packing:", error);
        } finally {
          if (active) setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(runPack, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [printableW, printableH, itemW, itemH, requestedQuantity]);

  // Push the recommended press-sheet count back into the store.
  useEffect(() => {
    if (!packResult) return;
    const itemsPerSheet = packResult.totalItemsPlaced;
    const totalRequestedQty =
      Number(useQuoteStore.getState().productDetails.basicInfo.quantity) || 1000;
    const rec =
      itemsPerSheet > 0 ? Math.ceil(totalRequestedQty / itemsPerSheet) : 0;

    if (
      useQuoteStore.getState().operationalDetails.paperDetails
        .recommendedSheets !== rec
    ) {
      setOpDetails({
        paperDetails: {
          ...useQuoteStore.getState().operationalDetails.paperDetails,
          recommendedSheets: rec,
        },
      });
    }
  }, [packResult, setOpDetails]);

  // ── Canvas: the imposition proof ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !packResult || isCalculating) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cw = rect.width;
    const ch = rect.height;
    ctx.clearRect(0, 0, cw, ch);

    const setAlpha = (a: number) => (ctx.globalAlpha = a);
    const reset = () => (ctx.globalAlpha = 1);

    const isDark = document.documentElement.classList.contains("dark");
    const rulerText = isDark ? "rgba(255,255,255,0.55)" : "rgba(68,64,60,0.65)";
    const rulerLine = isDark ? "rgba(255,255,255,0.28)" : "rgba(68,64,60,0.35)";

    // Leave room for the dimension rulers around the sheet.
    const pad = 44;
    const scale = Math.min(
      (cw - pad * 2) / containerW,
      (ch - pad * 2) / containerH,
    );
    const sheetW = containerW * scale;
    const sheetH = containerH * scale;
    const sx = (cw - sheetW) / 2;
    const sy = (ch - sheetH) / 2;

    // Press sheet — paper with a soft drop shadow lifting it off the backdrop.
    ctx.save();
    ctx.shadowColor = isDark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.18)";
    ctx.shadowBlur = isDark ? 24 : 16;
    ctx.shadowOffsetY = isDark ? 10 : 6;
    ctx.fillStyle = PAPER;
    ctx.fillRect(sx, sy, sheetW, sheetH);
    ctx.restore();

    ctx.strokeStyle = PAPER_EDGE;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sheetW, sheetH);

    const gripperH = gripperMargin * scale;
    const printTop = sy + gripperH;

    // Gripper edge — non-printable zone along the lead edge.
    if (mode === "gripper" || mode === "imposition") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sheetW, gripperH);
      ctx.clip();
      setAlpha(mode === "gripper" ? 0.16 : 0.08);
      ctx.fillStyle = GRIPPER;
      ctx.fillRect(sx, sy, sheetW, gripperH);
      reset();
      // diagonal hatch
      setAlpha(0.35);
      ctx.strokeStyle = GRIPPER;
      ctx.lineWidth = 1;
      for (let x = sx - sheetH; x < sx + sheetW; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, sy + gripperH);
        ctx.lineTo(x + gripperH, sy);
        ctx.stroke();
      }
      reset();
      ctx.restore();

      setAlpha(0.6);
      ctx.strokeStyle = GRIPPER;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, printTop);
      ctx.lineTo(sx + sheetW, printTop);
      ctx.stroke();
      ctx.setLineDash([]);
      reset();

      if (mode === "gripper") {
        ctx.fillStyle = GRIPPER;
        ctx.font = `600 ${Math.max(9, Math.min(12, gripperH * 0.7))}px ui-monospace, monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `GRIPPER  ${gripperMargin.toFixed(1)} cm`,
          sx + 6,
          sy + gripperH / 2,
        );
      }
    }

    // Color control bar — a strip of CMYK + spot patches along the lead edge.
    if (mode === "gripper") {
      const barY = sy + 2;
      const patch = Math.min(14, gripperH - 4);
      if (patch > 4) {
        const colors = [...BAR, INK];
        colors.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.fillRect(sx + sheetW - (colors.length - i) * (patch + 2), barY, patch, patch);
        });
      }
    }

    // Printable safe area outline (imposition mode).
    if (mode === "imposition") {
      setAlpha(0.5);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.setLineDash([7, 4]);
      const m = 3;
      ctx.strokeRect(sx + m, printTop + m, sheetW - m * 2, sheetH - gripperH - m * 2);
      ctx.setLineDash([]);
      reset();
    }

    // ── The ganged-up items ──────────────────────────────────
    packResult.placements.forEach((item, idx) => {
      const x = sx + item.x * scale;
      const y = printTop + item.y * scale;
      const w = item.width * scale;
      const h = item.height * scale;

      if (mode === "imposition") {
        setAlpha(0.16);
        ctx.fillStyle = INK;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        reset();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        const visW = item.rotated ? h : w;
        const visH = item.rotated ? w : h;
        if (visW > 30 && visH > 22) {
          ctx.save();
          ctx.translate(x + w / 2, y + h / 2);
          if (item.rotated) ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = MARK;
          ctx.font = "600 9px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const dimW = item.rotated ? item.height : item.width;
          const dimH = item.rotated ? item.width : item.height;
          setAlpha(0.85);
          ctx.fillText(`${dimW}×${dimH}`, 0, -3);
          setAlpha(0.4);
          ctx.font = "600 7px ui-monospace, monospace";
          ctx.fillText(`#${idx + 1}`, 0, 7);
          reset();
          ctx.restore();
        }
      } else if (mode === "trim") {
        // Faint piece body, then prominent crop marks like a real trim sheet.
        setAlpha(0.06);
        ctx.fillStyle = MARK;
        ctx.fillRect(x, y, w, h);
        reset();

        ctx.strokeStyle = MARK;
        ctx.lineWidth = 0.6;
        setAlpha(0.5);
        ctx.strokeRect(x, y, w, h);
        reset();

        const g = 3; // crop-mark gap
        const len = 5;
        ctx.strokeStyle = GRIPPER;
        ctx.lineWidth = 1;
        const corner = (cx: number, cy: number, dx: number, dy: number) => {
          ctx.beginPath();
          ctx.moveTo(cx + dx * g, cy);
          ctx.lineTo(cx + dx * (g + len), cy);
          ctx.moveTo(cx, cy + dy * g);
          ctx.lineTo(cx, cy + dy * (g + len));
          ctx.stroke();
        };
        corner(x, y, -1, -1);
        corner(x + w, y, 1, -1);
        corner(x, y + h, -1, 1);
        corner(x + w, y + h, 1, 1);
      } else {
        // press setup — show pieces only as a quiet ghost
        setAlpha(0.18);
        ctx.strokeStyle = MARK;
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, y, w, h);
        reset();
      }
    });

    // ── Registration targets at the sheet corners ────────────
    const drawReg = (cx: number, cy: number) => {
      const r = 6;
      ctx.strokeStyle = MARK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r - 3, cy);
      ctx.lineTo(cx + r + 3, cy);
      ctx.moveTo(cx, cy - r - 3);
      ctx.lineTo(cx, cy + r + 3);
      ctx.stroke();
    };
    if (mode !== "imposition") {
      const inset = 12;
      drawReg(sx + inset, printTop + inset);
      drawReg(sx + sheetW - inset, printTop + inset);
      drawReg(sx + inset, sy + sheetH - inset);
      drawReg(sx + sheetW - inset, sy + sheetH - inset);
    }

    // ── Dimension rulers ─────────────────────────────────────
    ctx.fillStyle = rulerText;
    ctx.strokeStyle = rulerLine;
    ctx.lineWidth = 1;
    ctx.font = "600 10px ui-monospace, monospace";

    // bottom width ruler
    const ry = sy + sheetH + 18;
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx + sheetW, ry);
    ctx.moveTo(sx, ry - 4);
    ctx.lineTo(sx, ry + 4);
    ctx.moveTo(sx + sheetW, ry - 4);
    ctx.lineTo(sx + sheetW, ry + 4);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${containerW} cm`, sx + sheetW / 2, ry + 6);

    // left height ruler
    const rx = sx - 18;
    ctx.beginPath();
    ctx.moveTo(rx, sy);
    ctx.lineTo(rx, sy + sheetH);
    ctx.moveTo(rx - 4, sy);
    ctx.lineTo(rx + 4, sy);
    ctx.moveTo(rx - 4, sy + sheetH);
    ctx.lineTo(rx + 4, sy + sheetH);
    ctx.stroke();
    ctx.save();
    ctx.translate(rx - 6, sy + sheetH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${containerH} cm`, 0, 0);
    ctx.restore();
  }, [packResult, containerW, containerH, isCalculating, mode, themeTick]);

  // ── Derived metrics ──────────────────────────────────────
  const itemsPerSheet = packResult?.totalItemsPlaced || 0;
  const totalContainerArea = containerW * containerH;
  const totalItemArea =
    packResult?.placements.reduce((s, p) => s + p.width * p.height, 0) || 0;
  const utilization =
    totalContainerArea > 0 ? (totalItemArea / totalContainerArea) * 100 : 0;
  const sheets = opDetails.recommendedSheets;
  const runOver =
    itemsPerSheet > 0 ? sheets * itemsPerSheet - requestedQuantity : 0;

  const yieldGrade =
    utilization >= 85
      ? { label: "Excellent", cls: "text-primary bg-primary/10 border-primary/30" }
      : utilization >= 65
        ? { label: "Acceptable", cls: "text-amber-600 bg-amber-500/10 border-amber-500/30" }
        : { label: "Review layout", cls: "text-destructive bg-destructive/10 border-destructive/30" };

  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
              Gang-Run Imposition
            </span>
          </div>
          <h3 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
            {productName}
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="rounded border border-border bg-muted/40 px-2 py-1">
            {itemW}×{itemH} cm trim
          </span>
          <span className="rounded border border-border bg-muted/40 px-2 py-1">
            {containerW}×{containerH} cm sheet
          </span>
        </div>
      </div>

      {/* Mode segmented control */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:w-auto">
          {MODES.map((m) => {
            const on = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={on}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
                  on
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-xs text-muted-foreground">{activeMode.hint}</p>
      </div>

      {/* Proof table — flat, theme-aware backdrop the paper sits on */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#ecebe4] shadow-sm dark:bg-[#23211c]">
        {/* corner registration ticks on the frame */}
        <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-foreground/20" />
        <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-foreground/20" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-foreground/20" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-foreground/20" />

        {/* table caption */}
        <div className="flex items-center justify-between px-5 pt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>{activeMode.label}</span>
          <span>{itemsPerSheet}-up · proof not to scale</span>
        </div>

        <div className="px-4 pb-4 pt-2">
          {isCalculating ? (
            <div className="flex h-[440px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/15">
              <svg className="h-7 w-7 animate-spin text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="font-mono text-xs text-muted-foreground">
                Running guillotine pack in your browser…
              </span>
            </div>
          ) : (
            <div className="relative h-[440px] w-full">
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-primary/70 bg-primary/20" />
          Ganged up
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-primary/70" />
          Safe area
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-[#d4452f]/70 bg-[#d4452f]/20" />
          Gripper edge
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-foreground/60" />
          Registration
        </span>
      </div>

      {/* Stats dashboard */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Pieces / Sheet"
          value={itemsPerSheet.toString()}
          sub={`${itemW}×${itemH} cm up`}
        />
        <Stat
          label="Press Sheets"
          value={sheets.toString()}
          sub={`${requestedQuantity.toLocaleString()} ordered`}
          accent
        />
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Sheet Utilization
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {utilization.toFixed(1)}
            <span className="text-sm font-medium text-muted-foreground">%</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
          <span
            className={`mt-2 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${yieldGrade.cls}`}
          >
            {yieldGrade.label}
          </span>
        </div>
        <Stat
          label="Overrun"
          value={`+${runOver.toLocaleString()}`}
          sub="spoilage buffer"
        />
      </div>

      {/* Compute provenance */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 font-mono text-[11px]">
        <span className="text-muted-foreground">
          2D Guillotine · Best Short-Side Fit
        </span>
        <span className="inline-flex items-center gap-1.5 text-primary">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Computed client-side · Browser main thread
        </span>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
