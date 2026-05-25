"use server";

import {
  exactGuillotineBinPack,
  type InputItem,
  type PackingResult,
} from "@/utils/exactGuillotine";

/**
 * Server Action untuk mengeksekusi algoritma Exact 2D Guillotine secara MURNI
 * di sisi backend (Node.js/Next.js Server).
 *
 * Catatan: Karena algoritma ini berjalur eksponensial (O(2^n * poly(n))),
 * ia akan mengunci *worker thread* Node.js untuk durasi yang lama jika N > 10.
 * Namun, berbeda dengan CSR, ini tidak akan memunculkan "Page Unresponsive"
 * pada peramban, melainkan peramban hanya akan menunggu respons HTTP dari server.
 */
export async function runExactBinPackingAction(
  containerWidth: number,
  containerHeight: number,
  items: InputItem[]
): Promise<PackingResult> {
  // Mengeksekusi algoritma murni di server
  const result = exactGuillotineBinPack(containerWidth, containerHeight, items);
  
  // Mengembalikan hasil (yang akan dikirim kembali ke client sebagai JSON)
  return result;
}
