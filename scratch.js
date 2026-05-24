import { chromium } from 'playwright';
import puppeteer from 'puppeteer-core';
import lighthouse, { startTimespan } from 'lighthouse/core/index.js';

(async () => {
  const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/test/csr');

  const browserURL = 'http://localhost:9222';
  const pBrowser = await puppeteer.connect({ browserURL });
  const pages = await pBrowser.pages();
  const pPage = pages.find(p => p.url().includes('localhost:3000')) || pages[0];

  try {
    const timespan = await startTimespan(pPage, { port: 9222 });
    console.log("Timespan started successfully!");
    await timespan.endTimespan();
    console.log("Timespan ended!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pBrowser.disconnect();
    await browser.close();
  }
})();
