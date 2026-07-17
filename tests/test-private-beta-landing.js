const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const signup = fs.readFileSync(path.join(root, "start-free-trial", "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "private-beta.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const betaStyles = fs.readFileSync(path.join(root, "private-beta.css"), "utf8");
const headers = fs.readFileSync(path.join(root, "_headers"), "utf8");

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

check("discreet footer link routes to the private signup", home.includes('class="private-beta-footer-link"') && home.includes('href="/start-free-trial"'));
check("footer link has the requested accessible label", home.includes('aria-label="Open private Scoping Solar beta signup"'));
check("footer link has mouse and keyboard affordances", styles.includes(".private-beta-footer-link:hover") && styles.includes(".private-beta-footer-link:focus-visible") && styles.includes("box-shadow"));
check("signup remains a landing-site route", signup.includes('href="https://app.scopingsolar.com">Log In</a>') && !signup.includes("Log in first."));
check("signup states the complete invitation-only offer", ["30 days", "One project", "One seat", "No credit card", "Paid plans are not yet available"].every(text => signup.includes(text)));
check("signup includes all required identity and consent fields", ["privateBetaAccessCode", "firstName", "lastName", "companyName", "email", "password", "confirmPassword", "termsAccepted", "privacyAccepted"].every(name => signup.includes(`name="${name}"`)));
check("access code field disables browser persistence hints", signup.includes('name="privateBetaAccessCode"') && signup.includes('autocomplete="off"') && signup.includes('data-1p-ignore="true"') && signup.includes('data-lpignore="true"'));
check("signup posts only to the same-origin trial route", script.includes('PRIVATE_BETA_SIGNUP_ENDPOINT = "/api/trial/signup"') && !script.includes("workers.dev") && !script.includes("supabase.co"));
check("access code is cleared before the network request", script.indexOf('accessCodeField.value = ""') < script.indexOf("await fetch(PRIVATE_BETA_SIGNUP_ENDPOINT"));
check("secret form values never enter browser storage or logs", !/localStorage|sessionStorage|indexedDB|document\.cookie|console\.(?:log|warn|error)/.test(script));
check("Turnstile is absent only from this invitation-only customer flow", !/turnstile|challenges\.cloudflare\.com/i.test(signup + script));
check("duplicate form submission is blocked", script.includes("if (submitting") && script.includes("submit.disabled = true"));
check("generic server errors do not enumerate accounts", !/already exists|email exists|registered account/i.test(signup + script));
check("draft terms and privacy disclosures remain visible", ["Draft - review required", "Free Beta Terms", "Privacy Notice", "not legal advice"].every(text => signup.includes(text)));
check("verification instructions support another device and target the production app", signup.includes("any device or supported browser") && signup.includes("Confirm email and continue") && signup.includes("https://app.scopingsolar.com"));
check("signup never places the beta code in a URL", !/privateBetaAccessCode[^\n]*(?:searchParams|location|href)|[?&](?:code|access_code)=/i.test(script));
check("fresh landing assets are immutable by identity", ["0.12.0-cross-device-confirmation-r1", "private-beta.js", "private-beta.css"].every(text => home.includes(text) || signup.includes(text)) && headers.includes("max-age=31536000, immutable"));
check("responsive signup styles avoid viewport-overflow layouts", betaStyles.includes("@media (max-width: 640px)") && betaStyles.includes("grid-template-columns: 1fr"));
check("landing CSP permits only same-origin signup API calls", /connect-src 'self'/.test(headers) && !/connect-src[^;]*workers\.dev/.test(headers));

if (failures.length) {
  console.error(`Failed ${failures.length} private-beta landing check(s): ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`Passed ${passed}/${passed} private-beta landing checks.`);
