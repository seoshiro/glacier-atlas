# Independent code, performance and security review

Status: final local production-preview functional, accessibility and bounded performance checks PASS; live deployed checks pending. This file records checks actually performed; unrun checks remain NOT TESTED.

## Scope and method

- Independent role: code / performance / security QA, separate from the app integrator, terrain author, interaction author and visual reviewer.
- Source reviewed: chapter data, progress validation and persistence, SVG export, card component, terrain geometry/component/styles, App integration, URL navigation and deployment workflow.
- Instructions applied: ECC-derived Windows frontend/performance and security/release references, React best practices. ECC is an instruction workflow, not a runtime integration.
- Browser tests use existing Google Chrome in isolated contexts, one Playwright worker, and this project's port 4186. These are automated browser checks, not human device testing.
- No 21st CLI installation or retry of a denied operation. No new API keys, authentication flows, security settings or paid services.

## Source findings before browser verification

No proven P1/P2 security defect in the files currently reviewed.

Source review found a chapter-history edge case: loading a saved second chapter at an address without a chapter query, selecting the third chapter, then going Back would fall back to the first chapter. The integrator canonicalized the initial chapter query with `replaceState`. The dedicated saved-progress Back regression passes in the real browser. This was caught in source review and verified after correction; no pre-fix browser failure is claimed.

- Progress is versioned, validated, bounded, deduplicated and limited to the three known chapter indices. Corruption, denied storage access and unavailable storage are caught.
- SVG export uses authored geometry and static chapter text escaped for XML. It contains no script, external image/font/network reference or active HTML. Download Blob URLs are revoked after a bounded delay and during unmount cleanup.
- React renders text directly. The preview uses an encoded, generated SVG data image rather than raw markup insertion.
- Terrain generation is deterministic and occurs once at module scope. No continuous animation frame loop or WebGL dependency exists. Reduced motion disables scene transitions; native chapter marker buttons include names and pressed state.
- Startup contour generation has a bounded synchronous sampling workload. A Node v24.18.0 / Windows microcheck generated 196,886 path characters in 30.4ms cold and 18.3 / 15.7 / 17.6 / 14.3ms warm in the same unthrottled process. No optimization was warranted by this measurement. Browser startup is measured separately.
- URL selection accepts only exact chapter values 1/2/3, preserves existing non-chapter query parameters and anchors, and emits same-origin path/query/hash values. No user-provided HTML sink is present.
- CI builds before serving the production preview, uses runner-installed Chrome, runs one browser worker, and grants Pages / ID-token write permissions only to the deployment job.

The integrator's full dependency audit found development-only Vitest 3.2.7 advisories, including `@vitest/mocker` (moderate) and `tinypool` (critical), despite a clean production-only audit. The baseline is preserved in `qa/dependency-audit-before.json`. Vitest was upgraded to 5.0.5; the final all-dependencies audit in `qa/dependency-audit-all.json` exits 0 with zero advisories. Lint, types, all 12 unit tests and production build passed after the upgrade. Runtime JS/CSS assets were unchanged by that dependency-only upgrade. This role read the final audit file and confirmed its zero-advisory contents; the audit command result and upgrade build-hash comparison were reported by the integrator. This role did not independently rerun npm audit.

## CI accessibility finding and correction

The first CI run on source `88bcc7a47bfefe1bc907f6d55baed8af146bcb3b` failed **1 of 17 browser tests** and blocked deployment. This was a real P2 accessibility defect. The 1440px night-palette axe check sampled the active terrain marker during its background-color transition: foreground `#14383d`, intermediate background `#e37b64`, contrast **4.38:1**, below the 4.5:1 AA threshold for the marker's 8px bold text. Raw evidence is preserved in `qa/ci-first-failure.log`; this role read the exact failing node and color values.

The integrator removed the marker's background-color transition, so foreground and background palette colors switch together; the decorative box-shadow transition remains. No axe rule, threshold or assertion was weakened, and no wait was added to skip the defective frames. A dedicated independent regression now samples actual computed text/background contrast on successive animation frames through four quick day/night reversals, each after 90ms so any previous 200ms transition would be interrupted. Every sampled ratio must remain at least 4.5:1. This regression and the unchanged axe checks pass locally on the corrected runtime. Corrected CI and live checks are recorded below when available.

## Automated checks

