/**
 * Screenshot routes at desktop / tablet / phone widths.
 * Usage: node scripts/screens.mjs <outDir> [route ...]   (BASE_URL defaults to http://localhost:3000)
 * Also fails loudly on console errors and hydration warnings, and reports horizontal overflow.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [outDir = "/tmp/hydroflow/screens", ...routes] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const ROUTES = routes.length ? routes : ["/", "/daily-log", "/sales", "/stock", "/expenses", "/reports"];
const SIZES = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "phone", width: 390, height: 844 },
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let problems = 0;
for (const size of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.name === "phone" ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ROUTES) {
    errors.length = 0;
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const file = `${outDir}/${route === "/" ? "dashboard" : route.slice(1).replaceAll("/", "_")}-${size.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const flags = [];
    if (overflow > 0) flags.push(`HORIZONTAL OVERFLOW ${overflow}px`);
    if (errors.length) flags.push(`CONSOLE ERRORS: ${errors.join(" | ").slice(0, 400)}`);
    if (flags.length) problems++;
    console.log(`${flags.length ? "✗" : "✓"} ${size.name.padEnd(7)} ${route.padEnd(11)} ${file}${flags.length ? "  " + flags.join("; ") : ""}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(problems ? 1 : 0);
