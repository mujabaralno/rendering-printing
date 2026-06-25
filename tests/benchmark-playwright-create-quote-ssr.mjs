import { chromium } from 'playwright';
import puppeteer from 'puppeteer-core';
import lighthouse, { startTimespan } from 'lighthouse/core/index.js';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// CLI Arguments
// ============================================================
const options = {
  quantity:   { type: 'string', default: '50' },
  iterations: { type: 'string', default: '30' },
  cooldown:   { type: 'string', default: '10' },
};
const { values } = parseArgs({ args: process.argv.slice(2), options });

// ============================================================
// Target: Vercel Production (SSR)
// Eksekusi beban kalkulasi BSSF didelegasikan ke infrastruktur awan Vercel.
// Aktivitas difokuskan pada ekstraksi data lonjakan waktu respons jaringan
// dan pemrosesan peladen melalui metrik Server Response Time (SRT).
// ============================================================
const TARGET_URL   = 'https://rendering-printing.vercel.app/create-quote/ssr';
const PORT         = 9222;
const ITERATIONS   = parseInt(values.iterations, 10);
const COOLDOWN_SEC = parseInt(values.cooldown, 10);

// ============================================================
// Lighthouse Throttling (devtools mode)
// Navigation: Untuk TTFB baseline
// Timespan:   Untuk TBT, INP, CLS (membuktikan H1 & H3 bahwa SSR
//             membebaskan main thread → TBT/INP rendah)
// ============================================================
const customThrottling = {
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150,
  downloadThroughputKbps: 1.6 * 1024,
  uploadThroughputKbps: 750,
  cpuSlowdownMultiplier: 4,
};

// ============================================================
// Viewport & Screen Emulation — Desktop 1920×1080
// Lighthouse default formFactor: 'mobile' → override ke desktop
// ============================================================
const VIEWPORT = { width: 1920, height: 1080 };
const desktopScreenEmulation = {
  mobile: false,
  width: VIEWPORT.width,
  height: VIEWPORT.height,
  deviceScaleFactor: 1,
  disabled: false,
};

// ============================================================
// Output Directory Setup
// ============================================================
const RESULT_DIR = path.join(process.cwd(), 'result-test');
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

const existingFiles = fs.readdirSync(RESULT_DIR);
let maxNum = 0;
existingFiles.forEach(file => {
  const match = file.match(/^pengujian-macro-ssr-(\d+)\.json$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxNum) maxNum = num;
  }
});
const nextNum = maxNum + 1;
const qty = parseInt(values.quantity, 10);
const OUTPUT_FILE = path.join(RESULT_DIR, `pengujian-macro-ssr-${nextNum}-${qty}.json`);

