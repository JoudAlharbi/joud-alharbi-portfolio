import { chromium } from "playwright";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(rootDir, "public/portfolio/images");
const assetDir = path.resolve(rootDir, "portfolio/assets/images/almoheet");

const SLIDE_FILES = [
  "almoheet-portfolio.png",
  "almoheet-featured.png",
  "almoheet-project-detail.png",
  "almoheet-services.png",
  "almoheet-clients.png",
  "almoheet-contact.png",
];

const STALE_FILES = ["almoheet-hero.png"];

const CAPTURES = [
  {
    file: "almoheet-portfolio.png",
    url: "https://almoheet-company.vercel.app/ar/portfolio",
    scrollTo: null,
  },
  {
    file: "almoheet-featured.png",
    url: "https://almoheet-company.vercel.app/ar/portfolio",
    scrollTo: "مشاريع مختارة",
  },
  {
    file: "almoheet-project-detail.png",
    url: "https://almoheet-company.vercel.app/ar/portfolio/secret-brand-gift-box",
    scrollTo: null,
  },
  {
    file: "almoheet-services.png",
    url: "https://almoheet-company.vercel.app/ar/services",
    scrollTo: null,
  },
  {
    file: "almoheet-clients.png",
    url: "https://almoheet-company.vercel.app/ar/clients",
    scrollTo: null,
  },
  {
    file: "almoheet-contact.png",
    url: "https://almoheet-company.vercel.app/ar/contact",
    scrollTo: null,
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

async function scrollToHeading(page, headingText) {
  const scrolled = await page.evaluate((text) => {
    const headings = [...document.querySelectorAll("h1,h2,h3")];
    const target = headings.find((node) => node.textContent.includes(text));
    if (!target) return false;
    const top = window.scrollY + target.getBoundingClientRect().top - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    return true;
  }, headingText);

  if (!scrolled) {
    console.warn(`Heading not found: ${headingText}`);
  }
}

async function captureFreshScreenshots() {
  await mkdir(sourceDir, { recursive: true });
  await clearStaleImages(sourceDir);
  await clearStaleImages(assetDir);

  for (const stale of STALE_FILES) {
    for (const dir of [sourceDir, assetDir]) {
      const stalePath = path.join(dir, stale);
      if (await pathExists(stalePath)) {
        await rm(stalePath);
        console.log(`Removed deprecated image: ${stale}`);
      }
    }
  }

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

    if (shot.scrollTo) {
      await scrollToHeading(page, shot.scrollTo);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.waitForTimeout(3000);

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

  let sourceReady = false;
  if (await pathExists(sourceDir)) {
    const checks = await Promise.all(
      SLIDE_FILES.map((name) => pathExists(path.join(sourceDir, name)))
    );
    sourceReady = checks.every(Boolean);
  }

  if (sourceReady) {
    console.log("Using screenshots from public/portfolio/images");
    await clearStaleImages(sourceDir);
    await syncSourceToAssets();
    return;
  }

  console.log("No complete source set found — using committed assets in portfolio/assets/images/almoheet");
}

await main();
console.log("Almoheet screenshot sync complete.");
