/**
 * 2D Guillotine Bin Packing Algorithm — Pure Synchronous Implementation
 *
 * Algoritma ini berjalan secara sinkron di main thread.
 * TIDAK menggunakan Web Workers, async/await, atau setTimeout.
 * Dirancang untuk mengunci Event Loop guna stress test TBT.
 *
 * Input: Dimensi Container (width, height) + Array of Items (width, height, quantity).
 * Output: Array of Placed Items (koordinat x, y, width, height) + waste calculation.
 */

// ============================================================
// Types
// ============================================================

/** Item input dari pengguna */
export interface InputItem {
  width: number;
  height: number;
  quantity: number;
}

/** Item individual setelah quantity di-expand */
export interface CutItem {
  id: number;
  width: number;
  height: number;
}

/** Hasil penempatan satu item pada container */
export interface PlacedItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

/** Area kosong yang tersedia untuk penempatan */
interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Statistik waste (sisa ruang) */
export interface WasteStats {
  totalContainerArea: number;
  totalItemArea: number;
  wasteArea: number;
  wastePercentage: number;
  utilizationPercentage: number;
}

/** Hasil akhir dari proses bin packing */
export interface PackingResult {
  placements: PlacedItem[];
  containerWidth: number;
  containerHeight: number;
  waste: WasteStats;
  totalItemsPlaced: number;
  totalItemsRequested: number;
}

// ============================================================
// Helper: Expand items by quantity
// ============================================================

/**
 * Meng-expand array InputItem menjadi array CutItem individual
 * berdasarkan quantity masing-masing item.
 */
function expandItems(items: InputItem[]): CutItem[] {
  const expanded: CutItem[] = [];
  let idCounter = 0;

  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      expanded.push({
        id: idCounter++,
        width: item.width,
        height: item.height,
      });
    }
  }

  return expanded;
}

// ============================================================
// Guillotine Best Short Side Fit (BSSF) — Core Algorithm
// ============================================================

/**
 * Mencari free rectangle terbaik menggunakan Best Short Side Fit.
 * Mengembalikan indeks free rect terbaik, atau -1 jika tidak ditemukan.
 */
function findBestBSSF(
  freeRects: FreeRectangle[],
  width: number,
  height: number
): { index: number; rotated: boolean } {
  let bestIndex = -1;
  let bestShortSide = Infinity;
  let bestLongSide = Infinity;
  let bestRotated = false;

  for (let i = 0; i < freeRects.length; i++) {
    const rect = freeRects[i];

    // Coba tanpa rotasi
    if (width <= rect.width && height <= rect.height) {
      const shortSide = Math.min(rect.width - width, rect.height - height);
      const longSide = Math.max(rect.width - width, rect.height - height);

      if (
        shortSide < bestShortSide ||
        (shortSide === bestShortSide && longSide < bestLongSide)
      ) {
        bestIndex = i;
        bestShortSide = shortSide;
        bestLongSide = longSide;
        bestRotated = false;
      }
    }

    // Coba dengan rotasi (swap width ↔ height)
    if (height <= rect.width && width <= rect.height) {
      const shortSide = Math.min(rect.width - height, rect.height - width);
      const longSide = Math.max(rect.width - height, rect.height - width);

      if (
        shortSide < bestShortSide ||
        (shortSide === bestShortSide && longSide < bestLongSide)
      ) {
        bestIndex = i;
        bestShortSide = shortSide;
        bestLongSide = longSide;
        bestRotated = true;
      }
    }
  }

  return { index: bestIndex, rotated: bestRotated };
}

// ============================================================
// Guillotine Split — Recursive Subdivision
// ============================================================

/**
 * Memotong free rectangle secara guillotine.
 * Menghasilkan hingga 2 sub-rectangle dari sisa ruang.
 *
 * Strategi: Shorter Axis Split — memotong sepanjang sumbu yang
 * menghasilkan potongan paling "persegi" untuk memaksimalkan
 * peluang penempatan item berikutnya.
 */