| Check | Status | Evidence |
|---|---|---|
| Chapter persistence, repeated selection, browser history and reset | PASS | `tests/flows.spec.ts`, including saved-progress Back regression |
| SVG repeated export and one-time interrupted export recovery | PASS | Two real SVG downloads plus one-time browser API failure and recovery |
| Corrupted / unavailable browser storage | PASS | Invalid JSON, unsupported schema, invalid chapter/visited array, denied Storage property |
| Browser console, page and network errors | PASS | No captured errors / failed requests / HTTP >=400 in flow tests |
| Axe names, contrast and semantics, day/map/night, 390/1440px | PASS | Zero violations across all six states |
| Keyboard focus, Enter/Space and keyboard export | PASS | Focus outline computed present; keyboard selects and downloads |
| Contrast during quick interrupted palette changes | PASS | Actual computed ratio >=4.5 on every sampled animation frame across four reversals |
| Reduced motion / touch at 320, 390, 768 and landscape 844px | PASS | Real Chrome touch contexts, functional controls and no document horizontal overflow |
| No-WebGL rendering and interaction | PASS | WebGL contexts/APIs disabled; SVG scene, chapters and map work without errors |
| Cold isolated-context performance measurements | PASS | Six final samples in `qa/performance-local.json` |
| Live deployed E2E and hashes | NOT TESTED | Awaiting deployment |

Initial local browser command: `BASE_URL=http://127.0.0.1:4186/glacier-atlas/ node node_modules/@playwright/test/cli.js test tests/flows.spec.ts tests/accessibility.spec.ts --workers=1`. Result: **14 passed in 22.3 seconds**. It targeted the built production preview. A preceding readiness-race attempt exited before launching browser tests because a duplicate dev server could not bind the occupied port; it is not counted as a product failure or a passing check.

After the visual fixes and explicit no-WebGL regression, the same command on the production preview passed **15/15 in 24.6 seconds**. After the CI-discovered transient contrast correction and its new regression, the final corrected preview passed **16/16 in 24.8 seconds**. All six axe states still reported zero violations. All error-listening flows reported zero page errors, console errors, failed requests or HTTP error responses. The owned test and performance files also passed ESLint.

## Measurement conditions

The performance script records three fresh isolated-context samples at 1440×1000 and 390×844, DPR 1, reduced motion, unthrottled CPU/network and headless Chrome. It records raw navigation, resource and paint timings, long tasks, JS heap, DOM size, browser version, UTC timestamp and local asset SHA-256 values. The bounded click-to-two-frames measurement includes automation and scrolling overhead; it is not INP. Synthetic SVG LCP may omit the terrain; no field-data or Lighthouse score claim is made.

Final local command: `node scripts/measure-performance.mjs http://127.0.0.1:4186/glacier-atlas/ qa/performance-local.json`. Browser: **Chrome 155.0.8059.86 on Windows**. The narrow viewport is not physical-phone or mobile-CPU emulation. The script waits for Playwright's network idle threshold of 500ms; navigation and paint times are read from the browser's own performance entries.

| Metric | 1440×1000, three samples | 390×844, three samples |
|---|---:|---:|
| Synthetic LCP, median (range), ms | 284 (276–500) | 276 (268–288) |
| Load event end, median, ms | 74.2 | 84.4 |
| JS heap used, median, bytes | 4,198,452 | 4,198,372 |
| Initial transferred document + resources, bytes | 88,399 each | 88,399 each |
| Observed startup long tasks | 0 | 0 |
| Errors / failed requests / HTTP errors | 0 | 0 |
| DOM elements / SVG descendant elements | 340 / 135 | 340 / 135 |

All 24 bounded automation click-to-two-frame observations ranged from 41.46 to 114.97ms. These figures include Playwright, scrolling and frame scheduling; they do not measure INP or physical touch latency. No comparative speedup is claimed. The six contexts were run sequentially in one browser process after functional tests completed. The raw report confirms support for `longtask` and `largest-contentful-paint` observers. The pre-contrast-fix performance baseline is preserved separately in `qa/performance-precontrast-fix.json`.

Measured local release assets:

- `index-BZHl98rt.js`: 251,775 raw bytes; SHA-256 `0a2535bcbe667d5980d0bef9063d4971f047f489a6f114cd7884486b12fd1973`.
- `index-BDAJRPD0.css`: 23,284 raw bytes; SHA-256 `e75039e67b4df1303817c10e5781e130cbfc653a3395089bf6034926974e0b7c`.
- A 1,118,243-byte JavaScript source map is also generated but was not fetched during normal page loading. Its hash is retained in the raw measurement file.

## Limits

No unresolved P1/P2 issue is proven in this role's reviewed code or local browser results. Static-app review is proportionate to the absence of server endpoints, accounts, payment, API secrets or arbitrary user content. Dependency audit and CI outcomes are recorded by the integrator; live artifact checks are pending release. Axe covers machine-testable rules. Visual judgment is provided by the separate visual reviewer. Physical devices, Safari, Firefox, throttled mobile CPUs and field performance are NOT TESTED.
