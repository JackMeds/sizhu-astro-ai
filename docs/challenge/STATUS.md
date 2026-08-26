# AstroCopy WebMCP Challenge Status

This file records verified execution state for the challenge branch. It is not a release claim; unchecked work remains blocked until the listed validation passes.

## Phase 0 — Baseline

- Started: 2026-08-26T15:17:30+08:00
- Branch: `challenge/webmcp-2026`
- Commit: `dbfe8a011fbbeeb4ef0db3f47c1e9604eaf752f2`
- Base: `origin/main@40f1fbebeb68f0cd1131692a2ca0f848e66d8b31`
- Pull request: [#11](https://github.com/JackMeds/sizhu-astro-ai/pull/11) (Draft)

### Verified remote state

- `validate`: success
- `liuren-reference`: success
- `webmcp-smoke`: failure
- Failed run: `32934764791`, job `98073896847`
- Exact failure: `tools/e2e-webmcp.mjs:56` timed out after 15 seconds while waiting for at least five tools before a profile existed.

### Verified local baseline

- `npm ci`: passed on Node.js `v24.17.0` / npm `11.13.0`
- `npm run test`: passed (38 core, 2 prompt, 4 web tests)
- `npm run typecheck`: passed
- `npm run build:mcp`: passed
- `npm run build:web`: passed
- Local browser reproduction: failed at the same `page.waitForFunction` as CI
- Production web bundle at baseline: 1,742.99 kB JavaScript / 559.99 kB gzip, with Vite's large-chunk warning

### Confirmed blockers for this execution round

1. The empty workspace intentionally exposes only `about`, `create_birth_chart`, and `get_workspace_state`; the smoke test incorrectly waits for five tools before chart creation.
2. The smoke test calls `compare_transits` with `dates`, while the live schema and implementation require `targetDates`.
3. `inspect_chart` has no `focusIds` schema or execution path, and the custom Zi Wei renderer does not consume workspace focus state.
4. No shared `test:webmcp` npm script exists; CI and local validation do not yet share one entry point.

### Newly verified risks outside P0-001–P0-003

- English completion is overstated: the result-ready area, result tabs, and custom Zi Wei renderer still contain hard-coded Chinese interface copy.
- `react-iztro` is no longer imported by the web app but remains an installed dependency.
- The production JavaScript bundle is large enough to trigger Vite's chunk-size warning.
- The challenge deadline is inconsistent across official pages. The OpenAI event page says September 3 at 5 p.m. PT, while the Devpost Official Rules say September 3 at 1 p.m. Pacific Time and state that the rules prevail on conflict. Use the earlier rules deadline: 2026-09-04 04:00 Beijing time.

## Phase 1 — P0-001 through P0-003 verified result

Completed and verified on 2026-08-26. P0-001 through P0-003 are `DONE`.

### Implemented

- The WebMCP E2E now asserts exactly three foundational tools before profile creation and six tools after profile creation.
- `compare_transits` uses the canonical `targetDates` input. The browser test also proves that the legacy `dates` input returns `isError: true`.
- `inspect_chart` accepts one to four stable Zi Wei `focusIds`, writes them to shared workspace state, and produces a visible focused state in the custom plate.
- Life-palace detection now uses the semantic palace name `命宫`. The iztro `isOriginalPalace` flag means `来因宫` and is no longer misinterpreted as the life palace.
- CI and local development share the root `npm run test:webmcp` entry point.

### Local validation

- `npm run test`: passed (38 core, 2 prompt, 7 web tests)
- `npm run typecheck`: passed
- `npm run build:mcp`: passed
- `npm run build:web`: passed
- `npm run test:webmcp`: passed with exactly six registered tools after profile creation
- Visual evidence: `artifacts/e2e/webmcp-ziwei-focus.png` shows separate, correctly labelled life- and body-palace focus states
- Current web bundle: 1,745.79 kB JavaScript / 560.73 kB gzip, still with Vite's large-chunk warning

### Remote validation

- Commit under test: `1129b98`
- GitHub Actions run: [`32943800916`](https://github.com/JackMeds/sizhu-astro-ai/actions/runs/32943800916)
- `validate`: passed in 38 seconds
- `liuren-reference`: passed in 8 seconds
- `webmcp-smoke`: passed in 47 seconds, including the shared browser test and screenshot upload
- Non-blocking runner annotation: GitHub currently forces Node.js 20-based actions onto Node.js 24; project jobs themselves passed

### Engineering scan decision

See [`ENGINEERING_SCAN.md`](./ENGINEERING_SCAN.md). Keep the deterministic calculation engines and the project-specific shared workspace. After the current P0 fixes are accepted, smoke-test migration from the custom registration hook to Google's small `use-webmcp-tool` package; do not add the heavier MCP-B polyfill stack unless a verified browser requirement needs it. Remove the unused `react-iztro` UI dependency in a separate cleanup.

### Next gate

Start P0-004 through P0-008 with one coherent demo-state slice: pinned transit, complete undo, readable recent activity, normalized error results, and the full human-agent browser scenario. Do not merge `main` as part of this phase.

## Phase 2 — P0-004 through P0-008 verified result

Completed and verified on 2026-08-26. P0-004 through P0-008 are `DONE`.

### Implemented

- Shared workspace state now includes `pinnedTransitDate` and typed activity records.
- Comparison cards expose separate Select and Pin/Unpin controls plus visible selected and pinned states.
- `get_workspace_state` returns a concise workspace identity, selected/pinned/comparison/focus state, warning count, and the latest six human/Agent activities.
- View, selection, comparison, focus, and pin mutations are undoable. Field-aware undo preserves newer human changes when reverting an older Agent activity.
- Explicit tool failures and uncaught synchronous/asynchronous execute failures normalize to `{ isError: true, content: [...] }`.
- Compare input validation now rejects missing arrays, fewer than two or more than five dates, invalid formats, and duplicates before changing state.
- The main browser flow now covers create → focus → compare → human select → human pin → Agent read → invalid-input stability → undo.

### Local validation

- `npm run test`: passed (38 core, 2 prompt, 14 web tests)
- `npm run typecheck`: passed
- `npm run build:mcp`: passed
- `npm run build:web`: passed
- `npm run test:webmcp`: passed with six registered tools and the complete human-Agent round trip
- Visual evidence: `artifacts/e2e/webmcp-human-pin.png` shows 2029 selected and pinned; `webmcp-shared-workspace.png` also records it in the activity rail
- Current web bundle: 1,750.02 kB JavaScript / 561.80 kB gzip, still with Vite's large-chunk warning

### Remote validation

- Commit under test: `adf3b25`
- GitHub Actions run: [`32945373022`](https://github.com/JackMeds/sizhu-astro-ai/actions/runs/32945373022)
- `validate`: passed in 43 seconds
- `liuren-reference`: passed in 8 seconds
- `webmcp-smoke`: passed in 1 minute 22 seconds, including the complete shared-state browser flow and screenshot upload
- Non-blocking runner annotation remains the Node.js 20 action-runtime deprecation warning

### Next gate

Complete P0-009 and P0-010 next: remove hard-coded Chinese from the English demo route and add browser-level international-time coverage. Then run P0-011 in the real ChatGPT challenge browser before deployment work. Do not merge `main` as part of this phase.

## Phase 3 — P0-009 and P0-010 verified

Completed and verified on 2026-08-26. P0-009 and P0-010 are `DONE`.

### Implemented

- The English result-ready card, result tabs, overview guidance, custom Zi Wei heading/metadata/legend, transit heading/toolbars, dynamic-scope labels, and comparison controls now use the shared dictionaries.
- Domain values such as Heavenly Stems, Earthly Branches, star names and upstream relation labels remain intact; English UI labels surround them instead of rewriting computed data.
- Browser assertions reject regressions to the known hard-coded Chinese result, tab, Zi Wei, and transit headings.
- Birth-chart tool results now expose the normalized `timezoneOffsetMinutes` and `standardLocalTime` needed to audit international input handling.
- The production E2E creates valid charts in `America/New_York` (-240 minutes during DST), `Asia/Kolkata` (+330), and `Asia/Kathmandu` (+345).
- The same E2E rejects the nonexistent `2026-03-08T02:30:00` New York wall time and proves the rejected call does not replace the current chart.

### Local validation

- Web dictionary parity and workspace/WebMCP tests: passed (14 web tests)
- Web typecheck: passed
- `npm run build:web`: passed
- `npm run test:webmcp`: passed, including English UI assertions and the international-time matrix
- Visual evidence: `artifacts/e2e/webmcp-ziwei-focus.png` and `webmcp-human-pin.png` now show English headings and controls
- Current web bundle: 1,751.30 kB JavaScript / 561.72 kB gzip, still with Vite's large-chunk warning

### Remote validation

- Commits under test: `5f082ab`, `56120b8`, and `6e4f294`
- GitHub Actions run: [`32946700795`](https://github.com/JackMeds/sizhu-astro-ai/actions/runs/32946700795)
- `validate`: passed in 29 seconds
- `liuren-reference`: passed in 4 seconds
- `webmcp-smoke`: passed in 51 seconds, including the English demo route and international-time matrix

### Next gate

P0-011 is the next manual gate: verify discovery and calls for all six tools in the real ChatGPT challenge browser and record the browser/version/result evidence. Do not deploy, merge `main`, or begin the submission freeze as part of that verification.
