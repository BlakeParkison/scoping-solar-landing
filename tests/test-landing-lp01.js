const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const { PAYLOAD_ASSETS, verifyPayload } = require("../tools/build-private-beta-landing-payload");
const root = path.resolve(__dirname, "..");
const base = "f57b485a150c787d88992aad81caa3dc69b4d424";
const evidence = process.env.LP01_EVIDENCE_DIR || path.resolve(root, "../lp01-evidence");
const read = file => fs.readFileSync(path.join(root, file));
const old = file => execFileSync("git", ["show", base + ":" + file], { cwd: root });
const normalized = value => value.toString().replace(/\r\n/g, "\n");
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  fs.mkdirSync(evidence, { recursive: true });
  await test("Only homepage metadata/palette marker and appended scoped CSS change existing assets", () => {
    const home = normalized(read("index.html"))
      .replace(' class="landing-baseline"', "")
      .replace('content="#FFFFFF"', 'content="#08111f"')
      .replace("styles.css?v=lp01-white-black-r1", "styles.css?v=0.12.0-cross-device-confirmation-r2");
    assert.equal(home, normalized(old("index.html")));
    const css = normalized(read("styles.css")), before = normalized(old("styles.css"));
    assert.ok(css.startsWith(before));
    assert.doesNotMatch(css.slice(before.length), /!important|\*\s*[{,]|filter\s*:/);
    for (const file of PAYLOAD_ASSETS.filter(f => !["index.html", "styles.css"].includes(f)))
      assert.equal(normalized(read(file)), normalized(old(file)), file);
    assert.deepEqual(read("scoping_solar_logo.png"), old("scoping_solar_logo.png"));
  });
  await test("Curated eight-file local payload and existing secret scan remain valid", () => {
    const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "scoping-lp01-"));
    try {
      for (const file of PAYLOAD_ASSETS) {
        const to = path.join(dir, file);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(path.join(root, file), to);
      }
      assert.equal(verifyPayload(dir, "LP01-local-unpublished").assetCount, 8);
    } finally { fs.rmSync(dir, { recursive: true }); }
  });
  const browser = await chromium.launch({
    headless: true, executablePath: process.env.CHROME_EXE || "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });
  const observations = [];
  try {
    async function mount(prior, width, dark = false, large = false, signup = false) {
      const context = await browser.newContext({
        viewport: { width, height: 900 }, colorScheme: dark ? "dark" : "light",
        reducedMotion: "reduce", serviceWorkers: "block"
      });
      const errors = [], blocked = [];
      await context.route("**/*", async route => {
        const req = route.request(), url = new URL(req.url());
        if (url.origin !== "http://lp01.test" || req.method() !== "GET") {
          blocked.push(req.method() + " " + url.pathname); return route.abort();
        }
        const file = url.pathname === "/" ? "index.html" :
          /^\/start-free-trial\/?$/.test(url.pathname) ? "start-free-trial/index.html" : url.pathname.slice(1);
        if (!PAYLOAD_ASSETS.includes(file)) return route.abort();
        await route.fulfill({ body: prior ? old(file) : read(file),
          contentType: file.endsWith(".css") ? "text/css" : file.endsWith(".js") ? "application/javascript" :
            file.endsWith(".png") ? "image/png" : "text/html" });
      });
      const page = await context.newPage();
      page.on("pageerror", e => errors.push(e.message));
      await page.goto("http://lp01.test" + (signup ? "/start-free-trial" : "/"));
      await page.evaluate(() => document.fonts.ready);
      if (large) await page.evaluate(() => {
        const values = [...document.querySelectorAll("body *")].map(e => [e, parseFloat(getComputedStyle(e).fontSize)]);
        values.forEach(([e, size]) => { e.style.fontSize = (size * 1.25) + "px"; });
      });
      return { context, page, errors, blocked };
    }
    async function snapshot(page) {
      return page.evaluate(() => ({
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        geometry: [...document.querySelectorAll("header,main,section,footer,h1,h2,h3,p,a,input,select,textarea,button,img")]
          .map(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e);
            return [e.tagName, e.textContent.trim(), e.getAttribute("href"), e.getAttribute("src"),
              r.x, r.y, r.width, r.height, s.fontSize, s.fontFamily, s.lineHeight, s.padding, s.display]; }),
        tabOrder: [...document.querySelectorAll("a,input,select,textarea,button")].map(e => [e.tagName, e.getAttribute("href"), e.getAttribute("name"), e.tabIndex])
      }));
    }
    for (const spec of [
      { width: 1440, name: "desktop" }, { width: 390, name: "mobile" },
      { width: 320, name: "narrow" }, { width: 320, name: "large-text", large: true },
      { width: 390, name: "dark-preference", dark: true }
    ]) {
      await test(spec.name + ": black text, white sections, unchanged geometry/content/tab order and no new overflow", async () => {
        const before = await mount(true, spec.width, spec.dark, spec.large);
        const after = await mount(false, spec.width, spec.dark, spec.large);
        try {
          const a = await snapshot(before.page), b = await snapshot(after.page);
          assert.deepEqual(b.geometry, a.geometry);
          assert.deepEqual(b.tabOrder, a.tabOrder);
          assert.equal(b.overflow, a.overflow);
          observations.push({ name: spec.name, beforeOverflow: a.overflow, afterOverflow: b.overflow });
          const palette = await after.page.evaluate(() => ({
            scheme: getComputedStyle(document.documentElement).colorScheme,
            backgrounds: [...document.querySelectorAll("body,main>section,footer")].map(e => getComputedStyle(e).backgroundColor),
            text: [...document.querySelectorAll("h1,h2,h3,p,span,strong,time,label,li,a,input,select,textarea,button")]
              .filter(e => e.getClientRects().length && getComputedStyle(e).display !== "none")
              .map(e => ({ tag: e.tagName, color: getComputedStyle(e).color })),
            canvas: getComputedStyle(document.getElementById("heroCanvas")).visibility,
            images: [...document.images].map(e => ({ loaded: e.complete && e.naturalWidth > 0, filter: getComputedStyle(e).filter }))
          }));
          assert.equal(palette.scheme, "light");
          assert.ok(palette.backgrounds.every(c => c === "rgb(255, 255, 255)"));
          assert.deepEqual(palette.text.filter(x => x.color !== "rgb(0, 0, 0)"), []);
          assert.equal(palette.canvas, "hidden");
          assert.ok(palette.images.every(i => i.loaded && i.filter === "none"));
          assert.deepEqual(after.errors, []);
          assert.deepEqual(after.blocked, []);
          if (["desktop", "mobile"].includes(spec.name)) {
            await before.page.screenshot({ path: path.join(evidence, "before-" + spec.name + ".png"), fullPage: true });
            await after.page.screenshot({ path: path.join(evidence, "after-" + spec.name + ".png"), fullPage: true });
          }
        } finally { await before.context.close(); await after.context.close(); }
      });
    }
    await test("Controls preserve focus, hover/active/disabled distinction, validation and anchor behavior", async () => {
      const { page, context, errors, blocked } = await mount(false, 390);
      try {
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
        await page.keyboard.press("Enter");
        const button = page.locator(".hero-actions .primary");
        const bg = () => button.evaluate(e => getComputedStyle(e).backgroundColor);
        const normal = await bg();
        await button.hover();
        assert.notEqual(await bg(), normal);
        await page.mouse.down();
        assert.equal(await bg(), "rgb(214, 214, 214)");
        await page.mouse.up();
        await button.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        assert.equal(await button.evaluate(e => e === document.activeElement), true);
        assert.equal(await button.evaluate(e => getComputedStyle(e).outlineStyle), "solid");
        await button.press("Enter");
        assert.ok(await page.locator("#request-access").evaluate(e => Math.abs(e.getBoundingClientRect().top) < 2));
        await page.getByRole("button", { name: "Request Beta Access", exact: true }).click();
        assert.equal(await page.locator('input[name="name"]').evaluate(e => e.validity.valueMissing), true);
        assert.equal(await page.evaluate(() => localStorage.length), 0);
        await page.locator("#accessFormStatus").evaluate(e => { e.textContent = "Controlled status visibility fixture."; });
        assert.equal(await page.locator("#accessFormStatus").evaluate(e => getComputedStyle(e).color), "rgb(0, 0, 0)");
        const submit = page.locator('button[type="submit"]');
        await submit.evaluate(e => { e.disabled = true; });
        assert.equal(await submit.evaluate(e => getComputedStyle(e).cursor), "not-allowed");
        await page.locator('input[name="name"]').focus();
        await page.screenshot({ path: path.join(evidence, "after-form-focus.png") });
        const beta = page.getByRole("link", { name: "Open private Scoping Solar beta signup" });
        assert.equal(await beta.evaluate(e => getComputedStyle(e).textDecorationLine), "underline");
        await beta.press("Enter");
        await page.getByRole("heading", { name: "Start Free Beta Trial" }).waitFor();
        assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
      } finally { await context.close(); }
    });
    await test("Signup route computed styles remain identical under shared CSS in light and dark OS modes", async () => {
      for (const dark of [false, true]) {
        const a = await mount(true, 390, dark, false, true), b = await mount(false, 390, dark, false, true);
        const styles = page => page.evaluate(() => [...document.querySelectorAll("*")].map(e => {
          const s = getComputedStyle(e);
          return Array.from(s).map(key => [key, s.getPropertyValue(key)]);
        }));
        try {
          assert.deepEqual(await styles(b.page), await styles(a.page));
          assert.equal(await b.page.locator("details").count(), await a.page.locator("details").count());
          const detail = b.page.locator("details").first();
          if (await detail.count()) {
            await detail.locator("summary").click();
            assert.equal(await detail.evaluate(e => e.open), true);
          }
        } finally { await a.context.close(); await b.context.close(); }
      }
    });
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(evidence, "results.json"), JSON.stringify({ passed, observations, sourceOnly: true }, null, 2));
  console.log(JSON.stringify({ passed, observations }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });

