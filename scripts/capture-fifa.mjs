import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'portfolio', 'assets', 'images', 'fifa');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

async function captureHome() {
  await page.goto('https://worldcup2034-nu.vercel.app/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('text=Read More', { timeout: 30000 });
  await page.waitForTimeout(2500);

  const readMore = page.getByRole('link', { name: 'Read More' }).first();
  await readMore.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -140));
  await page.waitForTimeout(600);

  await page.screenshot({
    path: path.join(outDir, 'fifa-home.png'),
    type: 'png',
  });
  console.log('Saved fifa-home.png');
}

async function captureHostCities() {
  await page.goto('https://worldcup2034-nu.vercel.app/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await page.getByRole('link', { name: 'Host Cities & Stadiums' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const heading = page.getByRole('heading').first();
  await heading.waitFor({ timeout: 30000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(outDir, 'fifa-host-cities.png'),
    type: 'png',
  });
  console.log('Saved fifa-host-cities.png');
}

await captureHome();
await captureHostCities();
await browser.close();
