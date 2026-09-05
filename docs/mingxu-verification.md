# Migration preparation verification

Recorded 2026-09-05 from a fresh clone of the remote default branch. All browser inputs were fictional fixtures; no production data or settings were changed.

The full unit/migration suites, typecheck and build passed on Node.js 24.20.0 (documented runtime) as well as the host Node.js 26.3.0. Browser checks used Chromium with the production build.

| Check | Result |
| --- | --- |
| Existing suite plus follow-up web regression checks | 96 passed: core 40, prompt 8, registry 4, MCP 2, web 42 |
| TypeScript workspaces and API | `npm run typecheck` passed |
| Production web and MCP build | `npm run build` passed; existing large-main-bundle warning remains |
| Legacy Worker routing | 6 passed, including old-origin recovery, readiness, directory indexes, path/query redirect and non-GET handling |
| Package and CLI compatibility | 8 passed; identical exports for five old/new package pairs, both executable names complete MCP initialization |
| Address-switch generator | 3 isolated Git-fixture tests passed: read-only default, applicable patch, Windows HTML/TypeScript forms, escaped regexes, protected provenance/engine/storage/MCP values, idempotent write |
| Cross-origin browser migration | Passed: read-only recovery download, fresh destination import, duplicate/conflict handling, malformed file retention, no third-party requests, app reload |
| Browser layouts | 1280px/light and 390px/dark checked; no horizontal overflow |
| Existing WebMCP browser smoke | Passed with 10 tools after delayed injection, including existing workspace interactions |
| Cloudflare Worker dry-run | Wrangler 4.129.0 validated ASSETS binding and false readiness; no deployment |

Review follow-up: imported relation enum values and known `raw.traditionalRules` structures now reject malformed values before any write, while preserving unknown extension fields. Ten malformed-field cases cover relation kinds/statuses/participants and audit arrays/source/text/conditions. Hold-mode directory URLs receive same-origin trailing-slash redirects, keeping relative Agent metadata links usable and preserving queries. Screenshot-provenance documentation is excluded from address rewriting.

Screenshots are generated locally under ignored `artifacts/e2e/`. The ignored recovery snapshot under `infra/legacy-recovery/assets/` contains the last-working preparation build and standalone recovery page. It must be retained separately before a production switch.

## Existing dependency audit findings

The configured npm mirror does not implement audit. The official registry was queried with `npm audit --audit-level=high --registry=https://registry.npmjs.org`: 8 dependency findings (4 high, 3 moderate, 1 low). The following locked versions are identical to the remote baseline; this migration does not upgrade them:

| Dependency | Locked version |
| --- | --- |
| `@hono/node-server` | 1.19.14 |
| `body-parser` | 2.2.2 |
| `fast-uri` | 4.0.0 |
| `hono` | 4.12.25 |
| `ip-address` | 10.2.0 |
| `nanoid` | 3.3.12 |
| `postcss` | 8.5.15 |
| `qs` | 6.15.2 |

These need a separate dependency update and validation before a production release. An offline npm install reporting zero vulnerabilities is not a successful online audit. No broad `npm audit fix` was run as part of branding.

External readiness remains pending: PR acceptance, repository rename, GitHub Pages settings, Cloudflare old-origin route, DNS/TLS, new-domain acceptance and production redirect switch.
