# Scoping Solar Landing Page

Static public landing page for `www.scopingsolar.com`.

The hosted beta app lives separately at `app.scopingsolar.com` and should be protected by Cloudflare Access. Public visitors should not be able to open the beta app directly from this page.

## Project Type

Plain static site:

- `index.html`
- `styles.css`
- `app.js`
- `_headers`
- `README.md`
- `scoping_solar_icon.png`
- `scoping_solar_logo.png`

No React, Next.js, npm, or build step is required.

## Cloudflare Pages Settings

Create a separate Cloudflare Pages project for the landing page.

Recommended project name:

`scoping-solar-landing`

Use these settings:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Custom domain: `www.scopingsolar.com`

## Root Domain Redirect

Use `www.scopingsolar.com` as the canonical public website.

Create a Cloudflare Redirect Rule:

1. Open the `scopingsolar.com` zone in Cloudflare.
2. Go to `Rules` -> `Redirect Rules`.
3. Create a wildcard URL redirect.
4. Request URL: `https://scopingsolar.com/*`
5. Target URL: `https://www.scopingsolar.com/${1}`
6. Status code: `301`
7. Enable preserve query string.
8. Deploy the rule.

Also make sure both hostnames exist in Cloudflare:

- `www.scopingsolar.com` attached to the landing page Pages project.
- `scopingsolar.com` proxied through Cloudflare so the redirect rule can run.

## Beta App Lockdown

Protect `app.scopingsolar.com/*` with Cloudflare Access and allow only the owner/admin email while the product is in private beta.

Recommended owner/admin email:

`BlakeParkison@outlook.com`

The landing page does not grant app access after someone submits the request form.

## Request Access Form

The form currently:

- collects name, company, email, role/interest, and message
- stores a copy in this browser's `localStorage` as a placeholder
- opens a `mailto:` email to `BlakeParkison@outlook.com`

This is not a real backend. Replace it later with:

- secure API endpoint
- request-access database table
- admin approval workflow
- email notification
- audit history for approved/rejected testers

## Security Headers

The `_headers` file includes basic Cloudflare Pages security headers:

- Content Security Policy
- no iframe embedding
- nosniff
- referrer policy
- permissions policy
- HSTS

No analytics or third-party scripts are included.
