import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../portfolio/assets/images/almoheet");

const shots = [
  {
    file: "almoheet-hero.png",
    url: "https://almoheet-company.vercel.app/ar",
    waitFor: "networkidle",
  },
  {
    file: "almoheet-services.png",
    url: "https://almoheet-company.vercel.app/ar/services",
    waitFor: "networkidle",
  },
  {
    file: "almoheet-portfolio.png",
    url: "https://almoheet-company.vercel.app/ar/portfolio",
    waitFor: "networkidle",
  },
  {
    file: "almoheet-clients.png",
    url: "https://almoheet-company.vercel.app/ar/clients",
    waitFor: "networkidle",
  },
  {
    file: "almoheet-contact.png",
    url: "https://almoheet-company.vercel.app/ar/contact",
    waitFor: "networkidle",
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

for (const shot of shots) {
  console.log(`Capturing ${shot.file}…`);
  await page.goto(shot.url, { waitUntil: shot.waitFor, timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(outDir, shot.file),
    type: "png",
    fullPage: false,
  });
  console.log(`Saved ${shot.file}`);
}

await browser.close();
console.log("Done.");
