# Scoping Solar Landing Page

Static landing page for Scoping Solar.

This is separate from the beta app hosted at:

https://app.scopingsolar.com

## Project Type

Plain static site:

- `index.html`
- `styles.css`
- `app.js`
- `_headers`
- `README.md`

No React, Next.js, npm, or build step is required.

## Cloudflare Pages Settings

Create a separate Cloudflare Pages project for the landing page.

Recommended project name:

`scoping-solar-landing`

Use these settings:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Production branch: `main`

## Custom Domain

Attach the Pages project to:

`www.scopingsolar.com`

Recommended later setup:

- `www.scopingsolar.com` -> landing page
- `scopingsolar.com` -> redirect to `www.scopingsolar.com`
- `app.scopingsolar.com` -> beta app
- `api.scopingsolar.com` -> future backend/API if needed
- `docs.scopingsolar.com` -> future help docs

## Current Beta Links

The landing page currently uses mailto links for access requests and contact:

`BlakeParkison@outlook.com`

Replace these later with a secure form endpoint or backend lead-capture flow.

## Security Headers

The `_headers` file includes basic Cloudflare Pages security headers:

- Content Security Policy
- no iframe embedding
- nosniff
- referrer policy
- permissions policy
- HSTS

No analytics or third-party scripts are included.
