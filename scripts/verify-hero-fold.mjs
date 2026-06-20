import { chromium } from "playwright";

const sizes = [
  { w: 1920, h: 1080, name: "1920x1080" },
  { w: 1440, h: 900, name: "1440x900" },
];

const browser = await chromium.launch();

for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
  await page.goto("http://127.0.0.1:3000/index.html", { waitUntil: "networkidle" });

  const result = await page.evaluate(() => {
    const vh = window.innerHeight;
    const scrollH = document.documentElement.scrollHeight;
    const check = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      return {
        found: true,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        fullyVisible: r.top >= -1 && r.bottom <= vh + 1,
      };
    };

    return {
      scrollHeight: scrollH,
      viewportHeight: vh,
      pageScrolls: scrollH > vh + 1,
      kicker: check(".hero-luxe__kicker"),
      headline: check(".hero-luxe__headline"),
      role: check(".hero-luxe__role"),
      lead: check(".hero-luxe__lead"),
      actions: check(".hero-luxe__actions"),
      metrics: check(".hero-luxe__metrics"),
      portrait: check(".hero-luxe__portrait"),
      socials: check(".hero-luxe__socials"),
      hero: check(".hero-luxe"),
    };
  });

  console.log(`\n${size.name}:`, JSON.stringify(result, null, 2));
}

await browser.close();
