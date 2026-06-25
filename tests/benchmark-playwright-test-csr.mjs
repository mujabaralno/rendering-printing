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
  width:      { type: 'string', default: '1000' },
  height:     { type: 'string', default: '1000' },
  quantity:   { type: 'string', default: '50' },
  url:        { type: 'string', default: '/csr' },
  iterations: { type: 'string', default: '30' },
  cooldown:   { type: 'string', default: '10' },
};
const { values } = parseArgs({ args: process.argv.slice(2), options });

const TARGET_URL   = `${values.url}`;
const PORT         = 9222;
const ITERATIONS   = parseInt(values.iterations, 10);
const COOLDOWN_SEC = parseInt(values.cooldown, 10);

// ============================================================
// Lighthouse Throttling (devtools mode)
// Navigation: Untuk TTFB baseline
// Timespan:   Untuk TBT, INP, CLS (membuktikan H1 & H3 bahwa CSR
//             memblokir main thread → TBT/INP tinggi)
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

// Menentukan nomor urut file
const existingFiles = fs.readdirSync(RESULT_DIR);
let maxNum = 0;
existingFiles.forEach(file => {
  const match = file.match(/^pengujian-csr-(\d+)\.json$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxNum) maxNum = num;
  }
});
const nextNum = maxNum + 1;
const OUTPUT_FILE = path.join(RESULT_DIR, `pengujian-csr-${nextNum}-${values.quantity}.json`);

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
    // 1. Navigasi awal via Playwright
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. Lighthouse NAVIGATION mode (untuk TTFB) — formFactor: desktop
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

    // 3. Re-navigate setelah Lighthouse Navigation (karena ia me-reload page)
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="input-width"]', { state: 'visible' });

    // Sanity check: verifikasi viewport dan formFactor (hanya iterasi pertama)
    if (iterationNumber === 1 || iterationNumber === 'W-1') {
      console.log(`   🖥️  Viewport Playwright: ${JSON.stringify(page.viewportSize())}`);
      console.log(`   🖥️  Lighthouse formFactor: ${navLhr.configSettings.formFactor}`);
    }

    // 4. Isi Form dengan Playwright
    await page.locator('[data-testid="input-width"]').fill(values.width);
    await page.locator('[data-testid="input-height"]').fill(values.height);

    // Hapus baris item ekstra agar total N murni sesuai --quantity
    const removeBtns = page.locator('[data-testid="remove-item-btn"]');
    const count = await removeBtns.count();
    for (let i = 1; i < count; i++) {
      await removeBtns.nth(1).click();
    }

    await page.locator('[data-testid="input-quantity"]').first().fill(values.quantity);

    // 5. Bridge Playwright → Puppeteer → Lighthouse
    const browserURL = `http://localhost:${PORT}`;
    pBrowser = await puppeteer.connect({ browserURL });
    const pages = await pBrowser.pages();
    const pPage = pages.find(p => p.url().includes('localhost:3000')) || pages[0];

    // 6. Setup SRT listener (untuk H2: Server Response Time)
    // Pada CSR, SRT diharapkan ~0 ms karena tidak ada panggilan ke server.
    let serverResponseTimeMs = 0;
    const requestPromise = new Promise(resolve => {
      const startTimes = new Map();
      let resolved = false;

      const onReq = (req) => {
        if (req.method() === 'POST' || req.isNavigationRequest()) {
          startTimes.set(req.url(), Date.now());
        }
      };

      const onRes = (res) => {
        const req = res.request();
        if (req.method() === 'POST' || req.isNavigationRequest()) {
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

      // Fallback: CSR mungkin TIDAK melakukan POST sama sekali → resolve 0
      setTimeout(() => { if (!resolved) { resolved = true; resolve(0); } }, 5_000);
    });

    // 7. Mulai Lighthouse TIMESPAN mode (devtools throttling, desktop)
    const timespan = await startTimespan(pPage, {
      flags: {
        port: PORT,
        throttlingMethod: 'devtools',
        throttling: customThrottling,
        formFactor: 'desktop',
        screenEmulation: desktopScreenEmulation,
      },
    });

    // 8. Eksekusi algoritma (klik tombol Run)
    const startTime = Date.now();
    await page.click('[data-testid="generate-btn"]');

    // Tangkap SRT (akan resolve 0 pada CSR karena tidak ada POST)
    serverResponseTimeMs = await requestPromise;

    // 9. Tunggu visualisasi muncul (timeout 120 detik untuk N besar)
    await page.waitForSelector('[data-testid="visualization-result"]', {
      state: 'attached',
      timeout: 120_000,
    });

    const endTime = Date.now();
    const wallClockTotal = endTime - startTime;

    // 10. Akhiri Timespan
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    // 10. Ekstrak metrik
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
// Main: 30 Iterasi Otomatis dengan Cooldown
// ============================================================
async function runBatchBenchmark() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  BATCH BENCHMARK — Skenario Mikro (Uji Isolasi CSR)    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  URL Target      : ${TARGET_URL}`);
  console.log(`║  Container       : ${values.width} x ${values.height}`);
  console.log(`║  Quantity (N)    : ${values.quantity}`);
  console.log(`║  Total Iterasi   : ${ITERATIONS}`);
  console.log(`║  Cooldown/Iterasi: ${COOLDOWN_SEC} detik`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Metrik (H1): TBT & INP  → Kelumpuhan Main Thread      ║');
  console.log('║  Metrik (H2): SRT        → Server Response Time         ║');
  console.log('║  Metrik (H3): CLS        → Stabilitas Tata Letak Visual ║');
  console.log('║  Baseline   : TTFB       → Dokumen awal (Lighthouse)    ║');
  console.log('║  Tambahan   : WallClock  → Total klik → visualisasi     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Launch browser SEKALI untuk seluruh batch
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

    // Jeda antar iterasi (kecuali iterasi terakhir)
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
    const values = validResults.map(r => r.metrics[key]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

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
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              📊 RINGKASAN BATCH BENCHMARK               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Berhasil: ${successCount}/${ITERATIONS}  |  Gagal: ${failCount}/${ITERATIONS}`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

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
  const qty = parseInt(values.quantity, 10);

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
  console.log('✅ Batch benchmark selesai!\n');
}

runBatchBenchmark().catch(console.error);
