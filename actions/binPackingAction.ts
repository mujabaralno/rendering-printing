"use server";

import {
  guillotineBinPack,
  type InputItem,
  type PackingResult,
} from "@/utils/guillotineAlgorithm";

/**
 * @param containerWidth Lebar container (mm)
 * @param containerHeight Tinggi container (mm)
 * @param items Array dari item yang akan dikemas
 * @returns PackingResult Hasil komputasi dan penempatan
 */
export async function runBinPackingAction(
  containerWidth: number,
  containerHeight: number,
  items: InputItem[]
): Promise<PackingResult> {
  // Panggil algoritma secara sinkron di server.
  // Karena ini Server Action, eksekusi ini akan memblokir thread pekerja Node.js
  // (atau Edge function worker), bukan main thread browser klien.
  const result = guillotineBinPack(containerWidth, containerHeight, items);

  return result;
}
