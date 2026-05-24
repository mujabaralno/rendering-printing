"use client";

import { useSSRBinPacking } from "@/hooks/useSSRBinPacking";
import { ControlPanel } from "@/components/ControlPanel";
import { LayoutVisualizer } from "@/components/LayoutVisualizer";

// ============================================================
// Styles — Minimal inline styles, no CSS animations
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    color: "var(--foreground)",
    padding: "24px",
    fontFamily: "var(--font-mono)",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--foreground)",
    margin: 0,
  },
  subtitle: {
    fontSize: "11px",
    color: "var(--muted-foreground)",
    marginTop: "4px",
  },
  layout: {
    display: "flex",
    gap: "32px",
    alignItems: "flex-start",
  },
  controlColumn: {
    flexShrink: 0,
    width: "360px",
  },
  resultColumn: {
    flex: 1,
    minWidth: 0,
  },
  metrics: {
    fontSize: "12px",
    color: "var(--muted-foreground)",
    marginBottom: "16px",
    display: "flex",
    gap: "16px",
  },
  metricValue: {
    color: "var(--foreground)",
    fontWeight: 600,
  },
  computing: {
    fontSize: "13px",
    color: "var(--primary)",
    marginBottom: "16px",
  },
  errorMsg: {
    fontSize: "13px",
    color: "var(--destructive)",
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "color-mix(in srgb, var(--destructive) 10%, transparent)",
    border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
    borderRadius: "var(--radius)",
  },
} as const;

// ============================================================
// Page Component
// ============================================================

/**
 * Halaman Stress Test SSR — 2D Guillotine Bin Packing
 *
 * Entry point terisolasi untuk pengujian performa Server-Side Rendering
 * via Next.js Server Actions.
 * - Komputasi didelegasikan ke backend Node.js.
 * - Komponen UI (ControlPanel, LayoutVisualizer) didaur ulang dari CSR.
 * - Menggunakan React 19 useTransition untuk state "pending".
 */
export default function SSRStressTestPage() {
  const {
    containerWidth,
    containerHeight,
    items,
    result,
    executionTime,
    isComputing, // Ini sekarang dikontrol oleh useTransition() (isPending)
    error,
    updateContainerWidth,
    updateContainerHeight,
    addItem,
    removeItem,
    updateItem,
    runPacking,
  } = useSSRBinPacking();

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          SSR Stress Test — 2D Guillotine Bin Packing
        </h1>
        <p style={styles.subtitle}>
          Server Action computation · Node.js thread blocking · SRT
          instrumentation
        </p>
      </div>

      {/* Two-column layout */}
      <div style={styles.layout}>
        {/* Left: Controls */}
        <div style={styles.controlColumn}>
          <ControlPanel
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            onContainerWidthChange={updateContainerWidth}
            onContainerHeightChange={updateContainerHeight}
            items={items}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            onRun={runPacking}
            isComputing={isComputing} // UI akan disable saat Server Action berjalan
          />
        </div>

        {/* Right: Results */}
        <div style={styles.resultColumn}>
          {/* Error Message */}
          {error && <div style={styles.errorMsg}>{error}</div>}

          {/* Pending / Computing indicator */}
          {isComputing && (
            <div style={styles.computing}>
              📡 Menunggu respons dari server (Server Action executing)...
            </div>
          )}

          {/* Execution time & Metrics */}
          {executionTime !== null && result && (
            <div style={styles.metrics}>
              <span>
                ⏱ Server Roundtrip Time:{" "}
                <span style={styles.metricValue}>{executionTime}ms</span>
              </span>
            </div>
          )}

          {/* Visualization — Menggunakan ulang komponen Dumb Component CSR */}
          {result && (
            <LayoutVisualizer
              placements={result.placements}
              containerWidth={result.containerWidth}
              containerHeight={result.containerHeight}
              waste={result.waste}
              totalItemsPlaced={result.totalItemsPlaced}
              totalItemsRequested={result.totalItemsRequested}
            />
          )}
        </div>
      </div>
    </div>
  );
}
