# AstroCopy WebMCP Existing-Engineering Scan

- Date: 2026-08-26
- Scope: challenge branch P0 architecture and reusable engineering candidates
- Method: official sources first, then package registries, source repositories, adjacent entrants, and community search

## 1. Problem reframe

The core problem is not “add an AI button to an astrology site.” It is to expose deterministic Chinese-metaphysics computation through the browser's imperative WebMCP API while keeping every agent action visible, stateful, reversible, and readable by the human on the same page.

The engineering questions are therefore:

1. Which existing React integration already handles registration lifecycle, late API injection, Strict Mode, changing callbacks, cancellation, and errors?
2. Which existing calculation engines should remain authoritative instead of being rebuilt or replaced with model inference?
3. Which state, visualization, undo, audit, and bilingual behavior is product-specific and must remain AstroCopy code?
4. Which public implementations or challenge entrants reveal gaps in our demo story?

Success means a browser test proves dynamic tool availability, strict input contracts, visible semantic focus, shared state, and recoverable failures. A package name or a unit-test-only integration is insufficient.

## 2. Keyword matrix

| Axis | Search terms |
|---|---|
| Components | WebMCP React hook, imperative tool registration, WebMCP types, WebMCP polyfill, Zi Wei renderer, BaZi calendar engine |
| Behaviors | dynamic registration, AbortSignal unregister, late injection, React Strict Mode, execute ref, JSON Schema validation, error result |
| Data/state | shared workspace, agent focus IDs, pinned transit, compare dates, activity log, undo, audit trail |
| Adjacent terms | browser MCP, agentic web, declarative vs imperative tools, model context, human-agent collaboration |
| Implementations | npm, GitHub, Chrome Labs, MCP-B/WebMCP-org, React WebMCP, WebMCP challenge astrology |
| Domain terms | BaZi WebMCP, Zi Wei WebMCP, Chinese astrology agent, deterministic astrology tools |

## 3. Existing solution map

All activity and package facts below were checked on 2026-08-26. “Coverage” estimates only the relevant engineering slice, not the whole AstroCopy product.

### A. Current local `useWebMcpTool`

- URL/type/domain: [`apps/web/src/lib/useWebMcpTool.ts`](../../apps/web/src/lib/useWebMcpTool.ts), internal React hook, WebMCP lifecycle.
- Input/output shape: a tool definition plus `enabled`; returns `{ supported, registered, error }`.
- Stack/license/activity: React + TypeScript, covered by this GPL-3.0 project, active on the challenge branch.
- Documentation/installability/demo: local source only; no focused lifecycle test suite or standalone demo.
- Capabilities: dynamic enablement, AbortSignal cleanup, late API retry, stable execute ref, navigator fallback.
- Missing: annotations, configurable retry/late-injection behavior, result normalization, comprehensive Strict Mode and registration-error tests. The navigator fallback is for a deprecated API surface. A separate unused static registry also remains in `apps/web/src/lib/webmcp.ts`.
- Coverage/integration: about 65% of the React registration slice; current baseline to retain until a replacement passes the project E2E.
- Smoke test/risk: run all six tools through mount, enable, disable, remount, failure, and late-injection cases. Risk is lifecycle edge cases being discovered during the live demo.

### B. GoogleChromeLabs `use-webmcp-tool` 0.2.0