// ============================================================
// Helper: Sleep / Jeda antar iterasi (Thermal Throttling Control)
// ============================================================
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// ============================================================
// Single Iteration Runner
// ============================================================
async function runSingleIteration(iterationNumber, browser, isWarmup = false) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  let pBrowser = null;

  try {
    // ── Step 1: Navigasi awal ke Vercel ──
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // ── Step 2: Lighthouse NAVIGATION mode (TTFB baseline) ──
    pBrowser = await puppeteer.connect({ browserURL: `http://localhost:${PORT}` });

    const navResult = await lighthouse(TARGET_URL, {
      port: PORT,
      onlyCategories: ['performance'],
      output: 'json',
      throttlingMethod: 'devtools',
      throttling: customThrottling,
      formFactor: 'desktop',
      screenEmulation: desktopScreenEmulation,
    });
    const navLhr = navResult.lhr;
    const ttfb = navLhr.audits['server-response-time']?.numericValue || 0;

    // 2.5 Reset viewport setelah Lighthouse Navigation
    await page.setViewportSize(VIEWPORT);

    // ── Step 3: Re-navigate untuk state bersih QuoteWizard ──
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Sanity check: verifikasi viewport dan formFactor (hanya iterasi pertama)
    if (iterationNumber === 1 || iterationNumber === 'W-1') {
      console.log(`   🖥️  Viewport Playwright: ${JSON.stringify(page.viewportSize())}`);
      console.log(`   🖥️  Lighthouse formFactor: ${navLhr.configSettings.formFactor}`);
    }

    // ═══════════════════════════════════════════════════════════
    // SENYAP: PLAYWRIGHT MENGISI LANGKAH 1 → 3 (tanpa Lighthouse)
    // ═══════════════════════════════════════════════════════════

    // Langkah 1: Pilih "New Quote"
    await page.waitForSelector('text="New Quote"', { state: 'visible' });
    await page.click('button:has-text("New Quote")');

    // Langkah 2: Isi Data Pelanggan
    await page.waitForSelector('input#firstName', { state: 'visible' });
    await page.fill('input#firstName', 'Test User');
    await page.fill('input#email', 'test@example.com');
    await page.click('button:has-text("Lanjut ke Step 3")');

    // Langkah 3: Isi Basic Info Produk
    await page.waitForSelector('input#productName', { state: 'visible' });
    await page.fill('input#productName', 'Brosur Benchmark');
    await page.fill('input#quantity', values.quantity);
    
    // Pilih Sides (1 Side)
    await page.click('button[role="combobox"]:has-text("Select sides")');
    await page.click('div[role="option"]:has-text("1 Side (Single Sided)")');
    
    // Isi Flat Size
    const flatWidthInputs = page.locator('input[placeholder="0.0"]');
    await flatWidthInputs.nth(0).fill('9');   // width
    await flatWidthInputs.nth(1).fill('5.5'); // height

    // ═══════════════════════════════════════════════════════════
    // PERSIAPAN: Bridge Playwright → Puppeteer → Lighthouse Timespan
    // ═══════════════════════════════════════════════════════════
    const pages = await pBrowser.pages();
    const pPage = pages.find(p => p.url().includes('vercel.app')) || pages[0];

    // Setup SRT listener (untuk H2: Server Response Time)
    // Pada SSR, SRT diharapkan TINGGI karena komputasi didelegasikan ke Vercel
    // melalui Server Action (POST request ke /_rsc atau endpoint server action).
    let serverResponseTimeMs = 0;
    const requestPromise = new Promise(resolve => {
      const startTimes = new Map();
      let resolved = false;

      const onReq = (req) => {
        // Server Actions di Next.js menggunakan POST request
        if (req.method() === 'POST') {
          startTimes.set(req.url(), Date.now());
        }
      };

      const onRes = (res) => {
        const req = res.request();
        if (req.method() === 'POST') {
          if (startTimes.has(req.url()) && !resolved) {
            resolved = true;
            const srt = Date.now() - startTimes.get(req.url());
            page.removeListener('request', onReq);
            page.removeListener('response', onRes);
            resolve(srt);
          }
        }
      };

      page.on('request', onReq);
      page.on('response', onRes);

      // Timeout safety: jika tidak ada POST dalam 120 detik
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          page.removeListener('request', onReq);
          page.removeListener('response', onRes);
          resolve(0);
        }
      }, 120_000);
    });

    // ═══════════════════════════════════════════════════════════
    // MULAI LIGHTHOUSE TIMESPAN
    // Tepat sebelum tombol "Next" menuju Step 4 ditekan.
    // throttlingMethod: 'devtools' → perlambatan fisik via CDP.
    // SSR: Komputasi didelegasikan ke Vercel → TBT/INP rendah,
    //      SRT tinggi (waktu server memproses algoritma BSSF).
    // ═══════════════════════════════════════════════════════════
    const timespan = await startTimespan(pPage, {
      flags: {
        port: PORT,
        throttlingMethod: 'devtools',
        throttling: customThrottling,
        formFactor: 'desktop',
        screenEmulation: desktopScreenEmulation,
      },
    });

    // ═══════════════════════════════════════════════════════════
    // KLIK NEXT → MEMICU RENDER STEP 4 + SERVER ACTION (BSSF)
    // Komponen CanvasVisualizer (SSR) memanggil runBinPackingAction()
    // → Server Action → komputasi BSSF dijalankan di Vercel.
    // ═══════════════════════════════════════════════════════════
    const startTime = Date.now();
    await page.click('button:has-text("Lanjut ke Step 4")');

    // Tangkap SRT (pada SSR, POST request ke Vercel server action)
    serverResponseTimeMs = await requestPromise;

    // ═══════════════════════════════════════════════════════════
    // TUNGGU KOMPUTASI SERVER SELESAI
    // Komponen CanvasVisualizer menggunakan runBinPackingAction()
    // (Server Action) dalam useEffect dengan setTimeout(300ms).
    // Setelah server selesai, isCalculating → false, dan canvas di-render.
    // Kita tunggu sampai:
    // 1. Step 4 muncul (ada heading "Operational Details")
    // 2. Teks "Running 2D Guillotine Pack" HILANG (server selesai)
    // 3. Statistik "Items per Sheet" muncul (canvas sudah di-render)
    // ═══════════════════════════════════════════════════════════
    await page.waitForSelector('h2:has-text("Operational Details")', {
      state: 'visible',
      timeout: 120_000,
    });

    // Tunggu indikator loading hilang (server action selesai)
    await page.waitForSelector('text="Running 2D Guillotine Pack"', {
      state: 'hidden',
      timeout: 120_000,
    }).catch(() => {
      // Loading mungkin terlalu cepat / sudah hilang sebelum kita cek
    });

    // Tunggu statistik muncul (bukti canvas sudah di-render setelah komputasi)
    await page.waitForSelector('text="Items per Sheet"', {
      state: 'visible',
      timeout: 120_000,
    });

    // Tambahan: tunggu 500ms ekstra untuk memastikan canvas painting selesai
    await page.waitForTimeout(500);

    const endTime = Date.now();
    const wallClockTotal = endTime - startTime;

    // ═══════════════════════════════════════════════════════════
    // AKHIRI TIMESPAN & EKSTRAK METRIK
    // ═══════════════════════════════════════════════════════════
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    const tbt = timespanLhr.audits['total-blocking-time']?.numericValue || 0;
    const cls = timespanLhr.audits['cumulative-layout-shift']?.numericValue || 0;
    const inp = timespanLhr.audits['interaction-to-next-paint']?.numericValue || 0;

    if (!isWarmup) {
      console.log(`   TTFB: ${ttfb.toFixed(2)} ms | TBT: ${tbt.toFixed(2)} ms | INP: ${inp.toFixed(2)} ms | CLS: ${cls.toFixed(4)} | SRT: ${serverResponseTimeMs} ms | Wall: ${wallClockTotal} ms`);
    } else {
      console.log(`   [Warm-up] Selesai (Wall: ${wallClockTotal} ms)`);
    }

    return {
      iteration: iterationNumber,
      metrics: {
        TTFB_ms: parseFloat(ttfb.toFixed(2)),
        TBT_ms: parseFloat(tbt.toFixed(2)),
        INP_ms: parseFloat(inp.toFixed(2)),
        CLS: parseFloat(cls.toFixed(4)),
        SRT_ms: serverResponseTimeMs,
        WallClock_ms: wallClockTotal,
      },
    };
  } catch (error) {
    console.error(`   ❌ Iterasi ${iterationNumber} gagal: ${error.message}`);
    return {
      iteration: iterationNumber,
      metrics: null,
      error: error.message,
    };
  } finally {
    if (pBrowser) await pBrowser.disconnect();
    await context.close();
  }
}

