import { chromium } from 'playwright';
import puppeteer from 'puppeteer-core';
import lighthouse, { startTimespan } from 'lighthouse/core/index.js';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

// 1. Parsing argumen CLI (e.g. --width=1000 --height=1000 --quantity=15)
const options = {
  width: { type: 'string', default: '1000' },
  height: { type: 'string', default: '1000' },
  quantity: { type: 'string', default: '15' },
};
const { values } = parseArgs({ args: process.argv.slice(2), options });

const TARGET_URL = 'https://rendering-printing.vercel.app/test/ssr'
const PORT = 9222;

/**
 * Custom throttling configuration for Lighthouse
 * CPU Slowdown: 4x
 * Network: Slow 4G (1.6 Mbps down, 750 Kbps up, 150ms RTT)
 */
const customThrottling = {
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150,
  downloadThroughputKbps: 1.6 * 1024,
  uploadThroughputKbps: 750,
  cpuSlowdownMultiplier: 4,
};

// 2. Setup Direktori Output
const RESULT_DIR = path.join(process.cwd(), 'result-test');
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

// Menentukan nomor urut file
const existingFiles = fs.readdirSync(RESULT_DIR);
let maxNum = 0;
existingFiles.forEach(file => {
  const match = file.match(/^pengujian-ssr-(\d+)\.json$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num > maxNum) maxNum = num;
  }
});
const nextNum = maxNum + 1;
const OUTPUT_FILE = path.join(RESULT_DIR, `pengujian-ssr-${nextNum}.json`);

