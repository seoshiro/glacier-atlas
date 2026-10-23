# GLACIER independent visual review

Reviewer role: independent visual and browser QA.

## Scope and method

The intended visual direction is an original imagined alpine expedition: cold snow, deep teal ink, sparse red survey marks, oversized editorial lettering, and an immersive terrain illustration. The narrative should move from a distant landscape to a route and then a field journal and collectible card.

Browser verification will use isolated Playwright contexts with the existing local Google Chrome executable, one worker, and no browser extensions. Screenshots are evidence from automated browser sessions, not human device testing. Planned viewports are 320 × 780, 390 × 844, 768 × 1024, 1440 × 1000, and 844 × 390 landscape. Motion preference, map/landscape states, night mode, focus, and key route interactions will be examined.

## Baseline run

PASS — the initial responsive capture test completed in 9.9 seconds against the local production preview at `http://127.0.0.1:4186/glacier-atlas/`. All five viewport document widths equalled their viewport widths. No `pageerror` events occurred. The browser matrix used reduced motion and device scale factor 1.

The restricted execution environment initially denied the localhost browser request. An allowed-network retry then timed out against the restricted listener. The integrator restarted the preview in the allowed-network context, and the same authorized capture test passed. These attempts are environment setup failures, not application render failures.

The initial full-page captures did not activate the below-fold lazy card image. The capture test now walks to that image, checks `complete` and nonzero `naturalWidth`, then returns to the top before the next screenshots. This check and the expanded state test still require a run; a blank lazy region in an initial full-page screenshot alone is not evidence of an application defect.

## Baseline findings

1. **P2 — hero copy collides with chapter marker.** At 1440 and 768 pixels, the two-line hero description intersects the Unwritten ridge marker label and detailed terrain. See `screenshots/before-desktop-1440-hero.png` near x1080/y450 and `screenshots/before-tablet-768-hero.png` near x520/y450. Reserve a clear text area and keep it away from interactive route labels.
2. **P2 — mobile bottom labels are obscured.** At 320 pixels, the Moraine basin label is partly behind the expedition CTA. At 320 and 390 pixels, the bottom artist-survey caption is behind the view/night controls. See the corresponding before hero screenshots. Move noninteractive survey captions outside the control area and separate the first marker from the CTA.
3. **P3 — small mobile marker typography.** Marker names are 8 pixels and altitude labels 7 pixels. They are decipherable at full scale but finer than the surrounding UI. Increase by 1–2 pixels where available after overlap is fixed.

The visual composition otherwise meets the intended direction: a distinctive faceted alpine illustration, cold palette, sparse red route, oversized clear wordmark, quiet elevation study, field drawing, and an editorial journal. The supporting story flows coherently without large unintended gaps. The mobile page stacks in a sensible reading order.

## Evidence

The initial captures include full-page and initial-viewport images for `mobile-320`, `mobile-390`, `tablet-768`, `desktop-1440`, and `landscape-844`. Measurements are in `screenshots/before-responsive-measurements.json`.

## First after-fix review

PASS — both expanded visual tests completed in 16.1 seconds. The five viewport screenshots again have no horizontal document overflow or runtime `pageerror` events. Scrolling through the narrative activated the lazy keepsake image; its browser `complete` state and positive `naturalWidth` passed at every viewport. The card is present in all after full-page captures.

The integrator resolved the two baseline P2 findings by putting hero copy on a quiet pale backing at the left, removing redundant bottom captions from the control area, and reserving space below the mobile terrain for controls. Mobile marker names and altitude text are now 10 and 9 pixels. The baseline P3 legibility recommendation is also resolved.

The following expanded states passed at 390 and 1440 pixels: map view and its pressed state, direct third-chapter point selection, night map, night landscape, visible skip-link keyboard focus, skip-link activation, and focused chapter activation using Enter. Screenshots include `after-*-map.png`, `after-*-map-night.png`, `after-*-landscape-night.png`, and `after-*-keyboard-focus.png`.

Two visual follow-ups were reported from this expanded inspection:

1. **P2 — desktop map point behind wordmark.** In `after-desktop-1440-map.png`, the third chapter point and part of its label are behind the large GLACIER lettering near x980/y380. The map state needs a title size or consistent scene layout adjustment.
2. **P2 — 320-pixel first label crop.** In `after-mobile-320-hero.png`, the wider Moraine basin label slightly crosses the viewport's left edge. The test now checks a minimum 4-pixel horizontal inset for all marker labels on the final re-run.

## Final local candidate review

PASS — after the final contrast correction, the local visual suite completed **2/2 tests in 15.4 seconds**, against candidate assets `index-BDAJRPD0.css` and `index-BZHl98rt.js`. Loaded asset URLs were recorded at all five sizes in `screenshots/after-responsive-measurements.json`. The refreshed after screenshots visually confirm that the desktop map's third marker is clear below the smaller wordmark and all 320-pixel marker names fit within the viewport.

The new marker-label inset assertions passed at all five sizes. At 320 pixels, the first label begins at 11.48 pixels and the third ends at 310.77 pixels. No document overflow, lazy image failures, or runtime `pageerror` events occurred. Map, night palettes, touch selection, visible keyboard focus, skip navigation and Enter activation passed again.

All proven P2 findings and the mobile typography P3 recommendation above are resolved in the final local candidate. No P1 or P2 visual findings remain in the covered viewports and states. Original before screenshots remain unchanged; after screenshots represent this final candidate.

## CI contrast correction

The first GitHub Actions run was a real failure: 16 browser tests passed and the 1440-pixel axe state test failed. The preserved raw log, `ci-first-failure.log`, reported the active night marker number at **4.38:1**, foreground `#14383d` on an intermediate background `#e37b64`, below the required 4.5:1. A background-color transition was temporarily combining the new text color with an intermediate palette color.

The integrator removed that background-color transition so marker text and background change together. The accessibility assertion remained intact. Code/performance/security QA reported its corrected 16-test browser suite passing before this role refreshed the final visual evidence. This role's 2-test visual suite passed afterward; the marker appearance and layout remain clear. A new CI result is still required before calling the release deployed.

Live exact-release review is pending. Automated Chrome results do not constitute physical device testing or a human usability study.