// ============================================================
// Main: Batch Iterasi Otomatis dengan Cooldown
// ============================================================
async function runBatchBenchmark() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  BATCH BENCHMARK — Skenario Makro (QuoteWizard SSR → Vercel)   ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Target          : ${TARGET_URL}`);
  console.log(`║  Quantity (N)    : ${values.quantity}`);
  console.log(`║  Total Iterasi   : ${ITERATIONS}`);
  console.log(`║  Cooldown/Iterasi: ${COOLDOWN_SEC} detik`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Metrik (H1): TBT & INP  → Kelumpuhan Main Thread             ║');
  console.log('║  Metrik (H2): SRT        → Server Response Time               ║');
  console.log('║  Metrik (H3): CLS        → Stabilitas Tata Letak Visual       ║');
  console.log('║  Baseline   : TTFB       → Dokumen awal (Lighthouse Nav)      ║');
  console.log('║  Tambahan   : WallClock  → Total klik → visualisasi muncul    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('🔄 Meluncurkan browser Chromium...\n');
  const browser = await chromium.launch({
    args: [
      `--remote-debugging-port=${PORT}`,
      '--start-maximized',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    ],
    headless: false,
  });

  const allResults = [];
  let successCount = 0;
  let failCount = 0;

  // ============================================================
  // WARM-UP PHASE
  // ============================================================
  console.log('\n🔥 Memulai Fase Pemanasan (Warm-up)...');
  console.log('   Tujuan: Untuk menetralisir bias dari proses kompilasi Just-In-Time (JIT)');
  console.log('   pada V8 Engine, sistem melakukan 3 kali iterasi pemanasan (warm-up) yang tidak direkam.');
  for (let i = 1; i <= 3; i++) {
    console.log(`\n🔥 Warm-up ${i}/3`);
    await runSingleIteration(`W-${i}`, browser, true);
    await sleep(2); // jeda singkat antar warm-up
  }
  console.log('\n✅ Pemanasan selesai. Memulai iterasi utama...\n');

  for (let i = 1; i <= ITERATIONS; i++) {
    console.log(`\n🔁 Iterasi ${i}/${ITERATIONS}`);

    const result = await runSingleIteration(i, browser);
    allResults.push(result);

    if (result.metrics) {
      successCount++;
    } else {
      failCount++;
    }

    if (i < ITERATIONS) {
      console.log(`   ⏸  Jeda ${COOLDOWN_SEC} detik (thermal throttling control)...`);
      await sleep(COOLDOWN_SEC);
    }
  }

  // ============================================================
  // Hitung Statistik Agregat (Mean & Std Dev)
  // ============================================================
  const validResults = allResults.filter(r => r.metrics !== null);
  const metricKeys = ['TTFB_ms', 'TBT_ms', 'INP_ms', 'CLS', 'SRT_ms', 'WallClock_ms'];

  const stats = {};
  for (const key of metricKeys) {
    const vals = validResults.map(r => r.metrics[key]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    stats[key] = {
      mean: parseFloat(mean.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
    };
  }

  // ============================================================
  // Tampilkan Ringkasan di Terminal
  // ============================================================
  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              📊 RINGKASAN BATCH BENCHMARK (Makro SSR)          ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Berhasil: ${successCount}/${ITERATIONS}  |  Gagal: ${failCount}/${ITERATIONS}`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('📈 Statistik Agregat (Mean ± Std Dev):');
  console.table(
    metricKeys.map(key => ({
      Metric: key,
      Mean: `${stats[key].mean}`,
      StdDev: `± ${stats[key].stdDev}`,
      Min: `${stats[key].min}`,
      Max: `${stats[key].max}`,
    }))
  );

  // ============================================================
  // Simpan Data ke JSON (Format Flat — Excel-Ready)
  // ============================================================
  const excelRows = validResults.map(r => ({
    'No':           r.iteration,
    [`n=${qty}`]:    qty,
    'TTFB_ms':      r.metrics.TTFB_ms,
    'TBT_ms':       r.metrics.TBT_ms,
    'INP_ms':       r.metrics.INP_ms,
    'CLS':          r.metrics.CLS,
    'SRT_ms':       r.metrics.SRT_ms,
    'WallClock_ms': r.metrics.WallClock_ms,
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(excelRows, null, 2));
  console.log(`\n💾 Seluruh hasil batch disimpan di: ${OUTPUT_FILE}`);

  // Cleanup
  await browser.close();
  console.log('✅ Batch benchmark Makro SSR selesai!\n');
}

runBatchBenchmark().catch(console.error);
