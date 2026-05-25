"use client";

import { useSSRExactBinPacking } from "@/hooks/useSSRExactBinPacking";
import { ControlPanel } from "@/components/ControlPanel";
import { LayoutVisualizer } from "@/components/LayoutVisualizer";

// ============================================================
// Styles
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
    color: "var(--primary)", // Menggunakan warna primer untuk membedakan dari CSR yang destruktif
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
  serverNotice: {
    fontSize: "11px",
    color: "var(--primary)",
    border: "1px solid var(--primary)",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "16px",
    backgroundColor: "rgba(59, 130, 246, 0.1)", // blue tint
  },
  error: {
    fontSize: "13px",
    color: "var(--destructive)",
    marginBottom: "16px",
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
 * Halaman EXACT 2D Guillotine Bin Packing — Server-Side (SSR)
 *
 * Menggunakan algoritma MURNI (Brute-Force/Recursive Backtracking) NP-Hard.
 * Komputasi ini DIDELEGASIKAN ke server (Node.js backend).
 *
 * Meskipun algoritmanya memakan waktu sangat lama (eksponensial),
 * karena dieksekusi di server, Main Thread peramban (client) TETAP BEBAS
 * dan tidak akan memunculkan "Page Unresponsive". Ini adalah inti perbandingan
 * untuk skripsi yang membuktikan keunggulan SSR dalam menangani beban berat.
 */
export default function ExactBinPackingSSRPage() {
  const {
    containerWidth,
    containerHeight,
    items,
    result,
    executionTime,
    isComputing,
    error,
    updateContainerWidth,
    updateContainerHeight,
    addItem,
    removeItem,
    updateItem,
    runPacking,
  } = useSSRExactBinPacking();

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          EXACT 2D Guillotine Bin Packing (NP-Hard) — SSR
        </h1>
        <p style={styles.subtitle}>
          Recursive Backtracking · Asynchronous Server Action · Unblocked Main Thread
        </p>
      </div>

      <div style={styles.serverNotice}>
        ℹ INFORMASI: Komputasi NP-Hard ini dieksekusi di Server (Node.js). Meskipun durasi komputasinya memakan waktu eksponensial (karena mencoba jutaan permutasi), tab peramban Anda <b>TIDAK AKAN CRASH</b> karena Main Thread tetap bebas (TBT = 0).
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
          {/* Error Message */}
          {error && <div style={styles.error}>❌ {error}</div>}

          {/* Computing indicator */}
          {isComputing && (
            <div style={styles.computing}>
              ⏳ Mengirim payload ke Server... Menunggu Server Node.js menghitung permutasi eksponensial NP-Hard... (Browser tetap responsif!)
            </div>
          )}

          {/* Execution time */}
          {executionTime !== null && result && (
            <div style={styles.metrics}>
              <span>
                ⏱ Server Execution Time + Network Roundtrip:{" "}
                <span style={styles.metricValue}>{executionTime}ms</span>
              </span>
            </div>
          )}

          {/* Visualization */}
          {result && !isComputing && (
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

      {/* Footer untuk memicu CLS saat Canvas dari server dirender */}
      <div style={styles.footer}>
        End of Document. Natural CLS baseline for Exact SSR Algorithm.
      </div>
    </div>
  );
}
