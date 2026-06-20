import { chromium } from "playwright";

const browser = await chromium.launch();
const sizes = [
  { w: 1920, h: 1080 },
  { w: 1440, h: 900 },
  { w: 1280, h: 900 },
];

for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
  await page.goto("http://127.0.0.1:3000/index.html", { waitUntil: "networkidle" });

  const m = await page.evaluate(() => {
    const exp = document.querySelector('.nav__link[href="#experience"]');
    const intro = document.querySelector(".hero-luxe__intro");
    const portrait = document.querySelector(".hero-luxe__portrait");
    const layout = document.querySelector(".hero-luxe__layout");
    const r = (el) => el.getBoundingClientRect();
    const vw = window.innerWidth;
    return {
      vw,
      experienceLeft: Math.round(r(exp).left),
      introLeft: Math.round(r(intro).left),
      introWidthPct: Math.round((r(intro).width / vw) * 100),
      portraitWidth: Math.round(r(portrait).width),
      portraitWidthPct: Math.round((r(portrait).width / vw) * 100),
      portraitLeftPct: Math.round((r(portrait).left / vw) * 100),
      gap: Math.round(r(portrait).left - r(intro).right),
      layoutWidth: Math.round(r(layout).width),
    };
  });

  console.log(`${size.w}x${size.h}:`, m);
  await page.close();
}

await browser.close();
