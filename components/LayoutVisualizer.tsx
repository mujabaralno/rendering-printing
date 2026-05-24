"use client";

import type { PlacedItem, WasteStats } from "@/utils/guillotineAlgorithm";

// ============================================================
// Types
// ============================================================

interface LayoutVisualizerProps {
  /** Array of items yang sudah ditempatkan oleh algoritma */
  placements: PlacedItem[];
  /** Lebar container (unit asli, bukan pixel) */
  containerWidth: number;
  /** Tinggi container (unit asli, bukan pixel) */
  containerHeight: number;
  /** Statistik waste dari hasil packing */
  waste: WasteStats;
  /** Jumlah total item yang diminta vs ditempatkan */
  totalItemsPlaced: number;
  totalItemsRequested: number;
}

// ============================================================
// Constants
// ============================================================

/**
 * Faktor skala: unit asli (mm) → pixel.
 * Dijaga kecil agar container muat di viewport tanpa scroll horizontal.
 */
const SCALE = 0.6;

/** Palet warna — cukup banyak untuk variasi visual */
const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#a855f7", // purple-500
  "#84cc16", // lime-500
  "#e11d48", // rose-600
  "#0ea5e9", // sky-500
  "#d946ef", // fuchsia-500
  "#10b981", // emerald-500
  "#facc15", // yellow-400
] as const;

// ============================================================
// Styles
// ============================================================

const styles = {
  wrapper: {
    fontFamily: "var(--font-mono)",
  },
  statsRow: {
    display: "flex",
    gap: "20px",
    fontSize: "12px",
    color: "var(--muted-foreground)",
    marginBottom: "12px",
    flexWrap: "wrap" as const,
  },
  statValue: {
    color: "var(--foreground)",
    fontWeight: 600,
  },
  container: {
    position: "relative" as const,
    border: "1px solid var(--border)",
    backgroundColor: "var(--background)",
    overflow: "hidden",
  },
  item: {
    position: "absolute" as const,
    border: "1px solid rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box" as const,
  },
  itemLabel: {
    fontSize: "9px",
    color: "#ffffff",
    fontFamily: "inherit",
    lineHeight: 1,
    userSelect: "none" as const,
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  unplacedNotice: {
    marginTop: "8px",
    fontSize: "12px",
    color: "var(--destructive)",
  },
} as const;

// ============================================================
// Component
// ============================================================

/**
 * Komponen visualisasi murni (Dumb Component).
 *
 * Menerima Array of PlacedItems dan menggambar kotak-kotak
 * di-posisikan absolute di dalam container div.
 *
 * Dimensi container di-set secara eksplisit (width × height)
 * untuk menghindari CLS (Cumulative Layout Shift).
 *
 * data-testid="visualization-result" untuk deteksi Playwright.
 */
export function LayoutVisualizer({
  placements,
  containerWidth,
  containerHeight,
  waste,
  totalItemsPlaced,
  totalItemsRequested,
}: LayoutVisualizerProps) {
  const scaledWidth = containerWidth * SCALE;
  const scaledHeight = containerHeight * SCALE;

  const unplacedCount = totalItemsRequested - totalItemsPlaced;

  return (
    <div style={styles.wrapper} data-testid="visualization-result">
      {/* Stats bar */}
      <div style={styles.statsRow}>
        <span>
          📦 Placed:{" "}
          <span style={styles.statValue}>
            {totalItemsPlaced}/{totalItemsRequested}
          </span>
        </span>
        <span>
          📐 Utilization:{" "}
          <span style={styles.statValue}>
            {waste.utilizationPercentage.toFixed(1)}%
          </span>
        </span>
        <span>
          🗑 Waste:{" "}
          <span style={styles.statValue}>
            {waste.wastePercentage.toFixed(1)}%
          </span>
        </span>
        <span>
          📏 Waste Area:{" "}
          <span style={styles.statValue}>
            {waste.wasteArea.toLocaleString()} mm²
          </span>
        </span>
      </div>

      {/* Container visualization — fixed dimensions for zero CLS */}
      <div
        style={{
          ...styles.container,
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {placements.map((item) => (
          <div
            key={item.id}
            style={{
              ...styles.item,
              left: item.x * SCALE,
              top: item.y * SCALE,
              width: item.width * SCALE,
              height: item.height * SCALE,
              backgroundColor: COLORS[item.id % COLORS.length],
              opacity: 0.85,
            }}
          >
            <span style={styles.itemLabel}>
              {item.id}
              {item.rotated ? " ↻" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Unplaced items warning */}
      {unplacedCount > 0 && (
        <div style={styles.unplacedNotice}>
          ⚠ {unplacedCount} item(s) could not be placed within the container.
        </div>
      )}
    </div>
  );
}