function splitFreeRect(
  freeRect: FreeRectangle,
  placedWidth: number,
  placedHeight: number
): FreeRectangle[] {
  const remainders: FreeRectangle[] = [];

  const rightWidth = freeRect.width - placedWidth;
  const bottomHeight = freeRect.height - placedHeight;

  // Shorter Axis Split: pilih arah split yang menghasilkan
  // sisa ruang terbesar yang tidak terfragmentasi
  if (rightWidth * freeRect.height > placedWidth * bottomHeight) {
    // Horizontal split: ruang kanan lebih besar
    // → Ruang kanan mengambil full height, bawah hanya selebar item
    if (rightWidth > 0) {
      remainders.push({
        x: freeRect.x + placedWidth,
        y: freeRect.y,
        width: rightWidth,
        height: freeRect.height,
      });
    }
    if (bottomHeight > 0) {
      remainders.push({
        x: freeRect.x,
        y: freeRect.y + placedHeight,
        width: placedWidth,
        height: bottomHeight,
      });
    }
  } else {
    // Vertical split: ruang bawah lebih besar
    // → Ruang bawah mengambil full width, kanan hanya setinggi item
    if (bottomHeight > 0) {
      remainders.push({
        x: freeRect.x,
        y: freeRect.y + placedHeight,
        width: freeRect.width,
        height: bottomHeight,
      });
    }
    if (rightWidth > 0) {
      remainders.push({
        x: freeRect.x + placedWidth,
        y: freeRect.y,
        width: rightWidth,
        height: placedHeight,
      });
    }
  }

  return remainders;
}

// ============================================================
// Rectangle Merge — Rekombinasi free rectangles
// ============================================================

/**
 * Mencoba menggabungkan free rectangles yang berdampingan
 * untuk mengurangi fragmentasi. Proses ini O(n²) per pass
 * dan sengaja CPU-intensive untuk stress test.
 */
function mergeFreeRects(freeRects: FreeRectangle[]): FreeRectangle[] {
  const merged = [...freeRects];
  for (let i = 0; i < merged.length; i++) {
    for (let j = i + 1; j < merged.length; j++) {
      const a = merged[i];
      const b = merged[j];

      // Merge horizontal: rects berdampingan secara horizontal
      if (
        a.y === b.y &&
        a.height === b.height &&
        a.x + a.width === b.x
      ) {
        merged[i] = { x: a.x, y: a.y, width: a.width + b.width, height: a.height };
        merged.splice(j, 1);
        j--;
        continue;
      }

      // Merge vertikal: rects berdampingan secara vertikal
      if (
        a.x === b.x &&
        a.width === b.width &&
        a.y + a.height === b.y
      ) {
        merged[i] = { x: a.x, y: a.y, width: a.width, height: a.height + b.height };
        merged.splice(j, 1);
        j--;
        continue;
      }
    }
  }

  return merged;
}

// ============================================================
// Stress Intensifier — Deliberate CPU Load
// ============================================================

/**
 * Komputasi intensif yang sengaja dibuat berat.
 * Nested loop dengan operasi trigonometri untuk
 * memastikan main thread blocking terukur pada TBT.
 */
function intensiveComputation(iterations: number): number {
  let accumulator = 0;
  for (let i = 0; i < iterations; i++) {
    accumulator += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    for (let j = 0; j < 100; j++) {
      accumulator += Math.atan2(i, j + 1);
    }
  }
  return accumulator;
}

// ============================================================
// Recursive Packing — Single Container
// ============================================================

/**
 * Pack items ke dalam satu container secara rekursif.
 * Setiap penempatan item memicu split rekursif pada free rectangles.
 *
 * @param freeRects - Daftar area kosong yang tersedia
 * @param items - Item-item yang belum ditempatkan
 * @param placements - Akumulator hasil penempatan (mutated)
 * @param depth - Kedalaman rekursi (untuk stress scaling)
 */
