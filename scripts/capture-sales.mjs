import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "portfolio", "assets", "images", "sales");
const BASE = "https://sales-analytics-dashboard-xi-sandy.vercel.app/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

async function waitForDashboard() {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByText("Executive Sales Analytics").first().waitFor({ timeout: 45000 });
  await page.waitForTimeout(3500);
}

async function clickNav(label) {
  await page.getByRole("button", { name: label }).click();
  await page.waitForTimeout(2000);
}

async function captureOverview() {
  await waitForDashboard();
  await clickNav("Overview");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "sales-overview.png"), type: "png" });
  console.log("Saved sales-overview.png");
}

async function captureSalesPerformance() {
  await waitForDashboard();
  await clickNav("Sales Performance");
  await page.screenshot({ path: path.join(outDir, "sales-performance.png"), type: "png" });
  console.log("Saved sales-performance.png");
}

async function captureRevenue() {
  await waitForDashboard();
  await clickNav("Overview");
  await page.locator("#overview").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, 420));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, "sales-revenue.png"), type: "png" });
  console.log("Saved sales-revenue.png");
}

async function captureProducts() {
  await waitForDashboard();
  await clickNav("Products");
  await page.screenshot({ path: path.join(outDir, "sales-customers.png"), type: "png" });
  console.log("Saved sales-customers.png");
}

await captureOverview();
await captureSalesPerformance();
await captureRevenue();
await captureProducts();
await browser.close();
