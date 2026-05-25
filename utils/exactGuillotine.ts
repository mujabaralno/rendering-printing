export interface InputItem {
  width: number;
  height: number;
  quantity: number;
}

export interface CutItem {
  id: number;
  width: number;
  height: number;
}

export interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface WasteStats {
  totalContainerArea: number;
  totalItemArea: number;
  wasteArea: number;
  wastePercentage: number;
  utilizationPercentage: number;
}

export interface PackingResult {
  placements: PlacedItem[];
  containerWidth: number;
  containerHeight: number;
  waste: WasteStats;
  totalItemsPlaced: number;
  totalItemsRequested: number;
}

/**
 * Expand grouped items into individual items based on quantity.
 */
function expandItems(items: InputItem[]): CutItem[] {
  const expanded: CutItem[] = [];
  let idCounter = 0;
  for (const group of items) {
    for (let i = 0; i < group.quantity; i++) {
      expanded.push({
        id: idCounter++,
        width: group.width,
        height: group.height,
      });
    }
  }
  return expanded;
}

/**
 * Split strategy enum
 */
enum SplitStrategy {
  HORIZONTAL_FIRST,
  VERTICAL_FIRST,
}

/**
 * Memotong sisa ruang (FreeRectangle) menjadi dua persegi panjang
 * menggunakan teknik Guillotine Split.
 */
function guillotineSplit(
  freeRect: FreeRectangle,
  placedWidth: number,
  placedHeight: number,
  strategy: SplitStrategy
): FreeRectangle[] {
  const remainders: FreeRectangle[] = [];
  const rightWidth = freeRect.width - placedWidth;
  const bottomHeight = freeRect.height - placedHeight;

  if (strategy === SplitStrategy.HORIZONTAL_FIRST) {
    // Potong horizontal sepanjang garis bawah item
    if (rightWidth > 0) {
      remainders.push({
        x: freeRect.x + placedWidth,
        y: freeRect.y,
        width: rightWidth,
        height: placedHeight, // terpotong sebatas tinggi item
      });
    }
    if (bottomHeight > 0) {
      remainders.push({
        x: freeRect.x,
        y: freeRect.y + placedHeight,
        width: freeRect.width, // mengambil lebar penuh container sisa
        height: bottomHeight,
      });
    }
  } else {
    // Potong vertikal sepanjang garis kanan item
    if (rightWidth > 0) {
      remainders.push({
        x: freeRect.x + placedWidth,
        y: freeRect.y,
        width: rightWidth,
        height: freeRect.height, // mengambil tinggi penuh container sisa
      });
    }
    if (bottomHeight > 0) {
      remainders.push({
        x: freeRect.x,
        y: freeRect.y + placedHeight,
        width: placedWidth, // terpotong sebatas lebar item
        height: bottomHeight,
      });
    }
  }

  return remainders;
}

// ============================================================
// Core NP-Hard Exact Algorithm (Recursive Backtracking)
// ============================================================

/**
 * Fungsi algoritma Brute-Force / Backtracking MURNI.
 * Kompleksitas: O(2^n * poly(n)).
 * Secara alamiah akan memblokir main thread jika jumlah item besar.
 */
export function exactGuillotineBinPack(
  containerWidth: number,
  containerHeight: number,
  items: InputItem[]
): PackingResult {
  const expandedItems = expandItems(items);
  const totalItemsRequested = expandedItems.length;
  
  const initialFreeRects: FreeRectangle[] = [
    { x: 0, y: 0, width: containerWidth, height: containerHeight },
  ];

  let bestPlacements: PlacedItem[] = [];
  let maxAreaPlaced = -1;

  /**
   * Backtracking DFS.
   * @param currentFreeRects - Daftar ruang kosong saat ini
   * @param remainingItems - Daftar item yang belum dicoba
   * @param currentPlacements - Sejarah penempatan di cabang ini
   * @param currentArea - Total area yang sudah berhasil ditempatkan
   */
  function backtrack(
    currentFreeRects: FreeRectangle[],
    remainingItems: CutItem[],
    currentPlacements: PlacedItem[],
    currentArea: number
  ) {
    // Update best known configuration
    if (currentArea > maxAreaPlaced) {
      maxAreaPlaced = currentArea;
      bestPlacements = [...currentPlacements];
    }

    // Base case / Pruning: jika semua item berhasil diletakkan, 
    // kita bisa berhenti di cabang ini. Namun karena kita tidak stop early (full DFS),
    // ini akan benar-benar mencari solusi paling sempurna, sangat compute-heavy.
    if (remainingItems.length === 0) {
      return;
    }

    // Coba setiap item yang belum ditempatkan
    for (let i = 0; i < remainingItems.length; i++) {
      const item = remainingItems[i];
      const nextRemaining = [
        ...remainingItems.slice(0, i),
        ...remainingItems.slice(i + 1),
      ];

      // Coba masukkan ke dalam setiap free rectangle yang tersedia
      for (let j = 0; j < currentFreeRects.length; j++) {
        const rect = currentFreeRects[j];

        // Coba 2 orientasi rotasi
        const orientations = [
          { w: item.width, h: item.height, rotated: false },
          { w: item.height, h: item.width, rotated: true },
        ];

        // Jika bentuk persegi, rotasi tidak mengubah apa-apa (optimasi kecil)
        if (item.width === item.height) {
          orientations.pop();
        }

        for (const ori of orientations) {
          if (ori.w <= rect.width && ori.h <= rect.height) {
            // Item muat di ruang kosong ini!
            
            // Rekam penempatan
            const placement: PlacedItem = {
              id: item.id,
              x: rect.x,
              y: rect.y,
              width: ori.w,
              height: ori.h,
              rotated: ori.rotated,
            };

            const newPlacements = [...currentPlacements, placement];
            const newArea = currentArea + (ori.w * ori.h);

            // Karena ini Guillotine Cut, ada 2 cara memotong sisa ruang berbentuk 'L'
            const strategies = [SplitStrategy.HORIZONTAL_FIRST, SplitStrategy.VERTICAL_FIRST];
            
            for (const strat of strategies) {
              const newSubRects = guillotineSplit(rect, ori.w, ori.h, strat);
              
              const newFreeRects = [
                ...currentFreeRects.slice(0, j),
                ...currentFreeRects.slice(j + 1),
                ...newSubRects,
              ];

              // REKURSI MENDALAM (Branching eksponensial)
              backtrack(newFreeRects, nextRemaining, newPlacements, newArea);
            }
          }
        }
      }
    }
  }

  // Mulai brute-force DFS
  backtrack(initialFreeRects, expandedItems, [], 0);

  // Kalkulasi statistik akhir
  const totalContainerArea = containerWidth * containerHeight;
  const wasteArea = totalContainerArea - maxAreaPlaced;

  const waste: WasteStats = {
    totalContainerArea,
    totalItemArea: maxAreaPlaced,
    wasteArea,
    wastePercentage: totalContainerArea > 0 ? (wasteArea / totalContainerArea) * 100 : 0,
    utilizationPercentage: totalContainerArea > 0 ? (maxAreaPlaced / totalContainerArea) * 100 : 0,
  };

  return {
    placements: bestPlacements,
    containerWidth,
    containerHeight,
    waste,
    totalItemsPlaced: bestPlacements.length,
    totalItemsRequested,
  };
}
