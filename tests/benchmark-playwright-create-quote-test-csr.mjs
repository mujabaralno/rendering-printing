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
  url:        { type: 'string', default: '/create-quote/csr' },
  iterations: { type: 'string', default: '30' },
  cooldown:   { type: 'string', default: '10' },
};
const { values } = parseArgs({ args: process.argv.slice(2), options });

const TARGET_URL   = `http://localhost:3000${values.url}`;
const PORT         = 9222;
const ITERATIONS   = parseInt(values.iterations, 10);
const COOLDOWN_SEC = parseInt(values.cooldown, 10);

// ============================================================
// Lighthouse Throttling (Skenario Makro - DevTools Throttling)
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

const existingFiles = fs.readdirSync(RESULT_DIR);
let maxNum = 0;
existingFiles.forEach(file => {
  const match = file.match(/^pengujian-macro-csr-(\d+)\.csv$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxNum) maxNum = num;
  }
});
const nextNum = maxNum + 1;
const OUTPUT_FILE = path.join(RESULT_DIR, `pengujian-macro-csr-${nextNum}-${values.quantity}.csv`);

// ============================================================
// Helper: Sleep
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

    // 2. Lighthouse NAVIGATION mode (untuk TTFB awal)
    const navResult = await lighthouse(TARGET_URL, {
      port: PORT,
      onlyCategories: ['performance'],
      output: 'json',
      throttlingMethod: 'devtools',
      throttling: customThrottling,
    });
    const navLhr = navResult.lhr;
    const ttfb = navLhr.audits['server-response-time']?.numericValue || 0;

    // 3. Re-navigate untuk state bersih QuoteWizard
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // --- SENYAP: PLAYWRIGHT MENGISI LANGKAH 1 HINGGA 3 ---
    
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
    
    // Isi Flat Size (biar aman dan realistis)
    const flatWidthInputs = page.locator('input[placeholder="0.0"]');
    await flatWidthInputs.nth(0).fill('9'); // width
    await flatWidthInputs.nth(1).fill('5.5'); // height

    // --- PERSIAPAN TIMESPAN SEBELUM LANJUT KE LANGKAH 4 ---
    const browserURL = `http://localhost:${PORT}`;
    pBrowser = await puppeteer.connect({ browserURL });
    const pages = await pBrowser.pages();
    const pPage = pages.find(p => p.url().includes('localhost:3000')) || pages[0];

    // Mulai Lighthouse TIMESPAN mode (throttling devtools fisik diaktifkan)
    const timespan = await startTimespan(pPage, {
      flags: {
        port: PORT,
        throttling: customThrottling,
        throttlingMethod: 'devtools',
      },
    });

    // --- KLIK NEXT: MEMICU RENDER STEP 4 DAN KOMPUTASI GREEDY BSSF ---
    const startTime = Date.now();
    await page.click('button:has-text("Lanjut ke Step 4")');

    // Tunggu visualisasi Canvas muncul (artinya komputasi client-side selesai)
    await page.waitForSelector('canvas', {
      state: 'attached',
      timeout: 120_000,
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Akhiri Timespan
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    // Ekstrak metrik
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
// Main
// ============================================================
async function runBatchBenchmark() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  BATCH BENCHMARK — Skenario Makro (QuoteWizard CSR)    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  URL Target      : ${TARGET_URL}`);
  console.log(`║  Quantity (N)    : ${values.quantity}`);
  console.log(`║  Total Iterasi   : ${ITERATIONS}`);
  console.log(`║  Cooldown/Iterasi: ${COOLDOWN_SEC} detik`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

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

    if (i < ITERATIONS) {
      console.log(`   ⏸  Jeda ${COOLDOWN_SEC} detik (thermal throttling control)...`);
      await sleep(COOLDOWN_SEC);
    }
  }

  const validResults = allResults.filter(r => r.metrics !== null);
  const qty = parseInt(values.quantity, 10);
  const CSV_HEADER = 'No,n,TTFB_ms,TBT_ms,INP_ms,CLS,ExecutionTime_ms';
  const csvRows = [CSV_HEADER];

  for (const r of validResults) {
    csvRows.push([r.iteration, qty, r.metrics.TTFB_ms, r.metrics.TBT_ms, r.metrics.INP_ms, r.metrics.CLS, r.metrics.ExecutionTime_ms].join(','));
  }

  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'));

  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              📊 RINGKASAN BATCH BENCHMARK               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Berhasil: ${successCount}/${ITERATIONS}  |  Gagal: ${failCount}/${ITERATIONS}`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`💾 Seluruh hasil batch disimpan di: ${OUTPUT_FILE}`);

  await browser.close();
  console.log('✅ Batch benchmark selesai!\n');
}

runBatchBenchmark().catch(console.error);
