const fs = require("fs");
const path = require("path");
const { PAYLOAD_ASSETS, FORBIDDEN_PATTERNS } = require("../tools/build-private-beta-landing-payload.js");

const root = path.join(__dirname, "..");
const builder = fs.readFileSync(path.join(root, "tools", "build-private-beta-landing-payload.js"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const signup = fs.readFileSync(path.join(root, "start-free-trial", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "private-beta.v0.12.0-r2.js"), "utf8");

let passed = 0;
const failures = [];
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL: ${name}`);
  }
}

check("curated landing payload contains eight exact production assets", PAYLOAD_ASSETS.length === 8);
check("payload excludes backend, migrations, Android, tests, docs, environments, and archives", !PAYLOAD_ASSETS.some(file => /(?:backend|migration|android|test|docs?|\.env|\.zip|\.apk)/i.test(file)));
check("payload retains the public landing and dedicated signup route", PAYLOAD_ASSETS.includes("index.html") && PAYLOAD_ASSETS.includes("start-free-trial/index.html"));
check("footer link is the only discreet landing entry point", home.includes('aria-label="Open private Scoping Solar beta signup"') && !home.includes("Start Free Trial"));
check("signup uses the same-origin server route", script.includes('PRIVATE_BETA_SIGNUP_ENDPOINT = "/api/trial/signup"'));
check("raw invitation code is not assigned in tracked assets", !/^PRIVATE_BETA_ACCESS_CODE\s*=/m.test(home + signup + script));
check("payload scan covers private code, callback secret, and key material", ["beta access-code assignment", "callback secret assignment", "private key"].every(name => FORBIDDEN_PATTERNS.some(item => item.name === name)));
check("builder reads only exact committed Git blobs", builder.includes("gitBlob(git, sha, relativePath)"));
check("builder requires a clean synchronized source", builder.includes("Working tree must be clean") && builder.includes("Source must be synchronized"));
check("builder refuses to replace an immutable payload", builder.includes("Output already exists"));
check("Turnstile remains absent from invitation-only landing assets", !/turnstile|challenges\.cloudflare\.com/i.test(signup + script));
check("production login remains the returning-user destination", signup.includes('href="https://app.scopingsolar.com">Log In</a>'));

if (failures.length) {
  console.error(`Failed ${failures.length} landing payload check(s): ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`Passed ${passed}/${passed} private-beta landing payload checks.`);
