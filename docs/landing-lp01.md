# LP-01: White / Black Landing Baseline

Date: 2026-11-06. Status: source complete; local commit only; Blake visual acceptance deferred.

## Source and Publication Boundary

- Repository: BlakeParkison/scoping-solar-landing.
- Worktree: D:/PERSONAL/SCOPINGSOLAR.COM/repos/scoping-solar-landing/scoping-solar-landing.
- Starting branch: main, clean and synchronized.
- Starting and freshly fetched origin/main: f57b485a150c787d88992aad81caa3dc69b4d424.
- Feature: feature/landing-white-black-baseline, initially no upstream.
- Final source/documentation commit: the commit containing this report; exact post-commit
  hash recorded externally in Project Documents/LANDING-LP01-RECEIPT.json.
- Public homepage: / via index.html. /start-free-trial uses styles.css plus private-beta.css.
- README points at an older website export location; Git source above is authoritative for this patch.
- Plain static files; no dependency manifest or compilation step. Existing payload tool
  assembles eight allowlisted assets and requires clean, synchronized committed source.
- No tracked GitHub workflow or hosting branch policy establishes a no-preview push path.
  README describes Pages hosting but not current automatic-preview exclusions. Manual
  payload tooling does not prove Git pushes are harmless. No push, hosted preview,
  deployment, hosting-setting change or production inspection was performed.
- The production packager was not bypassed or weakened. Its existing verifyPayload
  and secret scanner passed on a temporary local eight-file candidate.

## Bounded Patch

Exactly four repository files:

1. index.html: homepage-only landing-baseline root class; white browser theme metadata;
   stylesheet query lp01-white-black-r1. All copy, assets, SEO, link targets and DOM
   order otherwise identical.
2. styles.css: appended homepage-scoped palette overrides; original CSS prefix unchanged.
3. tests/test-landing-lp01.js: existing Playwright library and Node assertions; no new dependency.
4. docs/landing-lp01.md: this source-only handoff.

Existing tokens: --ink/--navy/--panel/--panel-soft #FFFFFF;
--text/--soft/--muted/--solar/--cyan #000000; --green #E5E5E5;
--line/--line-dark #B3B3B3. Small control tokens:
--control #F2F2F2, --control-hover #E5E5E5, --control-active #D6D6D6.
Primary controls retain their size/weight/position with black inset borders;
secondary borders are neutral. Keyboard focus has a black outline.
Ordinary links use underlining rather than a colored accent.
White section surfaces and black text persist under OS dark preference.
No existing user-selectable theme or stored palette preference was found.

The colored decorative canvas is hidden using scoped visibility, preserving
its box and existing script. Its decorative overlay is white. No photo/logo
filter, asset pixel edit or replacement branding. Original icon retains its
blue/gold pixels and existing white tile; this intentional asset exception is
not a decorative UI palette. Browser-native validation popovers remain OS-owned.
Existing animation code is unchanged; this task makes no performance claim.

No layout, spacing, font family/size, responsive breakpoint, form handler,
validation, submission destination or access policy changes. The current source
renders a serif font because its existing font inheritance rule supersedes the
body declaration; that prior typography is intentionally preserved.
No mobile-menu toggle or homepage disclosure exists: existing mobile navigation
still hides non-CTA links at its original breakpoint. Signup disclosures remain intact.
The previously discreet footer signup link is now black and underlined as required;
its label, route and authorization behavior are unchanged.

## Actual Local Verification

- node tests/test-private-beta-landing.js: 21/21.
- node tests/test-private-beta-landing-payload.js: 12/12.
- node tests/test-landing-lp01.js: 9/9 grouped scenarios.
- node --check tests/test-landing-lp01.js; git diff --check: pass.
- Existing curated payload/secret scan: pass, eight exact files.
- Changed-file sensitive-value scan: pass.
- No catalog regression suite rerun; earlier catalog totals are historical.

Playwright runs isolated headless Chrome contexts with no real-user profile,
service workers blocked and every request intercepted. Only allowlisted local
GET assets are served; external calls and submissions are blocked. No live form
submission/account data. Invalid empty form exercises native validation without
local-storage writes; status text uses a controlled fixture. Valid mailto handling
is preserved byte-for-byte, not sent.

Compared baseline Git blobs to current files at 1440, 390 and 320px, plus 320px
with 125% text and 390px OS dark preference. All five had zero horizontal overflow
before and after. Geometry, content, link/asset destinations and tab-order arrays
matched exactly. Black ordinary text, white section surfaces, logo loading,
no recoloring, keyboard Tab/Shift+Tab, focus, hover/active/disabled controls,
anchor navigation and signup entry passed. Full computed styles on every signup
element matched the baseline under both OS color preferences.

Initial focus fixture incorrectly expected :focus-visible after mouse/programmatic
focus. Corrected to actual Tab/Shift+Tab navigation; no CSS behavior weakened.
Final run has no unexpected failures or page errors.

Evidence directory (outside repository):
D:/PERSONAL/SCOPINGSOLAR.COM/repos/scoping-solar-landing/lp01-evidence.
before-desktop.png, after-desktop.png, before-mobile.png, after-mobile.png,
after-form-focus.png and results.json. All five screenshots visually inspected.
Desktop full-page dimensions: 1440x4847 both versions; mobile: 390x7914 both.
No physical/mobile-device acceptance or live browser behavior claimed.
The older cross-surface private-beta-browser.js requires application callback/login
fixtures and was not rerun for this isolated homepage styling patch. Applicable
landing navigation/signup styling/disclosures are covered by the new local test.

## Preserved Application and Catalog

Separate application worktree:
D:/PERSONAL/SCOPINGSOLAR.COM/app/repo-worktree-ui-stage1.
Branch feature/equipment-catalog-phase16a-homegrid.
HEAD aaa006ad0de6440311cdd1cae38691ca8d730604, unchanged and clean.
No application repository files modified, including documentation.
Catalog 207 identities,20 profiles,5284 claims and all existing flags/evidence
remain at that checkpoint. F06/two F05 expected defects and F04 deferral unchanged.
No APK/native, authentication, infrastructure, schema, storage, survey, calculation,
pricing, analytics, marketing copy or landing signup changes.

## Delivery, Backlog and Next Action

Sanitized OneDrive Project Documents: LANDING-LP01.md, current Chatty handoff
with LP-01 section clearly separate from preserved Phase16A, LP-01 Evidence,
and external LANDING-LP01-RECEIPT.json. Existing shared ACCEPTANCE-BACKLOG.md
updated once for LP-01; historical catalog evidence packages are not rewritten.
Receipt records actual final commit, hashes and Windows OneDrive sync result.

Blake should compare desktop/mobile screenshots, contrast, button hierarchy,
focus appearance and intentionally unchanged logo. Visual acceptance remains
deferred. Public website has NOT changed. Push is withheld because automatic
production/preview behavior is unverified; later publication needs separate
authorization. No further investigation or redesign begins automatically.

Rollback: reviewed normal revert of the single landing-only commit recorded in
the external receipt. Parent/source baseline is
f57b485a150c787d88992aad81caa3dc69b4d424. Do not reset/force-push or roll back
the catalog/application branch. STOP and return handoff to Blake.
