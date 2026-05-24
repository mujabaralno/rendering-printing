"use client";

import type { ItemEntry } from "@/hooks/useBinPacking";

// ============================================================
// Types
// ============================================================

interface ControlPanelProps {
  /** Dimensi container */
  containerWidth: number;
  containerHeight: number;
  onContainerWidthChange: (width: number) => void;
  onContainerHeightChange: (height: number) => void;

  /** Daftar item */
  items: ItemEntry[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (
    id: string,
    field: keyof Omit<ItemEntry, "id">,
    value: number,
  ) => void;

  /** Eksekusi */
  onRun: () => void;
  isComputing: boolean;
}

// ============================================================
// Styles — Inline object untuk zero-dependency CSS
// ============================================================

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--muted-foreground)",
    marginBottom: "4px",
  },
  row: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  label: {
    fontSize: "12px",
    color: "var(--muted-foreground)",
    minWidth: "24px",
  },
  input: {
    width: "80px",
    padding: "4px 8px",
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--foreground)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
  },
  itemRow: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    padding: "4px 0",
  },
  itemInput: {
    width: "60px",
    padding: "4px 6px",
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--foreground)",
    fontSize: "12px",
    fontFamily: "inherit",
    outline: "none",
  },
  qtyInput: {
    width: "48px",
    padding: "4px 6px",
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--foreground)",
    fontSize: "12px",
    fontFamily: "inherit",
    outline: "none",
  },
  removeBtn: {
    padding: "2px 8px",
    backgroundColor: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--destructive)",
    fontSize: "12px",
    cursor: "pointer",
  },
  addBtn: {
    padding: "4px 12px",
    backgroundColor: "transparent",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--muted-foreground)",
    fontSize: "12px",
    cursor: "pointer",
    alignSelf: "flex-start" as const,
  },
  runBtn: {
    padding: "8px 20px",
    backgroundColor: "var(--primary)",
    border: "none",
    borderRadius: "var(--radius)",
    color: "var(--primary-foreground)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    alignSelf: "flex-start" as const,
  },
  runBtnDisabled: {
    padding: "8px 20px",
    backgroundColor: "var(--muted)",
    border: "none",
    borderRadius: "var(--radius)",
    color: "var(--muted-foreground)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "not-allowed",
    fontFamily: "inherit",
    alignSelf: "flex-start" as const,
    opacity: 0.6,
  },
  separator: {
    borderTop: "1px solid var(--border)",
    margin: "4px 0",
  },
} as const;

// ============================================================
// Sub-components
// ============================================================

/** Input field untuk dimensi container */
function ContainerInputs({
  containerWidth,
  containerHeight,
  onWidthChange,
  onHeightChange,
}: {
  containerWidth: number;
  containerHeight: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={styles.sectionTitle}>Container (mm)</div>
      <div style={styles.row}>
        <span style={styles.label}>W</span>
        <input
          type="number"
          min={1}
          value={containerWidth}
          onChange={(e) => onWidthChange(Number(e.target.value) || 1)}
          style={styles.input}
          data-testid="input-width"
        />
        <span style={{ ...styles.label, marginLeft: "8px" }}>H</span>
        <input
          type="number"
          min={1}
          value={containerHeight}
          onChange={(e) => onHeightChange(Number(e.target.value) || 1)}
          style={styles.input}
          data-testid="input-height"
        />
      </div>
    </div>
  );
}

/** Satu baris item entry */
function ItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: ItemEntry;
  index: number;
  onUpdate: (
    id: string,
    field: keyof Omit<ItemEntry, "id">,
    value: number,
  ) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={styles.itemRow}>
      <span style={{ ...styles.label, minWidth: "18px", color: "#64748b" }}>
        {index + 1}.
      </span>
      <span style={{ ...styles.label, minWidth: "14px" }}>W</span>
      <input
        type="number"
        min={1}
        value={item.width}
        onChange={(e) =>
          onUpdate(item.id, "width", Number(e.target.value) || 1)
        }
        style={styles.itemInput}
      />
      <span style={{ ...styles.label, minWidth: "14px" }}>H</span>
      <input
        type="number"
        min={1}
        value={item.height}
        onChange={(e) =>
          onUpdate(item.id, "height", Number(e.target.value) || 1)
        }
        style={styles.itemInput}
      />
      <span style={{ ...styles.label, minWidth: "22px" }}>Qty</span>
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={(e) =>
          onUpdate(item.id, "quantity", Number(e.target.value) || 1)
        }
        style={styles.qtyInput}
        data-testid="input-quantity"
      />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        style={styles.removeBtn}
      >
        ×
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * Panel kontrol untuk input parameter bin packing.
 *
 * Menerima props dari useBinPacking hook:
 * - Container dimensions
 * - Items list (CRUD operations)
 * - Execution trigger
 *
 * Tombol eksekusi utama: data-testid="generate-btn"
 * (untuk otomasi Playwright)
 */
export function ControlPanel({
  containerWidth,
  containerHeight,
  onContainerWidthChange,
  onContainerHeightChange,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onRun,
  isComputing,
}: ControlPanelProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={styles.panel}>
      {/* Container Dimensions */}
      <ContainerInputs
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        onWidthChange={onContainerWidthChange}
        onHeightChange={onContainerHeightChange}
      />

      <div style={styles.separator} />

      {/* Items List */}
      <div>
        <div style={styles.sectionTitle}>
          Items ({items.length} entries · {totalItems} total)
        </div>

        {items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            index={idx}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        ))}

        <button type="button" onClick={onAddItem} style={styles.addBtn}>
          + Add Item
        </button>
      </div>

      <div style={styles.separator} />

      {/* Execute Button — data-testid untuk Playwright */}
      <button
        type="button"
        data-testid="generate-btn"
        onClick={onRun}
        disabled={isComputing || items.length === 0}
        style={
          isComputing || items.length === 0
            ? styles.runBtnDisabled
            : styles.runBtn
        }
      >
        {isComputing ? "⏳ Computing..." : "▶ Run Bin Packing"}
      </button>
    </div>
  );
}
