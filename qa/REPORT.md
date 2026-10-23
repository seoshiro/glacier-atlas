# GLACIER release QA

## Outcome

GLACIER is a complete static portfolio experience in an isolated workspace. Its four narrative sections move from original alpine terrain through a three-chapter route to field notes and an exportable card. Terrain, elevations, distances, places and expedition are explicitly fictional.

No unresolved P1/P2 application finding remains from the covered local checks. Release CI and live deployment evidence will be added after publication.

## Five actual roles

| Role | Ownership and evidence |
|---|---|
| Main integrator | App, editorial layout, navigation/history, project config, release and this report |
| Art / terrain | Separate author: deterministic heightfield, faceted SVG mesh, contours, glacier, geometry tests |
| Interaction | Separate author: validated progress, error recovery, SVG export, card UI and unit tests |
| Independent visual browser QA | Separate reviewer: original before/after screenshots, five viewport sizes, state and marker-inset regressions; `visual-review.md` |
| Independent code / performance / security QA | Separate reviewer: flows, axe, keyboard/touch, no-WebGL, error monitoring, source/CI review and measurements; `code-review.md` |

The ECC-derived Windows engineering skill supplied instructions only; it is not an installed runtime or hook system. UI Build/Review, React Review and Verification guidance was read and applied. 21st CLI was absent; the available free catalog search failed. No 21st installation or previously denied installation was retried. No paid retrieval or stock asset was used.

## Local evidence

| Check | Result |
|---|---|
| TypeScript | PASS |
| ESLint | PASS |
| Unit tests | PASS: 12 across progress/export, navigation and terrain geometry |
| Production build | PASS |
| Functional / accessibility browser suite | PASS: 16 in 24.8 seconds after the CI contrast fix |
| Independent final visual suite | PASS: 2 in 15.4 seconds after the CI contrast fix |
| Axe | Zero violations in six combinations: 390/1440px × day/map/night |
| Responsive | 320×780, 390×844, 768×1024, 1440×1000, 844×390; no overflow and marker labels inside viewport |
| Runtime | No captured console, page, failed-request or HTTP errors in covered flows |
| Storage | Valid/duplicate/corrupted/version-mismatched/denied storage, persistence and reset covered |
| History | Direct chapter query and saved chapter, Back, reload, repeated chapter actions covered |
| Export | Two real downloads, fictional-label/content checks, interrupted export recovery, keyboard export covered |
| Rendering | Works with WebGL APIs disabled; no RAF or WebGL in application code |

Browser checks used existing Chrome 155.0.8059.86 on Windows, headless isolated contexts and one worker. The preview was the production build at this project's port 4186. Restricted-network and listener-readiness failures happened before the successful app checks and are recorded in the independent reports; they were not hidden as passing tests. No automatic approval rejection remains unresolved.

## Visual fixes

The independent reviewer found and the integrator fixed hero-copy/route-label collisions, mobile caption/control overlap, fine mobile label text, the upper map marker behind the wordmark, and a 320px label inset issue. The original `screenshots/before-*` images are retained. Final `screenshots/after-*` captures include loaded keepsake images, map/night palettes and visible keyboard focus. The first full-page baseline did not scroll to activate the lazy card; the revised capture explicitly checks image completion and natural width.

## Performance

Six sequential fresh-context samples, three each at 1440×1000 and 390×844, DPR 1, reduced motion, unthrottled Windows CPU/network. This is a bounded local measurement, not a phone benchmark or field metric. Raw timings and exact conditions: `performance-local.json`.

| Metric | Desktop median | Narrow viewport median |
|---|---:|---:|
| Synthetic LCP | 284 ms | 276 ms |
| Load event end | 74.2 ms | 84.4 ms |
| JS heap | 4.20 MB | 4.20 MB |
| Initial transferred document/resources | 88,399 bytes | 88,399 bytes |

No startup long task was observed in these samples. All 24 automation click-to-two-frame observations were 41.46–114.97ms including Playwright, scrolling and frame scheduling; this is not INP. SVG content may not be the LCP candidate. The art author separately measured shared contour samples reducing identical Node geometry generation from about 132–148ms to 16–29ms; no whole-site comparative speedup is claimed. The previous samples are retained in `performance-precontrast-fix.json`.

No external images/fonts, backend or analytics requests exist. Geometry is computed once; the SVG is static. CSS transitions are finite and reduced motion disables them. There is no active rendering loop to stop offscreen/hidden and no DPR-sized GPU or Canvas allocation.

## Dependencies and security

Production audit passed with zero advisories (`dependency-audit.json`). The full audit found dev-only Vitest/mocker/tinypool advisories (`dependency-audit-before.json`), prompting an explicit Vitest update; final audit result is recorded in `dependency-audit-all.json` and the final release update below. npm audit sends dependency names/versions to the npm registry advisory endpoint. No new account, key, OAuth flow or hosted scanner was added.

Vitest was upgraded from 3.2.7 to 5.0.5. The final full audit exits 0 with **zero advisories across production and development dependencies**. Lint, types, all 12 units and production build passed after the update. Runtime JS/CSS asset bytes and hashes are unchanged, so the covered local browser/performance evidence still targets the exact application bundle.

## CI-discovered contrast defect

The first CI run, [40038410506](https://github.com/seoshiro/glacier-atlas/actions/runs/40038410506), passed 16 of 17 browser tests and blocked deployment on a real 1440px night-palette contrast issue. While the active marker background animated from day red to night peach, its number changed to dark ink immediately. An intermediate frame measured 4.38:1 against the required 4.5:1. Raw output is retained in `ci-first-failure.log`; this was not classified as a GPU warning or waived.

The background transition was removed from the marker so text/background palette colors change atomically; the finite shadow transition remains. A new regression computes actual WCAG contrast on every sampled animation frame during four rapid palette reversals, interrupting the old 200ms transition. All 16 owned functional/accessibility checks and both independent visual checks passed after this fix. Local measurements were rerun on the new assets; the CI rerun remains a release gate.

Source inspection covered validated storage and URL parsing, React text rendering, static XML escaping, safe self-contained SVG data/downloads, bounded Blob URL revocation, dependency scripts, no secrets, no arbitrary HTML sink and scoped CI permissions. This is a proportionate review, not a claim of complete security.

## Release and limits

Target: [public repository](https://github.com/seoshiro/glacier-atlas), [free GitHub Pages site](https://seoshiro.github.io/glacier-atlas/). GitHub Actions requires lint, types, units, production build and the one-worker Chrome suite before publishing. Existing runner Chrome is used without apt installation. Exact deployed bytes are checked against local `dist` by `scripts/verify-integrity.mjs` and recorded in `live-integrity.json` after deployment.

Physical-device testing, Safari, Firefox, screen-reader usability testing, throttled mobile CPU/network and field performance are NOT TESTED. Local storage is browser-local and optional. Downloads depend on browser permissions. Rollback: revert a project commit and let the same free Pages workflow redeploy. Other repositories and Roblox were not modified.
