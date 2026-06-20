import { chromium } from "playwright";

const browser = await chromium.launch();
const sizes = [1920, 1440, 1280];

for (const vw of sizes) {
  const page = await browser.newPage({ viewport: { width: vw, height: 1080 } });
  await page.goto("http://127.0.0.1:3000/index.html", { waitUntil: "networkidle" });
  const m = await page.evaluate(() => {
    const contact = document.querySelector('.nav__link[href="#contact"]');
    const frame = document.querySelector(".hero-luxe__portrait-frame");
    const intro = document.querySelector(".hero-luxe__intro");
    const r = (el) => el.getBoundingClientRect();
    return {
      vw: innerWidth,
      contactLeft: Math.round(r(contact).left),
      frameLeft: Math.round(r(frame).left),
      introLeft: Math.round(r(intro).left),
      delta: Math.round(r(frame).left - r(contact).left),
    };
  });
  console.log(m);
  await page.close();
}

await browser.close();
