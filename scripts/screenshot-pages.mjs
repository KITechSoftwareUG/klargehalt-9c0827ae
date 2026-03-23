import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pages = [
  { name: '01-startseite', path: '/' },
  { name: '02-funktionen', path: '/funktionen' },
  { name: '03-sicherheit', path: '/sicherheit' },
  { name: '04-preise', path: '/preise' },
  { name: '05-eu-richtlinie', path: '/eu-richtlinie' },
  { name: '06-ueber-uns', path: '/ueber-uns' },
  { name: '07-kontakt', path: '/kontakt' },
];

const BASE = 'http://localhost:3000';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const pg of pages) {
    console.log(`Capturing ${pg.name} (${pg.path})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
      await page.goto(`${BASE}${pg.path}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      // Wait a bit for animations
      await new Promise(r => setTimeout(r, 1500));

      // Full page screenshot
      await page.screenshot({
        path: path.join(outDir, `${pg.name}-full.png`),
        fullPage: true,
      });

      // Above-the-fold screenshot
      await page.screenshot({
        path: path.join(outDir, `${pg.name}-fold.png`),
        fullPage: false,
      });

      console.log(`  ✓ ${pg.name} done`);
    } catch (err) {
      console.error(`  ✗ ${pg.name} failed: ${err.message}`);
    }

    await page.close();
  }

  // Mobile screenshots for landing page
  console.log('Capturing mobile views...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });

  for (const pg of pages.slice(0, 3)) {
    try {
      await mobilePage.goto(`${BASE}${pg.path}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      await new Promise(r => setTimeout(r, 1500));
      await mobilePage.screenshot({
        path: path.join(outDir, `${pg.name}-mobile.png`),
        fullPage: false,
      });
      console.log(`  ✓ ${pg.name} mobile done`);
    } catch (err) {
      console.error(`  ✗ ${pg.name} mobile failed: ${err.message}`);
    }
  }

  await mobilePage.close();
  await browser.close();
  console.log(`\nAll screenshots saved to ${outDir}/`);
}

run().catch(console.error);
