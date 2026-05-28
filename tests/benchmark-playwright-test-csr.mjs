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

const TARGET_URL   = `http://localhost:3000${values.url}`;
const PORT         = 9222;
const ITERATIONS   = parseInt(values.iterations, 10);
const COOLDOWN_SEC = parseInt(values.cooldown, 10);

// ============================================================
// Lighthouse Throttling (Consistent across all iterations)
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
async function runSingleIteration(iterationNumber, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let pBrowser = null;

  try {
    // 1. Navigasi awal via Playwright
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // 2. Lighthouse NAVIGATION mode (untuk TTFB)
    const navResult = await lighthouse(TARGET_URL, {
      port: PORT,
      onlyCategories: ['performance'],
      output: 'json',
      throttlingMethod: 'devtools',
      throttling: customThrottling,
    });
    const navLhr = navResult.lhr;
    const ttfb = navLhr.audits['server-response-time']?.numericValue || 0;

    // 3. Re-navigate setelah Lighthouse Navigation (karena ia me-reload page)
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="input-width"]', { state: 'visible' });

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

    // 6. Mulai Lighthouse TIMESPAN mode (tanpa CPU throttling — sesuai pengujian manual)
    const timespan = await startTimespan(pPage, {
      flags: {
        port: PORT,
        throttlingMethod: 'provided',
      },
    });

    // 7. Eksekusi algoritma (klik tombol Run)
    const startTime = Date.now();
    await page.click('[data-testid="generate-btn"]');

    // 8. Tunggu visualisasi muncul (timeout 120 detik untuk N besar)
    await page.waitForSelector('[data-testid="visualization-result"]', {
      state: 'attached',
      timeout: 120_000,
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // 9. Akhiri Timespan
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    // 10. Ekstrak metrik
    const tbt = timespanLhr.audits['total-blocking-time']?.numericValue || 0;
    const cls = timespanLhr.audits['cumulative-layout-shift']?.numericValue || 0;
    const inp = timespanLhr.audits['interaction-to-next-paint']?.numericValue || 0;

    console.log(`   TTFB: ${ttfb.toFixed(2)} ms | TBT: ${tbt.toFixed(2)} ms | INP: ${inp.toFixed(2)} ms | CLS: ${cls.toFixed(4)} | Exec: ${executionTime} ms`);

    return {
      iteration: iterationNumber,
      metrics: {
        TTFB_ms: parseFloat(ttfb.toFixed(2)),
        TBT_ms: parseFloat(tbt.toFixed(2)),
        INP_ms: parseFloat(inp.toFixed(2)),
        CLS: parseFloat(cls.toFixed(4)),
        ExecutionTime_ms: executionTime,
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
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Launch browser SEKALI untuk seluruh batch
  console.log('🔄 Meluncurkan browser Chromium...\n');
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: false,
  });

  const allResults = [];
  let successCount = 0;
  let failCount = 0;

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
  const metricKeys = ['TTFB_ms', 'TBT_ms', 'INP_ms', 'CLS', 'ExecutionTime_ms'];

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
  // Format: Array of flat objects → langsung jadi tabel saat import ke Excel
  // Kolom: No | n (qty) | TTFB_ms | TBT_ms | INP_ms | CLS | ExecutionTime_ms

  const qty = parseInt(values.quantity, 10);

  // Baris data per iterasi
  const excelRows = validResults.map(r => ({
    'No':               r.iteration,
    [`n=${qty}`]:        qty,
    'TTFB_ms':          r.metrics.TTFB_ms,
    'TBT_ms':           r.metrics.TBT_ms,
    'INP_ms':           r.metrics.INP_ms,
    'CLS':              r.metrics.CLS,
    'ExecutionTime_ms': r.metrics.ExecutionTime_ms,
  }));

  // Baris ringkasan statistik (Mean & Std Dev) di bagian bawah
  excelRows.push({
    'No':               'MEAN',
    [`n=${qty}`]:        qty,
    'TTFB_ms':          stats.TTFB_ms.mean,
    'TBT_ms':           stats.TBT_ms.mean,
    'INP_ms':           stats.INP_ms.mean,
    'CLS':              stats.CLS.mean,
    'ExecutionTime_ms': stats.ExecutionTime_ms.mean,
  });

  excelRows.push({
    'No':               'STD_DEV',
    [`n=${qty}`]:        qty,
    'TTFB_ms':          stats.TTFB_ms.stdDev,
    'TBT_ms':           stats.TBT_ms.stdDev,
    'INP_ms':           stats.INP_ms.stdDev,
    'CLS':              stats.CLS.stdDev,
    'ExecutionTime_ms': stats.ExecutionTime_ms.stdDev,
  });

  excelRows.push({
    'No':               'MIN',
    [`n=${qty}`]:        qty,
    'TTFB_ms':          stats.TTFB_ms.min,
    'TBT_ms':           stats.TBT_ms.min,
    'INP_ms':           stats.INP_ms.min,
    'CLS':              stats.CLS.min,
    'ExecutionTime_ms': stats.ExecutionTime_ms.min,
  });

  excelRows.push({
    'No':               'MAX',
    [`n=${qty}`]:        qty,
    'TTFB_ms':          stats.TTFB_ms.max,
    'TBT_ms':           stats.TBT_ms.max,
    'INP_ms':           stats.INP_ms.max,
    'CLS':              stats.CLS.max,
    'ExecutionTime_ms': stats.ExecutionTime_ms.max,
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(excelRows, null, 2));
  console.log(`\n💾 Seluruh hasil batch disimpan di: ${OUTPUT_FILE}`);

  // Cleanup
  await browser.close();
  console.log('✅ Batch benchmark selesai!\n');
}

runBatchBenchmark().catch(console.error);
