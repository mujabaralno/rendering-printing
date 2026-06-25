import { useEffect, useRef } from "react";
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
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#06b6d4", "#a855f7", "#84cc16", "#e11d48",
  "#0ea5e9", "#d946ef", "#10b981", "#facc15",
] as const;

// ============================================================
// Styles
// ============================================================

const styles = {
  wrapper: {
    fontFamily: "var(--font-mono)",
    width: "100%",
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
  canvasContainer: {
    marginTop: "16px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--background)",
    display: "block",
    maxWidth: "100%",
    height: "440px",
    overflowX: "auto" as const,
  },
  unplacedNotice: {
    marginTop: "12px",
    fontSize: "12px",
    color: "var(--destructive)",
  },
} as const;

// ============================================================
// Component
// ============================================================

export function LayoutVisualizer({
  placements,
  containerWidth,
  containerHeight,
  waste,
  totalItemsPlaced,
  totalItemsRequested,
}: LayoutVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const scaledWidth = containerWidth * SCALE;
  const scaledHeight = containerHeight * SCALE;
  const unplacedCount = totalItemsRequested - totalItemsPlaced;

  // Render algoritma 2D ke dalam Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, scaledWidth, scaledHeight);
    
    // Draw background color
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    // Iterasi array item untuk digambar
    placements.forEach((item) => {
      const x = item.x * SCALE;
      const y = item.y * SCALE;
      const w = item.width * SCALE;
      const h = item.height * SCALE;

      // Fill color
      const colorIndex = Number(item.id) % COLORS.length;

      ctx.fillStyle = COLORS[colorIndex];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, w, h);

      // Stroke border
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Text Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const label = `${item.id}${item.rotated ? " ↻" : ""}`;
      
      // Shadow untuk teks agar terbaca
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 2;
      ctx.fillText(label, x + w / 2, y + h / 2);
      
      // Reset shadow untuk item berikutnya
      ctx.shadowBlur = 0;
    });

  }, [placements, scaledWidth, scaledHeight]);

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

      {/* Canvas Element (Responsive container) */}
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={scaledWidth}
          height={scaledHeight}
          style={{ display: "block" }}
        />
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
