const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const PAYLOAD_ASSETS = [
  "_headers",
  "app.js",
  "index.html",
  "private-beta.css",
  "private-beta.js",
  "scoping_solar_icon.png",
  "start-free-trial/index.html",
  "styles.css"
];
const FORBIDDEN_PATTERNS = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  { name: "Supabase secret", pattern: /\bsb_secret_[A-Za-z0-9_-]+/ },
  { name: "service-role assignment", pattern: /\bSUPABASE_SERVICE_ROLE_KEY\s*[:=]/i },
  { name: "beta access-code assignment", pattern: /\bPRIVATE_BETA_ACCESS_CODE\s*[:=]/i },
  { name: "callback secret assignment", pattern: /\bFREE_BETA_CALLBACK_SECRET\s*[:=]/i },
  { name: "embedded bearer authorization", pattern: /\bAuthorization\s*:\s*["']Bearer\s+[A-Za-z0-9._~-]+/i }
];

function fail(message) {
  throw new Error(message);
}

function findGit() {
  const configured = String(process.env.GIT_EXE || "").trim();
  if (configured && fs.existsSync(configured)) return configured;
  try {
    childProcess.execFileSync("git", ["--version"], { stdio: "ignore" });
    return "git";
  } catch {}
  if (process.platform === "win32") {
    const desktopRoot = path.join(os.homedir(), "AppData", "Local", "GitHubDesktop");
    if (fs.existsSync(desktopRoot)) {
      const candidate = fs.readdirSync(desktopRoot)
        .filter(name => /^app-/.test(name))
        .sort()
        .reverse()
        .map(name => path.join(desktopRoot, name, "resources", "app", "git", "cmd", "git.exe"))
        .find(file => fs.existsSync(file));
      if (candidate) return candidate;
    }
  }
  fail("Git executable not found. Set GIT_EXE to the trusted Git executable path.");
}

function gitText(git, args) {
  return childProcess.execFileSync(git, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function gitBlob(git, sha, relativePath) {
  return childProcess.execFileSync(git, ["show", `${sha}:${relativePath}`], {
    cwd: root,
    encoding: null,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute, relative));
    else files.push(relative.replace(/\\/g, "/"));
  }
  return files.sort();
}

function scanPayload(directory) {
  for (const relativePath of listFiles(directory)) {
    if (!/\.(?:html|js|css|json)$/.test(relativePath) && relativePath !== "_headers") continue;
    const source = fs.readFileSync(path.join(directory, relativePath), "utf8");
    for (const check of FORBIDDEN_PATTERNS) {
      if (check.pattern.test(source)) fail(`Forbidden ${check.name} detected in ${relativePath}.`);
    }
  }
}

function verifyPayload(directory, sha) {
  const actual = listFiles(directory);
  const expected = [...PAYLOAD_ASSETS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`Payload file set mismatch. Expected ${expected.length}; found ${actual.length}.`);
  }
  const home = fs.readFileSync(path.join(directory, "index.html"), "utf8");
  const signup = fs.readFileSync(path.join(directory, "start-free-trial", "index.html"), "utf8");
  const script = fs.readFileSync(path.join(directory, "private-beta.js"), "utf8");
  if (!home.includes('href="/start-free-trial"')) fail("The private-beta footer route is missing.");
  if (!signup.includes('name="privateBetaAccessCode"')) fail("The invitation-code field is missing.");
  if (!script.includes('PRIVATE_BETA_SIGNUP_ENDPOINT = "/api/trial/signup"')) fail("The same-origin signup endpoint is missing.");
  if (/turnstile|challenges\.cloudflare\.com/i.test(signup + script)) fail("Turnstile must not be required by the invitation-only landing flow.");
  scanPayload(directory);
  return { sourceSha: sha, assetCount: actual.length };
}

function main() {
  const git = findGit();
  const sha = gitText(git, ["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/i.test(sha)) fail("Could not resolve exact source commit.");
  if (gitText(git, ["status", "--porcelain"])) fail("Working tree must be clean before packaging.");
  const upstream = gitText(git, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  if (gitText(git, ["rev-list", "--left-right", "--count", `${sha}...${upstream}`]) !== "0\t0") {
    fail("Source must be synchronized with its private remote.");
  }
  const outputRoot = process.env.PRIVATE_BETA_BUILD_ROOT
    ? path.resolve(process.env.PRIVATE_BETA_BUILD_ROOT)
    : path.resolve(root, "..", "..", "..", "app", "build-v0.12.0");
  const output = path.join(outputRoot, `pages-private-beta-landing-${sha.slice(0, 7)}`);
  if (fs.existsSync(output)) fail(`Output already exists: ${output}`);
  fs.mkdirSync(output, { recursive: false });
  for (const relativePath of PAYLOAD_ASSETS) {
    const destination = path.join(output, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, gitBlob(git, sha, relativePath));
  }
  const result = verifyPayload(output, sha);
  console.log(`Prepared ${result.assetCount} curated invitation-only landing assets.`);
  console.log(`Source SHA: ${result.sourceSha}`);
  console.log(`Output: ${output}`);
}

module.exports = { PAYLOAD_ASSETS, FORBIDDEN_PATTERNS, listFiles, scanPayload, verifyPayload };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Private-beta landing payload build failed: ${error.message}`);
    process.exit(1);
  }
}
