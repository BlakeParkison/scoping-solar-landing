const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const landingOrigin = process.env.PRIVATE_BETA_LANDING_PREVIEW || "http://127.0.0.1:4179";
const appOrigin = process.env.PRIVATE_BETA_APP_PREVIEW || "http://127.0.0.1:4178";
const root = path.join(__dirname, "..");
const evidenceDirectory = process.env.PRIVATE_BETA_EVIDENCE_DIR
  ? path.resolve(process.env.PRIVATE_BETA_EVIDENCE_DIR)
  : path.resolve(root, "..", "..", "..", "app", "android-test-results");

function installedChromePath() {
  const candidates = [
    process.env.CHROME_EXE,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || "";
}

async function assertNoOverflow(page, label) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  if (layout.content > layout.viewport + 1) throw new Error(`${label} has horizontal overflow (${layout.content} > ${layout.viewport}).`);
}

async function assertNoConsoleErrors(page, errors, label) {
  const relevant = errors.filter(message => !/favicon\.ico|ERR_FAILED.*supabase/i.test(message));
  if (relevant.length) throw new Error(`${label} emitted browser errors: ${relevant.join(" | ")}`);
}

async function testViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));

  await page.goto(`${landingOrigin}/`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Solar & Battery Scoping, Built for the Real Workflow" }).waitFor();
  const betaLink = page.getByRole("link", { name: "Open private Scoping Solar beta signup" });
  if (await betaLink.count() !== 1) throw new Error(`${name}: expected one discreet beta link.`);
  await betaLink.focus();
  const focusStyle = await betaLink.evaluate(element => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, shadow: style.boxShadow, cursor: style.cursor };
  });
  if (focusStyle.outline === "none" && focusStyle.shadow === "none") throw new Error(`${name}: footer link lacks visible keyboard focus.`);
  if (focusStyle.cursor !== "pointer") throw new Error(`${name}: footer link lacks pointer affordance.`);
  await assertNoOverflow(page, `${name} landing`);
  await page.screenshot({ path: path.join(evidenceDirectory, `v0.12.0-private-beta-landing-${name}.png`), fullPage: true });

  await betaLink.press("Enter");
  await page.waitForURL(new RegExp(`^${landingOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/start-free-trial/?$`));
  await page.getByRole("heading", { name: "Start Free Beta Trial" }).waitFor();
  await page.getByLabel("Private beta access code").waitFor();
  const codePersistence = await page.getByLabel("Private beta access code").evaluate(input => ({
    autocomplete: input.getAttribute("autocomplete"),
    type: input.getAttribute("type")
  }));
  if (codePersistence.autocomplete !== "off" || codePersistence.type !== "password") throw new Error(`${name}: invitation code persistence controls are incorrect.`);
  if (await page.locator('iframe[src*="challenges.cloudflare.com"]').count()) throw new Error(`${name}: invitation-only form unexpectedly loaded Turnstile.`);
  await assertNoOverflow(page, `${name} signup`);
  await page.screenshot({ path: path.join(evidenceDirectory, `v0.12.0-private-beta-signup-${name}.png`), fullPage: true });

  await page.goto(`${appOrigin}/`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Log in to Scoping Solar." }).waitFor();
  const signupLink = page.getByRole("link", { name: /Start your free trial/i });
  const signupDestination = await signupLink.getAttribute("href");
  if (signupDestination !== `${landingOrigin}/start-free-trial`) throw new Error(`${name}: app login does not link to the landing signup.`);
  if (await page.getByLabel("Private beta access code").count()) throw new Error(`${name}: the full signup form leaked into the app login.`);

  await page.goto(`${appOrigin}/beta/callback`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Finishing your account." }).waitFor();
  await page.getByText("The verification link is missing its one-time code.").waitFor();
  const restartDestination = await page.getByRole("link", { name: "Start again" }).getAttribute("href");
  if (restartDestination !== `${landingOrigin}/start-free-trial`) throw new Error(`${name}: callback recovery does not return to the landing signup.`);
  await assertNoOverflow(page, `${name} callback`);
  await assertNoConsoleErrors(page, errors, name);
  await context.close();
}

async function main() {
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  const executablePath = installedChromePath();
  if (!executablePath) throw new Error("A local Chrome executable is required for the browser acceptance test.");
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    await testViewport(browser, "desktop", { width: 1440, height: 900 });
    await testViewport(browser, "mobile", { width: 390, height: 844 });
  } finally {
    await browser.close();
  }
  console.log("Passed 18/18 private-beta Chromium landing/app checks.");
  console.log(`Sanitized evidence: ${evidenceDirectory}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
