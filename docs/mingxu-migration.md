# MingXu migration and rollback

This dependent address-switch delivery updates public references to `JackMeds/mingxu` and `https://mingxu.jackmeds.top/`. The compatibility preparation must land first. The public tool namespace already was `mingxu.*`; calculation results still identify the original AstroCopy engine. This branch does not itself rename the repository, configure DNS, publish npm packages or deploy a site. Do not merge or publish its new links until the reviewed cutover is ready.

## Compatibility contract

Primary npm workspaces are `@mingxu/core`, `@mingxu/prompt`, `@mingxu/render`, `@mingxu/agent-tools`, `@mingxu/mcp` and `@mingxu/web`. Private `packages/compat-*` workspaces retain the old `@sizhu/*` import or npm workspace command entry points. They delegate to the same implementation and stay through at least the next stable release. Both `mingxu-mcp` and `sizhu-mcp` resolve to the existing MCP executable.

The tool registry retains `mingxu.*`, `sizhu.*` and `astrocopy.*` names and unchanged schemas. Storage keys, output schemas, `sizhu-time-v2` and `sizhu-astro-ai/core` identifiers deliberately remain unchanged. Compatibility guidance never modifies a tool's successful response. Both executable names use a checked-in Node shebang wrapper, so a clean install creates working CLI links before TypeScript is built. Existing working directories can run `npm rebuild -w @mingxu/mcp` after installing to refresh cached npm bin links.

## Browser transfer

`/backup/` is a standalone page, independent of app startup effects, so opening it does not create a default draft or override imported preferences. `/migration/` is a self-contained, export-only recovery page with no external script or stylesheet dependencies.

The local JSON envelope is `mingxu-browser-backup`, version `1`, with export time, origin and four raw values: `history`, `draft`, `theme`, `locale`. Export retains raw bytes as strings, including old or damaged records, for manual recovery. Nothing is uploaded; browser downloads contain private birth data.

Import validates the complete current stored-profile shape before writing. IDs deduplicate in input order, current records win conflicts, and current preferences are retained. Existing records take priority within the 12-record history capacity. Overflow remains in the user's original backup; keep that file. Older engine records are reported and skipped rather than relabelled. Unsupported envelope versions or malformed current records fail before writes. A storage quota failure rolls back completed writes. If the destination contains older incompatible history, export and review it before importing additions.

Use the same original browser profile on `https://astrocopy.jackmeds.top/migration/`, download the file, then open the new site's `/backup/` directly and import it. Returning to `/` lets the app read imported preferences; explicit `/en/` and `/zh/` routes still override locale, as before.

## Address-switch delivery

This branch was prepared with `node tools/switch-public-addresses.mjs --write` and a central brand regeneration. The command without flags lists changes without writing; `--patch` generates `artifacts/mingxu-address-switch.patch` without changing sources. It updates pages, SEO, guides, Agent metadata, repository links, CNAME, setup instructions and discovery tests to `JackMeds/mingxu` / `mingxu.jackmeds.top`, including `project-brand.json`. Historical challenge notes remain historical. The old recovery URL, engine identities, storage keys and `mcp.jackmeds.top` do not move.

Build and verify the dependent branch before changing any external setting:

```bash
npm test
npm run test:migration
npm run typecheck
npm run build
```

## Reviewed production sequence

1. Merge and deploy preparation at the original domain. Verify both backup pages with a synthetic profile and save a last-working static build and GitHub repository/Pages metadata.
2. Run `node tools/prepare-recovery-assets.mjs /absolute/path/to/last-working-dist`. This copies that explicit build into the ignored `infra/legacy-recovery/assets` directory and overlays the standalone recovery document. It refuses to replace an existing snapshot. Preserve a copy outside the checkout for rollback.
3. Validate `infra/legacy-recovery/wrangler.jsonc` with the currently installed Wrangler before deployment. It uses an ASSETS binding and `run_worker_first: true`, so static files cannot bypass the redirect handler. Add the old-origin route only in the reviewed release. Default `NEW_SITE_READY=false` serves the retained site; recovery stays available at the old origin.
4. Prepare the new DNS/HTTPS endpoint. Rename the GitHub repository, update the execution clone's remote, update Pages settings and deploy the accepted address-switch branch. Check root, language pages, guides, Agent documents, MCP metadata and `/backup/` over HTTPS.
5. Test old-origin export → new-origin import, duplicate import, existing destination conflicts, overflow, empty storage and damaged files in a browser. Verify old repository redirects; do not recreate the old repository name. Remote MCP remains on `mcp.jackmeds.top`.
6. Set `NEW_SITE_READY=true` only after acceptance. Ordinary GET/HEAD paths receive a path/query-preserving 301. `/migration`, `/migration/` and `/migration/index.html` remain old-origin recovery routes; `/__migration/health` reports readiness. Other methods are not redirected across origins.

No production route is configured in this checkout. The Worker code and readiness flag are preparation artifacts, not evidence of a live migration.

## Rollback

Set `NEW_SITE_READY=false` and serve the retained old static build, restore recorded Pages/DNS settings if needed, and preserve the export-only recovery page. The Worker emits `Cache-Control: no-store` with redirects, but clients that already stored permanent redirects may still need the explicit recovery URL. Do not delete either origin's browser data or invalidate existing backups.

## Verification

`npm run test:migration` checks package export identity, both CLI names, the backup contract, deduplication, capacity, damaged records, quota rollback, readiness and redirect routing. Existing registry and browser suites check the unchanged Agent aliases, schemas and workspace behavior. Core tests retain calculation fixtures and time semantics.

Cloudflare references: [static assets Worker routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) and [asset bindings configuration](https://developers.cloudflare.com/workers/static-assets/binding/). Production account and hostname configuration still require release-time verification.
