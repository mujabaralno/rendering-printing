"use client";

import { useBinPacking } from "@/hooks/useBinPacking";
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
} as const;

// ============================================================
// Page Component
// ============================================================

/**
 * Halaman Stress Test CSR — 2D Guillotine Bin Packing
 *
 * Entry point terisolasi untuk pengujian performa Client-Side Rendering.
 * - Semua komputasi berjalan sinkron di main thread (tanpa Web Workers).
 * - Tidak ada animasi CSS berat → menjaga CLS tetap rendah.
 * - Minimal DOM untuk pengukuran TBT yang akurat.
 */
export default function CSRStressTestPage() {
  const {
    containerWidth,
    containerHeight,
    items,
    result,
    executionTime,
    isComputing,
    updateContainerWidth,
    updateContainerHeight,
    addItem,
    removeItem,
    updateItem,
    runPacking,
  } = useBinPacking();

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          CSR Stress Test — 2D Guillotine Bin Packing
        </h1>
        <p style={styles.subtitle}>
          Synchronous computation · Main thread blocking · TBT instrumentation
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
            isComputing={isComputing}
          />
        </div>

        {/* Right: Results */}
        <div style={styles.resultColumn}>
          {/* Computing indicator */}
          {isComputing && (
            <div style={styles.computing}>
              ⚠ Main thread sedang diblokir oleh komputasi sinkron...
            </div>
          )}

          {/* Execution time */}
          {executionTime !== null && result && (
            <div style={styles.metrics}>
              <span>
                ⏱ Execution:{" "}
                <span style={styles.metricValue}>{executionTime}ms</span>
              </span>
            </div>
          )}

          {/* Visualization — fixed-dimension container for zero CLS */}
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
