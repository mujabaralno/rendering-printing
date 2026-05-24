"use client";

import type { PlacedItem } from "@/lib/utils/guillotineBinPacking";

// ============================================================
// Props
// ============================================================

interface CSRLayoutVisualizerProps {
  placements: PlacedItem[];
  totalSheets: number;
  sheetWidth: number;
  sheetHeight: number;
}

// ============================================================
// Constants
// ============================================================

/** Faktor skala untuk menampilkan mm → pixel di layar */
const SCALE = 0.5;

/** Palet warna untuk membedakan item secara visual */
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#84cc16", // lime
  "#e11d48", // rose
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#10b981", // emerald
];

// ============================================================
// Component
// ============================================================

/**
 * Komponen visualisasi murni (pure presentational).
 * Menerima koordinat hasil algoritma dan merender kotak-kotak ke DOM.
 *
 * Dimensi pembungkus di-set secara eksplisit untuk mencegah CLS (Cumulative Layout Shift).
 */
export function CSRLayoutVisualizer({
  placements,
  totalSheets,
  sheetWidth,
  sheetHeight,
}: CSRLayoutVisualizerProps) {
  const scaledWidth = sheetWidth * SCALE;
  const scaledHeight = sheetHeight * SCALE;

  // Kelompokkan placements berdasarkan sheetIndex
  const sheets: PlacedItem[][] = [];
  for (let i = 0; i < totalSheets; i++) {
    sheets.push([]);
  }
  for (const placement of placements) {
    sheets[placement.sheetIndex]?.push(placement);
  }

  return (
    <div className="flex flex-col gap-6">
      {sheets.map((sheetPlacements, sheetIdx) => (
        <div key={sheetIdx}>
          <p className="text-sm text-gray-400 mb-2 font-mono">
            Sheet {sheetIdx + 1} — {sheetPlacements.length} items
          </p>

          {/* Container dengan dimensi eksplisit → zero CLS */}
          <div
            className="relative border border-gray-600 bg-gray-900"
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            {sheetPlacements.map((item) => (
              <div
                key={`${sheetIdx}-${item.id}`}
                className="absolute border border-gray-800 flex items-center justify-center"
                style={{
                  left: item.x * SCALE,
                  top: item.y * SCALE,
                  width: item.width * SCALE,
                  height: item.height * SCALE,
                  backgroundColor: COLORS[item.id % COLORS.length],
                  opacity: 0.85,
                }}
              >
                <span className="text-[10px] text-white font-mono leading-none select-none">
                  {item.id}
                  {item.rotated ? "↻" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
