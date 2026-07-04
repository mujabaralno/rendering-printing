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
  iterations: { type: 'string', default: '3' },
  cooldown:   { type: 'string', default: '10' },
};
const { values } = parseArgs({ args: process.argv.slice(2), options });

// ============================================================
// Target: Makro CSR — QuoteWizard CSR
// Skrip diagnostik: menyimpan full Lighthouse Result (LHR) Timespan
// untuk menginspeksi audit INP dan atribusi interaksi.
// ============================================================
const TARGET_URL   = 'https://rendering-printing.vercel.app/create-quote/csr';
const PORT         = 9222;
const ITERATIONS   = parseInt(values.iterations, 10);
const COOLDOWN_SEC = parseInt(values.cooldown, 10);
const qty          = parseInt(values.quantity, 10);

// ============================================================
// Lighthouse Throttling (devtools mode) — IDENTIK dengan skrip asli
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
// Output Directory Setup: result-inp-lhr/n-{qty}/
// ============================================================
const RESULT_BASE = path.join(process.cwd(), 'result-inp-lhr');
const RESULT_DIR  = path.join(RESULT_BASE, `n-${qty}`);
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

// ============================================================
// Helper: Sleep
// ============================================================
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// ============================================================
// Audit keywords to inspect in the full LHR
// ============================================================
const INP_AUDIT_KEYWORDS = ['interaction', 'inp', 'responsiveness', 'long-task'];

/**
 * Extract audits whose ID contains any of the INP_AUDIT_KEYWORDS.
 */
function extractInpRelatedAudits(lhr) {
  const found = [];
  for (const [id, audit] of Object.entries(lhr.audits || {})) {
    const lower = id.toLowerCase();
    if (INP_AUDIT_KEYWORDS.some(kw => lower.includes(kw))) {
      found.push({ id, ...audit });
    }
  }
  return found;
}

/**
 * Attempt to extract interaction target / attribution from an audit's details.
 */
function extractInteractionAttribution(audit) {
  const attribution = [];

  if (!audit.details) return attribution;

  const details = audit.details;

  // Table / opportunity items
  if (Array.isArray(details.items)) {
    for (const item of details.items) {
      const entry = {};
      if (item.node?.selector) entry.selector = item.node.selector;
      if (item.node?.nodeLabel) entry.nodeLabel = item.node.nodeLabel;
      if (item.node?.snippet) entry.snippet = item.node.snippet;
      if (item.interactionType) entry.interactionType = item.interactionType;
      if (item.duration) entry.duration = item.duration;
      if (item.startTime !== undefined) entry.startTime = item.startTime;
      if (item.args?.data?.interactionType) entry.interactionType = item.args.data.interactionType;
      if (item.args?.data?.nodeId) entry.nodeId = item.args.data.nodeId;
      if (Object.keys(entry).length > 0) attribution.push(entry);
    }
  }

  return attribution;
}

// ============================================================
// Single Iteration Runner — identical flow, but saves full LHR
// ============================================================
async function runSingleIteration(iterationNumber, browser, isWarmup = false) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  let pBrowser = null;

  try {
    // ── Step 1: Navigasi awal ──
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

    // Sanity check (hanya iterasi pertama)
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
    const pages_ = await pBrowser.pages();
    const pPage = pages_.find(p => p.url().includes('localhost:3000')) || pages_[0];

    // ═══════════════════════════════════════════════════════════
    // MULAI LIGHTHOUSE TIMESPAN
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
    // KLIK NEXT → MEMICU RENDER STEP 4 + KOMPUTASI BSSF
    // ═══════════════════════════════════════════════════════════
    const startTime = Date.now();
    await page.click('button:has-text("Lanjut ke Step 4")');

    // ═══════════════════════════════════════════════════════════
    // TUNGGU KOMPUTASI SELESAI — identik dengan skrip asli
    // ═══════════════════════════════════════════════════════════
    await page.waitForSelector('h2:has-text("Operational Details")', {
      state: 'visible',
      timeout: 120_000,
    });

    await page.waitForSelector('text="Running 2D Guillotine Pack"', {
      state: 'hidden',
      timeout: 120_000,
    }).catch(() => {
      // Loading mungkin terlalu cepat / sudah hilang sebelum kita cek
    });

    await page.waitForSelector('text="Pieces / Sheet"', {
      state: 'visible',
      timeout: 120_000,
    });

    // Tunggu 500ms ekstra untuk memastikan canvas painting selesai
    await page.waitForTimeout(500);

    const endTime = Date.now();
    const wallClockTotal = endTime - startTime;

    // ═══════════════════════════════════════════════════════════
    // AKHIRI TIMESPAN & SIMPAN FULL LHR
    // ═══════════════════════════════════════════════════════════
    const timespanResult = await timespan.endTimespan();
    const timespanLhr = timespanResult.lhr;

    const tbt = timespanLhr.audits['total-blocking-time']?.numericValue || 0;
    const cls = timespanLhr.audits['cumulative-layout-shift']?.numericValue || 0;
    const inp = timespanLhr.audits['interaction-to-next-paint']?.numericValue || 0;

    if (!isWarmup) {
      // Simpan full LHR ke file
      const iterNum = String(iterationNumber).padStart(2, '0');
      const outputPath = path.join(RESULT_DIR, `iteration-${iterNum}-full-lhr.json`);
      fs.writeFileSync(outputPath, JSON.stringify(timespanResult.lhr, null, 2));
      console.log(`   💾 Full LHR disimpan: ${outputPath}`);

      console.log(`   TTFB: ${ttfb.toFixed(2)} ms | TBT: ${tbt.toFixed(2)} ms | INP: ${inp.toFixed(2)} ms | CLS: ${cls.toFixed(4)} | Wall: ${wallClockTotal} ms`);
    } else {
      console.log(`   [Warm-up] Selesai (Wall: ${wallClockTotal} ms)`);
    }

    return {
      iteration: iterationNumber,
      isWarmup,
      metrics: {
        TTFB_ms: parseFloat(ttfb.toFixed(2)),
        TBT_ms: parseFloat(tbt.toFixed(2)),
        INP_ms: parseFloat(inp.toFixed(2)),
        CLS: parseFloat(cls.toFixed(4)),
        WallClock_ms: wallClockTotal,
      },
      lhr: isWarmup ? null : timespanLhr,
    };
  } catch (error) {
    console.error(`   ❌ Iterasi ${iterationNumber} gagal: ${error.message}`);
    return {
      iteration: iterationNumber,
      isWarmup,
      metrics: null,
      lhr: null,
      error: error.message,
    };
  } finally {
    if (pBrowser) await pBrowser.disconnect();
    await context.close();
  }
}

