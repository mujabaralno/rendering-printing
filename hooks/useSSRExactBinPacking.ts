"use client";

import { useState, useCallback, useTransition } from "react";
import type { ItemEntry } from "@/hooks/useBinPacking";
import { type PackingResult } from "@/utils/exactGuillotine";
import { runExactBinPackingAction } from "@/actions/exactBinPackingAction";

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
 * Custom hook untuk mengelola state Exact SSR Bin Packing.
 * Komputasi MURNI NP-Hard ini dilempar ke server menggunakan Server Action.
 */
export function useSSRExactBinPacking() {
  const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);
  const [items, setItems] = useState<ItemEntry[]>(DEFAULT_ITEMS);

  const [result, setResult] = useState<PackingResult | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // React 19: useTransition agar UI peramban tetap responsif selama server berpikir keras
  const [isPending, startTransition] = useTransition();

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
    const inputItems = items.map((entry) => ({
      width: entry.width,
      height: entry.height,
      quantity: entry.quantity,
    }));

    setError(null);
    const start = performance.now();

    // Memulai transisi untuk Server Action
    startTransition(async () => {
      try {
        const packingResult = await runExactBinPackingAction(
          containerWidth,
          containerHeight,
          inputItems
        );
        const end = performance.now();

        setResult(packingResult);
        setExecutionTime(Math.round(end - start));
      } catch (err) {
        console.error("Error during exact server action:", err);
        setError("Terjadi kesalahan saat memproses algoritma NP-Hard di server.");
        setResult(null);
        setExecutionTime(null);
      }
    });
  }, [containerWidth, containerHeight, items]);

  const resetResults = useCallback(() => {
    setResult(null);
    setExecutionTime(null);
    setError(null);
  }, []);

  return {
    containerWidth,
    containerHeight,
    items,
    result,
    executionTime,
    isComputing: isPending,
    error,
    updateContainerWidth,
    updateContainerHeight,
    addItem,
    removeItem,
    updateItem,
    runPacking,
    resetResults,
  };
}
