"use client";

import { useState, useCallback } from "react";
import {
  exactGuillotineBinPack,
  type InputItem,
  type PackingResult,
} from "@/utils/exactGuillotine";
import type { ItemEntry } from "@/hooks/useBinPacking"; // Reuse type from CSR hook

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONTAINER_WIDTH = 650;
const DEFAULT_CONTAINER_HEIGHT = 1000;

const DEFAULT_ITEMS: ItemEntry[] = [
  { id: "item-1", width: 210, height: 297, quantity: 3 },
];

let itemIdCounter = 2;

// ============================================================
// Hook
// ============================================================

/**
 * Custom hook untuk mengelola state Exact Bin Packing.
 * Komputasi berjalan secara SINKRON untuk memicu TBT.
 */
export function useExactBinPacking() {
  const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);
  const [items, setItems] = useState<ItemEntry[]>(DEFAULT_ITEMS);

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

    requestAnimationFrame(() => {
      const inputItems: InputItem[] = items.map((entry) => ({
        width: entry.width,
        height: entry.height,
        quantity: entry.quantity,
      }));

      const start = performance.now();
      
      // Execute the NP-Hard exact algorithm
      const packingResult = exactGuillotineBinPack(
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

  const resetResults = useCallback(() => {
    setResult(null);
    setExecutionTime(null);
  }, []);

  return {
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
    resetResults,
  };
}
