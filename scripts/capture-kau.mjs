import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'portfolio', 'assets', 'images', 'kau');
fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 1400;
const HEIGHT = 875;

const shots = [
  {
    name: 'kau-entrance.png',
    url: 'https://virtualkaulibrarytour.netlify.app/',
    waitMs: 4500,
  },
  {
    name: 'kau-interface.png',
    url: 'https://virtualkaulibrarytour.netlify.app/floor1/app-files/index.html',
    waitMs: 4500,
  },
  {
    name: 'kau-interior.png',
    url: 'https://virtualkaulibrarytour.netlify.app/floor2/app-files/index.html',
    waitMs: 5000,
  },
  {
    name: 'kau-panorama.png',
    url: 'https://virtualkaulibrarytour.netlify.app/floor3/app-files/index.html',
    waitMs: 5000,
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
});

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(shot.waitMs);
  await page.screenshot({
    path: path.join(outDir, shot.name),
    type: 'png',
  });
  console.log('Saved', shot.name);
}

await browser.close();
