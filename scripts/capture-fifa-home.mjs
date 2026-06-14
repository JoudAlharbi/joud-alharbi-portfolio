import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'portfolio', 'assets', 'images', 'fifa');

const WIDTH = 1400;
const HEIGHT = 875;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
});

await page.goto('https://worldcup2034-nu.vercel.app/', {
  waitUntil: 'networkidle',
  timeout: 90000,
});

await page.waitForSelector('h2:has-text("Latest FIFA World Cup 2034 News")', {
  timeout: 45000,
});
await page.waitForFunction(
  () =>
    [...document.querySelectorAll('a')].filter(
      (a) => a.textContent?.trim() === 'Read More',
    ).length >= 3,
  { timeout: 45000 },
);
await page.waitForTimeout(2500);

// Align to the full hero block top so the Saudi 2034 image is not clipped.
await page.evaluate(() => {
  const intro = [...document.querySelectorAll('h2')].find(
    (h) =>
      h.textContent?.trim() === 'FIFA World Cup 2034' &&
      h.nextElementSibling?.textContent?.includes('Saudi Arabia will proudly host'),
  );
  const heroBlock =
    intro?.closest('section') ??
    intro?.parentElement?.parentElement ??
    intro?.parentElement;

  if (heroBlock) {
    const top = heroBlock.getBoundingClientRect().top + window.scrollY + 37;
    window.scrollTo(0, Math.max(0, top));
    return;
  }

  if (intro) {
    const top = intro.getBoundingClientRect().top + window.scrollY + 37;
    window.scrollTo(0, Math.max(0, top));
  }
});
await page.waitForTimeout(700);

await page.screenshot({
  path: path.join(outDir, 'fifa-home.png'),
  type: 'png',
});

console.log('Saved fifa-home.png');
await browser.close();
