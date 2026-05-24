/**
 * 2D Guillotine Bin Packing Algorithm — Pure Synchronous Implementation
 *
 * Algoritma ini berjalan secara sinkron di main thread.
 * TIDAK menggunakan Web Workers, async/await, atau setTimeout.
 * Dirancang untuk mengunci Event Loop guna stress test TBT.
 */

// ============================================================
// Types
// ============================================================

/** Dimensi sebuah item yang akan dipotong */
export interface CutItem {
  width: number;
  height: number;
  id: number;
}

/** Hasil penempatan item pada plano */
export interface PlacedItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  sheetIndex: number;
}

/** Representasi area kosong yang tersedia */
interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Hasil akhir dari proses bin packing */
export interface PackingResult {
  placements: PlacedItem[];
  totalSheets: number;
  sheetWidth: number;
  sheetHeight: number;
  utilization: number;
}

// ============================================================
// Hardcoded Material Parameters
// ============================================================

/** Ukuran plano standar (mm) */
const SHEET_WIDTH = 650;
const SHEET_HEIGHT = 1000;

/** Margin dari tepi plano (mm) */
const MARGIN = 10;

/** Area cetak efektif setelah margin */
const PRINTABLE_WIDTH = SHEET_WIDTH - 2 * MARGIN;
const PRINTABLE_HEIGHT = SHEET_HEIGHT - 2 * MARGIN;

// ============================================================
// Predefined Cut Sizes (mm) — Variasi ukuran potongan
// ============================================================

const CUT_TEMPLATES: { width: number; height: number }[] = [
  { width: 210, height: 297 }, // A4
  { width: 148, height: 210 }, // A5
  { width: 105, height: 148 }, // A6
  { width: 100, height: 200 }, // Custom banner kecil
  { width: 90, height: 55 },   // Kartu nama
  { width: 250, height: 350 }, // Custom poster kecil
  { width: 176, height: 250 }, // B5
  { width: 125, height: 176 }, // B6
  { width: 200, height: 200 }, // Persegi
  { width: 120, height: 170 }, // Custom flyer
  { width: 74, height: 105 },  // A7
  { width: 52, height: 74 },   // A8
  { width: 297, height: 420 }, // A3
  { width: 80, height: 120 },  // Custom tag
  { width: 150, height: 150 }, // Persegi kecil
];

// ============================================================
// Helper: Generate items dari parameter n
// ============================================================

function generateItems(n: number): CutItem[] {
  const items: CutItem[] = [];
  let idCounter = 0;

  for (let i = 0; i < n; i++) {
    const template = CUT_TEMPLATES[i % CUT_TEMPLATES.length];
    items.push({
      id: idCounter++,
      width: template.width,
      height: template.height,
    });
  }

  return items;
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

    // Coba dengan rotasi
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

/**
 * Memotong free rectangle secara guillotine (horizontal split).
 * Menghasilkan hingga 2 free rect baru dari sisa ruang.
 */
function splitFreeRect(
  freeRect: FreeRectangle,
  placedWidth: number,
  placedHeight: number
): FreeRectangle[] {
  const newRects: FreeRectangle[] = [];

  // Sisa di sebelah kanan item yang ditempatkan
  const rightWidth = freeRect.width - placedWidth;
  if (rightWidth > 0 && freeRect.height > 0) {
    newRects.push({
      x: freeRect.x + placedWidth,
      y: freeRect.y,
      width: rightWidth,
      height: freeRect.height,
    });
  }

  // Sisa di bawah item yang ditempatkan
  const bottomHeight = freeRect.height - placedHeight;
  if (bottomHeight > 0 && placedWidth > 0) {
    newRects.push({
      x: freeRect.x,
      y: freeRect.y + placedHeight,
      width: placedWidth,
      height: bottomHeight,
    });
  }

  return newRects;
}

/**
 * Intensifikasi komputasi: menjalankan iterasi dummy
 * untuk memastikan main thread blocking terasa signifikan.
 * Ini SENGAJA dibuat berat untuk stress test.
 */
function intensiveComputation(iterations: number): number {
  let accumulator = 0;
  for (let i = 0; i < iterations; i++) {
    accumulator += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    // Nested loop untuk memperberat
    for (let j = 0; j < 100; j++) {
      accumulator += Math.atan2(i, j + 1);
    }
  }
  return accumulator;
}

// ============================================================
// Main Packing Function
// ============================================================

/**
 * Menjalankan algoritma 2D Guillotine Bin Packing secara sinkron.
 *
 * @param n - Jumlah potongan yang akan ditempatkan
 * @returns PackingResult — hasil penempatan semua item
 */
export function runGuillotineBinPacking(n: number): PackingResult {
  const items = generateItems(n);
  const placements: PlacedItem[] = [];

  // Setiap sheet memiliki daftar free rectangles sendiri
  const sheets: FreeRectangle[][] = [
    [{ x: MARGIN, y: MARGIN, width: PRINTABLE_WIDTH, height: PRINTABLE_HEIGHT }],
  ];

  // ---- Stress intensifier: semakin banyak item, semakin berat ----
  // Skala: 50_000 iterasi per item → n=15 ≈ 750_000 iterasi berat
  const stressIterations = n * 50_000;
  intensiveComputation(stressIterations);

  // Sort items berdasarkan area terbesar dahulu (greedy heuristic)
  const sortedItems = [...items].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  for (const item of sortedItems) {
    let placed = false;

    // Coba tempatkan di sheet yang sudah ada
    for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
      const freeRects = sheets[sheetIdx];
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
          sheetIndex: sheetIdx,
        });

        // Hapus free rect yang digunakan dan tambahkan hasil split
        const newRects = splitFreeRect(chosenRect, placedW, placedH);
        freeRects.splice(index, 1, ...newRects);

        placed = true;
        break;
      }
    }

    // Jika tidak muat di sheet manapun, buat sheet baru
    if (!placed) {
      const newSheetIdx = sheets.length;
      const newFreeRects: FreeRectangle[] = [
        { x: MARGIN, y: MARGIN, width: PRINTABLE_WIDTH, height: PRINTABLE_HEIGHT },
      ];

      const { index, rotated } = findBestBSSF(newFreeRects, item.width, item.height);

      if (index !== -1) {
        const chosenRect = newFreeRects[index];
        const placedW = rotated ? item.height : item.width;
        const placedH = rotated ? item.width : item.height;

        placements.push({
          id: item.id,
          x: chosenRect.x,
          y: chosenRect.y,
          width: placedW,
          height: placedH,
          rotated,
          sheetIndex: newSheetIdx,
        });

        const newRects = splitFreeRect(chosenRect, placedW, placedH);
        newFreeRects.splice(index, 1, ...newRects);
      }

      sheets.push(newFreeRects);
    }

    // Per-item stress computation untuk memperpanjang blocking
    intensiveComputation(10_000);
  }

  // Hitung utilisasi
  const totalSheets = sheets.length;
  const totalSheetArea = totalSheets * PRINTABLE_WIDTH * PRINTABLE_HEIGHT;
  const totalItemArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  const utilization = totalSheetArea > 0 ? (totalItemArea / totalSheetArea) * 100 : 0;

  return {
    placements,
    totalSheets,
    sheetWidth: SHEET_WIDTH,
    sheetHeight: SHEET_HEIGHT,
    utilization,
  };
}
