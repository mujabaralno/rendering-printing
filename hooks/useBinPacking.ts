"use client";

import { useState, useCallback } from "react";
import {
  guillotineBinPack,
  type InputItem,
  type PackingResult,
} from "@/utils/guillotineAlgorithm";

// ============================================================
// Types
// ============================================================

/** Item entry dalam form control panel */
export interface ItemEntry {
  id: string;
  width: number;
  height: number;
  quantity: number;
}

/** State lengkap yang dikelola oleh hook */
export interface BinPackingState {
  containerWidth: number;
  containerHeight: number;
  items: ItemEntry[];
  result: PackingResult | null;
  executionTime: number | null;
  isComputing: boolean;
}

// ============================================================
// Constants
// ============================================================

/** Dimensi container default (mm) */
const DEFAULT_CONTAINER_WIDTH = 650;
const DEFAULT_CONTAINER_HEIGHT = 1000;

/** Item template default untuk quick start */
const DEFAULT_ITEMS: ItemEntry[] = [
  { id: "item-1", width: 210, height: 297, quantity: 3 },
  { id: "item-2", width: 148, height: 210, quantity: 5 },
  { id: "item-3", width: 90, height: 55, quantity: 10 },
];

/** Counter untuk unique ID */
let itemIdCounter = 4;

// ============================================================
// Hook
// ============================================================

/**
 * Custom hook untuk mengelola state CSR Bin Packing stress test.
 *
 * Mengelola:
 * - Container dimensions (width × height)
 * - List of items (width, height, quantity per entry)
 * - Execution result (placed items + waste stats)
 * - Loading state & execution time measurement
 *
 * Eksekusi algoritma berjalan SINKRON di main thread
 * tanpa Web Workers — sengaja untuk stress test TBT.
 */
export function useBinPacking() {
  // Container dimensions
  const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);

  // Items list
  const [items, setItems] = useState<ItemEntry[]>(DEFAULT_ITEMS);

  // Execution results
  const [result, setResult] = useState<PackingResult | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  // ---- Container Actions ----

  const updateContainerWidth = useCallback((width: number) => {
    setContainerWidth(width);
  }, []);

  const updateContainerHeight = useCallback((height: number) => {
    setContainerHeight(height);
  }, []);

  // ---- Item Actions ----

  const addItem = useCallback(() => {
    const newItem: ItemEntry = {
      id: `item-${itemIdCounter++}`,
      width: 100,
      height: 100,
      quantity: 1,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof Omit<ItemEntry, "id">, value: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  // ---- Execution ----

  const runPacking = useCallback(() => {
    setIsComputing(true);

    // requestAnimationFrame agar React sempat commit render "Computing..."
    // sebelum main thread diblokir oleh komputasi sinkron
    requestAnimationFrame(() => {
      // Convert ItemEntry[] → InputItem[] untuk algoritma
      const inputItems: InputItem[] = items.map((entry) => ({
        width: entry.width,
        height: entry.height,
        quantity: entry.quantity,
      }));

      const start = performance.now();
      const packingResult = guillotineBinPack(
        containerWidth,
        containerHeight,
        inputItems
      );
      const end = performance.now();

      setResult(packingResult);
      setExecutionTime(Math.round(end - start));
      setIsComputing(false);
    });
  }, [containerWidth, containerHeight, items]);

  // ---- Reset ----

  const resetResults = useCallback(() => {
    setResult(null);
    setExecutionTime(null);
  }, []);

  return {
    // State
    containerWidth,
    containerHeight,
    items,
    result,
    executionTime,
    isComputing,

    // Container actions
    updateContainerWidth,
    updateContainerHeight,

    // Item actions
    addItem,
    removeItem,
    updateItem,

    // Execution
    runPacking,
    resetResults,
  };
}