async function runBenchmark() {
  console.log(`\n🚀 Memulai Benchmark SSR dengan N=${values.quantity}`);
  console.log(`Dimensi Container: ${values.width} x ${values.height}\n`);

  // 3. Manajemen Port & Browser: Launch Playwright dengan port debugging
  console.log('🔄 Memulai browser Chromium (Incognito)...');
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: false, // Disarankan false jika ingin melihat visualisasi saat test (optional)
  });

  // Gunakan Incognito Browser Context
  const context = await browser.newContext();
  const page = await context.newPage();

  let pBrowser = null;

  try {
    // Step 1: Navigasi Awal via Playwright
    console.log(`🌐 Navigasi awal ke ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Step 2: Lighthouse Mode NAVIGATION (Untuk TTFB & Load Metrics)
    console.log('📈 Menjalankan Lighthouse (NAVIGATION mode) untuk TTFB...');
    const navResult = await lighthouse(TARGET_URL, {
      port: PORT,
      onlyCategories: ['performance'],
      output: 'json',
      throttlingMethod: 'simulate',
      throttling: customThrottling,
    });
    const navLhr = navResult.lhr;

    // Ekstrak TTFB dari audit
    const ttfb = navLhr.audits['server-response-time']?.numericValue || 0;

    // Karena Lighthouse navigation me-reload page, kita harus memastikan halaman sudah siap
    // sebelum mengisi form. (Navigation mode menyelesaikan reload di akhir pengujiannya).
    // Tapi amannya kita re-navigate / memastikan DOM siap.
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="input-width"]', { state: 'visible' });

    // Step 3: Isi Form dengan Playwright
    console.log('📝 Mengisi parameter form...');
    await page.locator('[data-testid="input-width"]').fill(values.width);
    await page.locator('[data-testid="input-height"]').fill(values.height);
    await page.locator('[data-testid="input-quantity"]').first().fill(values.quantity);

    // ==========================================
    // BRIDGE PLAYWRIGHT KE LIGHTHOUSE (PUPPETEER)
    // ==========================================
    const browserURL = `http://localhost:${PORT}`;
    pBrowser = await puppeteer.connect({ browserURL });
    const pages = await pBrowser.pages();
    const pPage = pages.find(p => p.url().includes('localhost:3000') || p.url().includes('rendering-printing')) || pages[0];

    // Step 4: Mulai Lighthouse Mode TIMESPAN
    console.log('⏱  Memulai Lighthouse (TIMESPAN mode)...');
    const timespan = await startTimespan(pPage, {
      port: PORT,
      configContext: {
        settingsOverrides: {
          throttlingMethod: 'simulate',
          throttling: customThrottling,
        },
      },
    });

    // Step 5: Eksekusi melalui CDP dispatch (bukan JS evaluate agar INP terekam optimal)
    console.log('▶️  Menjalankan komputasi algoritma...');
    
    // Setup listener untuk mengukur Server Response Time dari aksi form
    let serverResponseTimeMs = 0;
    const requestPromise = new Promise(resolve => {
      const startTimes = new Map();
      
      const onReq = (req) => {
        // Asumsi form submit menggunakan POST (Server Actions) atau memicu navigasi
        if (req.method() === 'POST' || req.isNavigationRequest()) {
          startTimes.set(req.url(), Date.now());
        }
      };
      
      const onRes = (res) => {
        const req = res.request();
        if (req.method() === 'POST' || req.isNavigationRequest()) {
          if (startTimes.has(req.url())) {
            const srt = Date.now() - startTimes.get(req.url());
            page.removeListener('request', onReq);
            page.removeListener('response', onRes);
            resolve(srt);
          }
        }
      };
      
      page.on('request', onReq);
      page.on('response', onRes);
      
      // Fallback timeout
      setTimeout(() => resolve(0), 60000);
    });

    const startTime = Date.now();
    await page.click('[data-testid="generate-btn"]');

    console.log('⏳ Menunggu respons server dan hasil visualisasi (compute-heavy blocking)...');
    
    serverResponseTimeMs = await requestPromise;
    if (serverResponseTimeMs > 0) {
      console.log(`⏱  Server Response Time (Action) tercatat: ${serverResponseTimeMs} ms`);
    }

    await page.waitForSelector('[data-testid="visualization-result"]', {
      state: 'attached',
      timeout: 60000,
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Step 7: Akhiri Timespan
    console.log('⏹  Mengakhiri Timespan Lighthouse...');
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    // 6. Output Ekstraksi & Tampilkan Tabel
    const tbt = timespanLhr.audits['total-blocking-time']?.numericValue || 0;
    const cls = timespanLhr.audits['cumulative-layout-shift']?.numericValue || 0;
    const inp = timespanLhr.audits['interaction-to-next-paint']?.numericValue || 0;

    console.log('\n======================================================');
    console.log('📊 HASIL BENCHMARK (SSR) - 2D Guillotine Bin Packing');
    console.log('======================================================');
    console.table([
      { Metric: 'Initial Load TTFB', Value: `${ttfb.toFixed(2)} ms` },
      { Metric: 'Action Server Response Time', Value: `${serverResponseTimeMs} ms` },
      { Metric: 'Total Blocking Time (TBT)', Value: `${tbt.toFixed(2)} ms` },
      { Metric: 'Interaction to Next Paint (INP)', Value: `${inp.toFixed(2)} ms` },
      { Metric: 'Cumulative Layout Shift (CLS)', Value: `${cls.toFixed(4)}` },
      { Metric: 'Wall-clock Execution Time', Value: `${executionTime} ms` },
    ]);
    console.log('======================================================\n');

    // 7. Simpan Hasil ke JSON
    const finalData = {
      timestamp: new Date().toISOString(),
      scenario: 'Server-Side Rendering (SSR)',
      parameters: {
        width: parseInt(values.width, 10),
        height: parseInt(values.height, 10),
        quantity: parseInt(values.quantity, 10),
      },
      metrics: {
        InitialLoad_TTFB_ms: parseFloat(ttfb.toFixed(2)),
        Action_ServerResponseTime_ms: serverResponseTimeMs,
        TBT_ms: parseFloat(tbt.toFixed(2)),
        INP_ms: parseFloat(inp.toFixed(2)),
        CLS: parseFloat(cls.toFixed(4)),
        ExecutionTime_ms: executionTime
      }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
    console.log(`💾 Hasil pengujian berhasil disimpan di: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat pengujian:', error);
  } finally {
    console.log('🧹 Membersihkan sesi browser...');
    if (pBrowser) await pBrowser.disconnect();
    await context.close();
    await browser.close();
  }
}

runBenchmark().catch(console.error);
