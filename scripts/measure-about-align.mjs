import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://127.0.0.1:3000/index.html", { waitUntil: "networkidle" });

const m = await page.evaluate(() => {
  const about = document.querySelector('.nav__link[href="#about"]');
  const intro = document.querySelector(".hero-luxe__intro");
  const portrait = document.querySelector(".hero-luxe__portrait");
  const r = (el) => el.getBoundingClientRect();
  return {
    aboutLeft: Math.round(r(about).left),
    introLeft: Math.round(r(intro).left),
    portraitLeft: Math.round(r(portrait).left),
  };
});

console.log(m);
await browser.close();