- URL/type/domain: [GitHub](https://github.com/GoogleChromeLabs/use-webmcp-tool), [npm](https://www.npmjs.com/package/use-webmcp-tool); React hook for imperative WebMCP.
- Input/output shape: hook receives a tool definition and lifecycle options; registers a current execute callback and unregisters through AbortSignal.
- Stack/license/activity: TypeScript/React, Apache-2.0, repository pushed 2026-08-18; npm package updated 2026-07-30.
- Documentation/installability/demo: documented README, small installable package (about 25 kB unpacked), peer React 18+, no runtime dependencies, source tests cover the hook.
- Capabilities: enabled state, late injection, Strict Mode behavior, annotations, stable closure handling, error/result normalization, and registration-error handling.
- Missing: no AstroCopy workspace, schema semantics, visualization, undo, audit, or domain computation. Version 0.2.0 also omits the optional WebMCP `title` field from its public options and registration descriptor, so a direct swap would silently remove the human-readable titles already exposed by all six AstroCopy tools.
- Coverage/integration: about 90% of the React registration slice and roughly 15% of the whole product; **watch candidate** until descriptor-title parity is available.
- Smoke test/risk: swap the hook without changing tool contracts, then require unit lifecycle coverage and the complete browser E2E. Main risks are Chrome API churn and a React 19 compatibility edge despite the broad peer range.

### C. MCP-B / WebMCP-org stack (`usewebmcp`, `@mcp-b/react-webmcp`, types, polyfill)

- URL/type/domain: [WebMCP-org packages](https://github.com/WebMCP-org/npm-packages); hooks, types, client, and browser polyfill ecosystem.
- Input/output shape: React tools and providers backed by shared WebMCP types; the polyfill exposes a model-context-compatible surface to non-native clients.
- Stack/license/activity: TypeScript/React, MIT, repository pushed 2026-08-25. Checked package line was 5.0.1.
- Documentation/installability/demo: installable packages and examples; the React package pulls the MCP client/SDK, types, polyfill, and hook packages.
- Capabilities: the broadest compatibility story and useful shared types; suitable when non-native browsers or an injected MCP client are a hard requirement.
- Missing: still no AstroCopy domain/state/UI behavior, and most of the stack is unnecessary for a native-Chrome challenge demo.
- Coverage/integration: 95% of compatibility infrastructure but only about 15% of the total product; **watch**, do not adopt by default.
- Smoke test/risk: measure production bundle delta and validate native Chrome plus fallback mode. Risks are dependency surface, bundle growth, and testing two transports instead of one.

### D. `webmcp-react` 0.2.0

- URL/type/domain: [GitHub](https://github.com/agentcathq/webmcp-react), [npm](https://www.npmjs.com/package/webmcp-react); React integration with schema conversion.
- Input/output shape: React tool declarations with Zod/JSON-schema conversion and imperative registration underneath.
- Stack/license/activity: TypeScript/React/Zod, MIT, repository pushed 2026-08-24; about 150 kB unpacked.
- Documentation/installability/demo: installable and documented.
- Capabilities: ergonomic typed tool definitions and schema conversion.
- Missing: no product state or domain behavior; AstroCopy already owns explicit JSON schemas and Zod is not needed in the browser bridge.
- Coverage/integration: around 80% of the registration slice; **reject for now** because it adds a schema abstraction without removing project-specific validation.
- Smoke test/risk: port one read-only tool and compare emitted schema and error semantics. Risk is dual schema ownership and avoidable bundle cost.

### E. Existing deterministic engine stack

- URL/type/domain: [lunar-javascript](https://github.com/6tail/lunar-javascript), [iztro](https://github.com/SylarLong/iztro), [lunisolar](https://github.com/waterbeside/lunisolar), and `mingyu-core`; calendar, BaZi, Zi Wei, and supporting Chinese-metaphysics computation.
- Input/output shape: normalized birth/time/location/config input to structured pillars, palaces, stars, time layers, warnings, and audit metadata.
- Stack/license/activity: JavaScript/TypeScript packages already installed in `@sizhu/core`; project compatibility is established by the current GPL-3.0 distribution and tests.
- Documentation/installability/demo: installable packages with upstream docs; exercised through the repository's core tests and live profile creation.
- Capabilities: deterministic calculations, established domain vocabularies, structured results, no model dependency.
- Missing: a unified normalized contract and UI semantics, which AstroCopy already supplies. Upstream flags require domain verification—for example, iztro's `isOriginalPalace` means `来因宫`, not `命宫`.
- Coverage/integration: roughly 80% of calculation requirements; **retain and wrap**, never replace with generated inference for the challenge.
- Smoke test/risk: reference fixtures across timezone/DST/half-hour/quarter-hour cases. Risks are upstream semantic misunderstandings and version drift, not absence of computation.

### F. `react-iztro` 1.5.0

- URL/type/domain: [npm](https://www.npmjs.com/package/react-iztro); React Zi Wei renderer.
- Input/output shape: iztro data/config to a prebuilt astrolabe component.
- Stack/license/activity: React + iztro + lunar dependencies, MIT, updated 2026-08-16.
- Documentation/installability/demo: installable UI library.
- Capabilities: ready-made Zi Wei display.
- Missing: stable AstroCopy focus IDs, shared workspace semantics, bilingual design, and the current custom plate interaction model.
- Coverage/integration: once covered much of the visual slice, but now 0% of the active renderer because there are no imports; **remove in a separate dependency cleanup**.
- Smoke test/risk: first prove `npm run build:web` and visual E2E without the dependency. Risk is hidden CSS or lockfile coupling; source search currently finds only stale styles and the manifest entry.

### G. Astro Fusion `af-mcp`

- URL/type/domain: [GitHub](https://github.com/astro-fusion/af-mcp); adjacent WebMCP challenge entrant for Vedic ephemeris, Panchanga, and Vastu CAD.
- Input/output shape: domain inputs exposed through 13 WebMCP tools to chart/CAD outputs and visible page interactions.
- Stack/license/activity: public Apache-2.0 repository, pushed 2026-08-26.
- Documentation/installability/demo: README documents its tools and custom provider/hook; repository is runnable.
- Capabilities: broad astrology tool count and a visually strong real-time CAD interaction story.
- Missing for this product: Chinese-metaphysics engines, AstroCopy's same-state focus/compare/undo/audit workflow, and compatible domain contracts.
- Coverage/integration: 0% as a dependency; useful only as a **competitive reference**.
- Smoke test/risk: compare demo comprehensibility and visible action feedback, not code. Risk is losing on visual storytelling even when AstroCopy's auditability is technically stronger.

### H. Official WebMCP specification and Chrome guidance

- URL/type/domain: [WebMCP specification repository](https://github.com/webmachinelearning/webmcp) and [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp); normative/API and implementation guidance.
- Input/output shape: `document.modelContext.registerTool(tool, { signal })` with JSON Schema inputs and content/error results.
- Stack/license/activity: evolving web platform specification and browser documentation; active on 2026-08-26.
- Documentation/installability/demo: authoritative reference, not an application dependency.
- Capabilities: establishes AbortSignal cleanup, dynamic registration, annotations, validation, output-size, visible UI, and security expectations.
- Missing: React lifecycle implementation and all product behavior.
- Coverage/integration: 100% of conformance baseline; **adopt as the acceptance oracle**.
- Smoke test/risk: validate in the target Chrome build and WebMCP inspector. Risk is API evolution; `navigator.modelContext` is already deprecated in favor of `document.modelContext`.

## 4. Negative evidence log

| Search path | Result | What it does and does not prove |
|---|---|---|
| GitHub exact searches for `bazi webmcp` and `astrology webmcp` | No direct BaZi/Zi Wei implementation surfaced; Astro Fusion appeared through broader recent-WebMCP searches | There is no obvious reusable direct-domain candidate in the checked index; this is not proof that none exists |
| GitLab project search | No relevant implementation surfaced | Lowers confidence in a mature alternative outside GitHub, but search coverage is incomplete |
| Codeberg | Automated access was blocked by robots policy | Unknown; no negative conclusion is drawn |
| Hacker News/community discussions | Protocol discussion and demos, no production-ready Chinese-metaphysics workspace package | Useful for concerns, not reusable implementation |
| Paper/model search | Not advanced beyond the deterministic baseline | The blocking work is browser protocol lifecycle and domain correctness; a paper, dataset, or trained model would not replace it |
| Commercial/no-code results | General MCP and astrology products, no auditable drop-in shared-workspace implementation | Marketing similarity is not engineering equivalence |

## 5. Top three smoke-test plan

1. **Google hook migration — first choice.** Replace only `useWebMcpTool`, keep all six tool definitions unchanged, and test mount/unmount, Strict Mode remount, late API injection, `enabled` transitions, annotations, registration failure, execute rejection, and AbortSignal cleanup. Acceptance: all unit tests plus `npm run test:webmcp` pass and the production bundle does not materially regress.
2. **Harden the local hook — fallback.** If the package is incompatible, port the missing lifecycle cases as project tests, remove the deprecated navigator fallback on the target timeline, add annotations, and normalize all error results. Acceptance: the same lifecycle matrix and browser flow pass without package adoption.
3. **MCP-B compatibility spike — conditional.** Only if the deployed preview must work without native Chrome WebMCP, wire one read-only tool through the MCP-B provider/polyfill, measure bundle delta, and test native plus polyfilled paths. Stop if it duplicates transport logic or harms the demo path.

## 6. Decision matrix

Scores are 1 (poor) to 5 (strong); migration risk is reversed, so 5 means low risk.

| Candidate | Slice fit | Maturity/tests | Size/simplicity | Product compatibility | Low migration risk | Decision |
|---|---:|---:|---:|---:|---:|---|
| Current local hook | 4 | 2 | 5 | 5 | 5 | Keep for the current P0; harden only as fallback |
| Google `use-webmcp-tool` | 5 | 5 | 5 | 5 | 4 | **Adopt after isolated smoke test** |
| MCP-B stack | 5 | 4 | 2 | 3 | 2 | Watch; use only for a verified compatibility requirement |
| `webmcp-react` | 4 | 3 | 3 | 3 | 3 | Reject for now |
| Deterministic engine stack | 5 | 4 | 3 | 5 | 5 | **Retain and wrap** |
| `react-iztro` | 1 | 3 | 2 | 1 | 5 | Remove after a clean build/visual check |
| Astro Fusion | 1 | 2 | 3 | 1 | 1 | Competitive reference only |

## 7. Build/adopt/watch/drop boundary

- **Build:** shared workspace reducer, stable focus IDs, compare/pin/undo behavior, bilingual UI, audit trail, and the end-to-end demo narrative. These encode the product's differentiator.
- **Watch:** GoogleChromeLabs `use-webmcp-tool`; do not migrate version 0.2.0 until it can preserve AstroCopy's registered tool titles as well as lifecycle behavior.
- **Retain:** deterministic domain engines and normalized core contracts.
- **Watch:** MCP-B types/polyfill for a concrete non-native-browser requirement; WebMCP spec/API changes.
- **Drop:** the unused `react-iztro` UI dependency and stale static WebMCP registry after separate regression checks.
- **Do not add:** model inference, training, or a new domain engine to solve lifecycle or UI-state problems.

This decision keeps the custom code where it is product-specific and stops owning generic React/WebMCP lifecycle behavior once the focused adoption test passes.