// ============================================================
// Main: Diagnostik LHR Batch
// ============================================================
async function runDiagnosticBatch() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIK LHR — Skenario Makro (QuoteWizard CSR)            ║');
  console.log('║  Tujuan: Menyimpan full Lighthouse Result untuk inspeksi INP   ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Target          : ${TARGET_URL}`);
  console.log(`║  Quantity (N)    : ${qty}`);
  console.log(`║  Total Iterasi   : ${ITERATIONS} (diagnostik)`);
  console.log(`║  Cooldown/Iterasi: ${COOLDOWN_SEC} detik`);
  console.log(`║  Output Dir      : ${RESULT_DIR}`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  ⚠️  Skrip ini bersifat DIAGNOSTIK, bukan pengganti dataset   ║');
  console.log('║      30 iterasi eksperimen. Jangan gunakan untuk uji statistik.║');
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
  // WARM-UP PHASE (identik dengan skrip asli, hasil tidak disimpan)
  // ============================================================
  console.log('\n🔥 Memulai Fase Pemanasan (Warm-up)...');
  console.log('   Tujuan: Menetralisir bias JIT compilation pada V8 Engine.');
  console.log('   Hasil warm-up TIDAK disimpan sebagai data utama.\n');
  for (let i = 1; i <= 3; i++) {
    console.log(`\n🔥 Warm-up ${i}/3`);
    await runSingleIteration(`W-${i}`, browser, true);
    await sleep(2);
  }
  console.log('\n✅ Pemanasan selesai. Memulai iterasi diagnostik...\n');

  // ============================================================
  // ITERASI UTAMA
  // ============================================================
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
  // ANALISIS AUDIT INP DARI FULL LHR
  // ============================================================
  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              🔍 ANALISIS AUDIT INP DARI FULL LHR              ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Berhasil: ${successCount}/${ITERATIONS}  |  Gagal: ${failCount}/${ITERATIONS}`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const validResults = allResults.filter(r => r.lhr !== null);

  const allAuditSummaries = [];

  for (const result of validResults) {
    const iterLabel = `Iterasi ${result.iteration}`;
    console.log(`\n── ${iterLabel} ──`);
    console.log(`   INP: ${result.metrics.INP_ms} ms | TBT: ${result.metrics.TBT_ms} ms`);

    const relatedAudits = extractInpRelatedAudits(result.lhr);
    const iterSummary = {
      iteration: result.iteration,
      INP_ms: result.metrics.INP_ms,
      TBT_ms: result.metrics.TBT_ms,
      auditsFound: [],
      attributions: [],
    };

    if (relatedAudits.length === 0) {
      console.log('   ⚠️  Tidak ditemukan audit terkait INP/interaction/responsiveness/long-task.');
    } else {
      console.log(`   📋 Ditemukan ${relatedAudits.length} audit terkait:`);
      for (const audit of relatedAudits) {
        const score = audit.score !== null && audit.score !== undefined ? audit.score : 'N/A';
        const numVal = audit.numericValue !== undefined ? audit.numericValue : 'N/A';
        console.log(`      • ${audit.id}  (score: ${score}, numericValue: ${numVal})`);

        iterSummary.auditsFound.push({
          id: audit.id,
          score,
          numericValue: numVal,
          displayValue: audit.displayValue || null,
          hasDetails: !!audit.details,
          detailsType: audit.details?.type || null,
          itemCount: audit.details?.items?.length || 0,
        });

        // Extract attribution
        const attrs = extractInteractionAttribution(audit);
        if (attrs.length > 0) {
          console.log(`         ↳ Attribution (${attrs.length} entries):`);
          for (const attr of attrs) {
            console.log(`           ${JSON.stringify(attr)}`);
          }
          iterSummary.attributions.push(...attrs.map(a => ({ auditId: audit.id, ...a })));
        }

        // Print INP details explicitly
        if (audit.id.includes('inp') || audit.id.includes('interaction-to-next-paint')) {
          console.log(`         ↳ Full details type: ${audit.details?.type || 'none'}`);
          if (audit.details) {
            console.log(`         ↳ Details keys: ${Object.keys(audit.details).join(', ')}`);
            if (audit.details.items) {
              console.log(`         ↳ Items count: ${audit.details.items.length}`);
              for (let idx = 0; idx < Math.min(audit.details.items.length, 5); idx++) {
                console.log(`           Item[${idx}]: ${JSON.stringify(audit.details.items[idx])}`);
              }
            }
          }
        }
      }
    }

    allAuditSummaries.push(iterSummary);
  }

  // ============================================================
  // RINGKASAN KONSISTENSI ANTAR ITERASI
  // ============================================================
  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              📊 RINGKASAN KONSISTENSI ANTAR ITERASI           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // INP values
  const inpValues = allAuditSummaries.map(s => s.INP_ms);
  const tbtValues = allAuditSummaries.map(s => s.TBT_ms);
  console.log(`   INP values: [${inpValues.join(', ')}] ms`);
  console.log(`   TBT values: [${tbtValues.join(', ')}] ms`);

  // Konsistensi audit IDs
  const auditIdSets = allAuditSummaries.map(s => new Set(s.auditsFound.map(a => a.id)));
  let auditIdsConsistent = true;
  if (auditIdSets.length > 1) {
    const first = [...auditIdSets[0]].sort().join(',');
    for (let i = 1; i < auditIdSets.length; i++) {
      if ([...auditIdSets[i]].sort().join(',') !== first) {
        auditIdsConsistent = false;
        break;
      }
    }
  }
  console.log(`   Audit IDs konsisten antar iterasi: ${auditIdsConsistent ? '✅ Ya' : '❌ Tidak'}`);

  // Konsistensi attribution
  const hasAttribution = allAuditSummaries.some(s => s.attributions.length > 0);
  if (hasAttribution) {
    console.log('   ✅ Attribution target interaksi ditemukan:');
    for (const s of allAuditSummaries) {
      console.log(`      Iterasi ${s.iteration}: ${s.attributions.length} attribution(s)`);
      for (const a of s.attributions) {
        console.log(`        ${JSON.stringify(a)}`);
      }
    }
    // Check if selectors are consistent
    const selectorSets = allAuditSummaries.map(s =>
      s.attributions.map(a => a.selector || a.nodeLabel || 'unknown').sort().join('|')
    );
    const selectorsConsistent = selectorSets.every(s => s === selectorSets[0]);
    console.log(`   Selector/target konsisten: ${selectorsConsistent ? '✅ Ya' : '❌ Tidak'}`);
  } else {
    console.log('\n   ⚠️  Full LHR hanya menyediakan nilai INP tanpa attribution target interaksi yang memadai.');
    console.log('       Lighthouse Timespan mode mungkin tidak merekam event attribution secara detail.');
  }

  // Simpan ringkasan analisis
  const summaryPath = path.join(RESULT_DIR, 'ringkasan-audit-inp.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    diagnosticInfo: {
      scriptName: 'benchmark-playwright-create-quote-csr-lhr.mjs',
      timestamp: new Date().toISOString(),
      quantity: qty,
      iterations: ITERATIONS,
      targetUrl: TARGET_URL,
      throttling: customThrottling,
      formFactor: 'desktop',
      viewport: VIEWPORT,
    },
    iterationSummaries: allAuditSummaries,
    consistency: {
      inpValues,
      tbtValues,
      auditIdsConsistent,
      hasInteractionAttribution: hasAttribution,
    },
  }, null, 2));
  console.log(`\n💾 Ringkasan analisis disimpan: ${summaryPath}`);

  // Cleanup
  await browser.close();
  console.log('\n✅ Diagnostik LHR Makro CSR selesai!\n');
}

runDiagnosticBatch().catch(console.error);