function recursivePack(
  freeRects: FreeRectangle[],
  items: CutItem[],
  placements: PlacedItem[],
  depth: number
): CutItem[] {
  if (items.length === 0) return [];

  const remaining: CutItem[] = [];

  for (const item of items) {
    const { index, rotated } = findBestBSSF(freeRects, item.width, item.height);

    if (index !== -1) {
      const chosenRect = freeRects[index];
      const placedW = rotated ? item.height : item.width;
      const placedH = rotated ? item.width : item.height;

      placements.push({
        id: item.id,
        x: chosenRect.x,
        y: chosenRect.y,
        width: placedW,
        height: placedH,
        rotated,
      });

      // Guillotine split: potong free rect dan hasilkan sub-rectangles
      const newRects = splitFreeRect(chosenRect, placedW, placedH);
      freeRects.splice(index, 1, ...newRects);

      // Merge pass setiap beberapa penempatan untuk mengurangi fragmentasi
      if (placements.length % 3 === 0) {
        const merged = mergeFreeRects(freeRects);
        freeRects.length = 0;
        freeRects.push(...merged);
      }

      // Per-item stress: semakin dalam rekursi, semakin berat
      intensiveComputation(5_000 + depth * 1_000);
    } else {
      remaining.push(item);
    }
  }

  // Rekursi: coba tempatkan item yang gagal setelah merge
  if (remaining.length > 0 && remaining.length < items.length && depth < 5) {
    const merged = mergeFreeRects(freeRects);
    freeRects.length = 0;
    freeRects.push(...merged);

    const stillRemaining = recursivePack(freeRects, remaining, placements, depth + 1);
    return stillRemaining;
  }

  return remaining;
}

// ============================================================
// Main Entry Point
// ============================================================

/**
 * Menjalankan algoritma 2D Guillotine Bin Packing secara sinkron.
 *
 * SELURUH komputasi berjalan di main thread tanpa Web Workers.
 * Semakin besar total quantity, semakin lama main thread terblokir.
 *
 * @param containerWidth  - Lebar container dalam satuan unit (mm/px)
 * @param containerHeight - Tinggi container dalam satuan unit (mm/px)
 * @param items           - Array item dengan width, height, dan quantity
 * @returns PackingResult — hasil penempatan + statistik waste
 */
export function guillotineBinPack(
  containerWidth: number,
  containerHeight: number,
  items: InputItem[]
): PackingResult {
  // Expand semua item berdasarkan quantity
  const expandedItems = expandItems(items);
  const totalItemsRequested = expandedItems.length;

  // Sort: area terbesar dulu (greedy heuristic — Decreasing Area First Fit)
  const sortedItems = [...expandedItems].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  // Inisialisasi free rectangles: satu rect penuh seluas container
  const freeRects: FreeRectangle[] = [
    { x: 0, y: 0, width: containerWidth, height: containerHeight },
  ];

  // Global stress: skala komputasi berdasarkan total item
  // n=50 → 2.5M iterasi berat
  const globalStress = totalItemsRequested * 50_000;
  intensiveComputation(globalStress);

  // Jalankan packing rekursif
  const placements: PlacedItem[] = [];
  recursivePack(freeRects, sortedItems, placements, 0);

  // Hitung waste statistics
  const totalContainerArea = containerWidth * containerHeight;
  const totalItemArea = placements.reduce(
    (sum, p) => sum + p.width * p.height,
    0
  );
  const wasteArea = totalContainerArea - totalItemArea;

  const waste: WasteStats = {
    totalContainerArea,
    totalItemArea,
    wasteArea,
    wastePercentage:
      totalContainerArea > 0 ? (wasteArea / totalContainerArea) * 100 : 0,
    utilizationPercentage:
      totalContainerArea > 0 ? (totalItemArea / totalContainerArea) * 100 : 0,
  };

  return {
    placements,
    containerWidth,
    containerHeight,
    waste,
    totalItemsPlaced: placements.length,
    totalItemsRequested,
  };
}