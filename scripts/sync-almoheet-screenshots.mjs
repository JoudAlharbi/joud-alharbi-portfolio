import { chromium } from "playwright";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(rootDir, "public/portfolio/images");
const assetDir = path.resolve(rootDir, "portfolio/assets/images/almoheet");

const SLIDE_FILES = [
  "almoheet-hero.png",
  "almoheet-services.png",
  "almoheet-portfolio.png",
  "almoheet-clients.png",
  "almoheet-contact.png",
];

const CAPTURES = [
  {
    file: "almoheet-hero.png",
    url: "https://almoheet-company.vercel.app/ar",
    scrollY: 0,
  },
  {
    file: "almoheet-services.png",
    url: "https://almoheet-company.vercel.app/ar/services",
    scrollY: 0,
  },
  {
    file: "almoheet-portfolio.png",
    url: "https://almoheet-company.vercel.app/ar/portfolio",
    scrollY: 0,
  },
  {
    file: "almoheet-clients.png",
    url: "https://almoheet-company.vercel.app/ar/clients",
    scrollY: 0,
  },
  {
    file: "almoheet-contact.png",
    url: "https://almoheet-company.vercel.app/ar/contact",
    scrollY: 0,
  },
];

const HIDE_FLOATING_UI = `
  a[href*="wa.me"],
  a[href*="whatsapp"],
  [class*="whatsapp" i],
  [class*="WhatsApp" i],
  [aria-label*="whatsapp" i],
  [data-testid*="whatsapp" i],
  .floating-whatsapp,
  #whatsapp-button {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function clearStaleImages(dir) {
  await mkdir(dir, { recursive: true });
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    const isAlmoheetImage =
      lower.startsWith("almoheet-") &&
      (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".webp") || lower.endsWith(".svg"));

    if (isAlmoheetImage && !SLIDE_FILES.includes(entry.name)) {
      await rm(path.join(dir, entry.name));
      console.log(`Removed stale image: ${entry.name}`);
    }
  }
}

async function captureFreshScreenshots() {
  await mkdir(sourceDir, { recursive: true });
  await clearStaleImages(sourceDir);
  await clearStaleImages(assetDir);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  for (const shot of CAPTURES) {
    console.log(`Capturing ${shot.file}…`);
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 90000 });
    await page.addStyleTag({ content: HIDE_FLOATING_UI });
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), shot.scrollY);
    await page.waitForTimeout(2500);

    const outputPath = path.join(sourceDir, shot.file);
    await page.screenshot({
      path: outputPath,
      type: "png",
      fullPage: false,
    });
    console.log(`Saved ${outputPath}`);
  }

  await browser.close();
}

async function syncSourceToAssets() {
  await mkdir(assetDir, { recursive: true });

  for (const file of SLIDE_FILES) {
    const sourcePath = path.join(sourceDir, file);
    if (!(await pathExists(sourcePath))) {
      throw new Error(`Missing screenshot in source folder: ${sourcePath}`);
    }

    const assetPath = path.join(assetDir, file);
    await copyFile(sourcePath, assetPath);
    console.log(`Synced ${file} -> portfolio/assets/images/almoheet/`);
  }
}

const forceCapture = process.argv.includes("--capture");

async function main() {
  if (forceCapture) {
    console.log("Capturing fresh screenshots from live site");
    await captureFreshScreenshots();
    await syncSourceToAssets();
    return;
  }

  const sourceReady = (await pathExists(sourceDir))
    ? (await readdir(sourceDir)).some((name) => SLIDE_FILES.includes(name))
    : false;

  if (sourceReady) {
    console.log("Using screenshots from public/portfolio/images");
    await clearStaleImages(sourceDir);
    await syncSourceToAssets();
    return;
  }

  console.log("No source screenshots found — using committed assets in portfolio/assets/images/almoheet");
}

await main();
console.log("Almoheet screenshot sync complete.");
