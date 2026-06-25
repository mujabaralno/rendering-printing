"use client";

import { useExactBinPacking } from "@/hooks/useExactBinPacking";
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
  warning: {
    fontSize: "12px",
    color: "var(--destructive)",
    backgroundColor: "color-mix(in srgb, var(--destructive) 8%, transparent)",
    border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
    borderRadius: "var(--radius)",
    padding: "12px 16px",
    marginBottom: "16px",
    lineHeight: "1.5",
  },
  badge: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    padding: "2px 8px",
    borderRadius: "var(--radius)",
    backgroundColor: "color-mix(in srgb, var(--destructive) 15%, transparent)",
    color: "var(--destructive)",
    marginLeft: "8px",
  },
  footer: {
    marginTop: "64px",
    paddingTop: "24px",
    borderTop: "1px solid var(--border)",
    fontSize: "12px",
    color: "var(--muted-foreground)",
    textAlign: "center" as const,
  },
} as const;

// ============================================================
// Page Component
// ============================================================

/**
 * Halaman Exact Algorithm — 2D Guillotine Bin Packing (NP-Hard)
 *
 * Entry point untuk pengujian algoritma Exact Backtracking.
 * - Kompleksitas eksponensial O(2^n × poly(n)).
 * - Komputasi berjalan sinkron di main thread (tanpa Web Workers).
 * - PERINGATAN: Quantity > 6 dapat membekukan browser selama menit/jam.
 */
export default function ExactAlgorithmPage() {
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
  } = useExactBinPacking();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          Exact Algorithm — 2D Guillotine Bin Packing
          <span style={styles.badge}>NP-Hard</span>
        </h1>
        <p style={styles.subtitle}>
          Recursive Backtracking · O(2ⁿ × poly(n)) · Brute-Force DFS · Main thread blocking
        </p>
      </div>

      {/* Two-column layout */}
      <div style={styles.layout}>
        {/* Left: Controls */}
        <div style={styles.controlColumn}>
          {/* Complexity Warning */}
          <div style={styles.warning}>
            ⚠ <strong>Peringatan Kompleksitas Eksponensial:</strong>
            <br />
            Algoritma ini mengeksplorasi <em>seluruh</em> ruang solusi
            (permutasi item × orientasi × strategi split).
            <br />
            • n ≤ 4 → selesai dalam detik
            <br />
            • n = 5–6 → puluhan detik hingga menit
            <br />
            • n &gt; 6 → <strong>dapat membekukan browser</strong>
            <br />
            <span style={{ marginTop: "4px", display: "inline-block" }}>
              Total item saat ini: <strong>{totalQuantity}</strong>
              {totalQuantity > 6 && (
                <span style={{ color: "var(--destructive)", fontWeight: 700 }}>
                  {" "}
                  — RISIKO FREEZE TINGGI
                </span>
              )}
            </span>
          </div>

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
              ⚠ Main thread sedang diblokir oleh komputasi eksponensial (Backtracking DFS)...
            </div>
          )}

          {/* Execution time */}
          {executionTime !== null && result && (
            <div style={styles.metrics}>
              <span>
                ⏱ Execution:{" "}
                <span style={styles.metricValue}>{executionTime}ms</span>
              </span>
              <span>
                📦 Placed:{" "}
                <span style={styles.metricValue}>
                  {result.totalItemsPlaced}/{result.totalItemsRequested}
                </span>
              </span>
              <span>
                📐 Utilization:{" "}
                <span style={styles.metricValue}>
                  {result.waste.utilizationPercentage.toFixed(1)}%
                </span>
              </span>
            </div>
          )}

          {/* Visualization */}
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

      {/* Footer */}
      <div style={styles.footer}>
        Exact Guillotine · Recursive Backtracking · O(2ⁿ) complexity ·
        Browser main thread execution
      </div>
    </div>
  );
}
