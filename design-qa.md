# 命序 design QA

Reference: `exec-0986ab99-9650-481b-942b-14ab03cb0968.png` (approved deep-green research workbench, 1672 × 941).

Prototype: local Vite preview at `http://localhost:4173/`, generated example chart state, Four Pillars view, 1672 × 941. The reference and prototype were inspected together at the same viewport.

## Visual checklist

- [x] Deep-green primary theme uses jade, warm gold and low-contrast borders; no indigo theme remains in the product shell.
- [x] Warm-light theme uses dark ink for headings and body copy, with jade/gold reserved for readable emphasis and action states.
- [x] Brand lockup uses the supplied white seal in classical/dark mode and red seal in modern/light mode; favicon follows the same mapping.
- [x] Visible product, SEO, WebMCP and static-page copy uses 命序 / MingXu; AstroCopy remains only as the internal engine codename and compatibility surface.
- [x] Generated workspace keeps the reference density with a desktop three-column layout: birth data, chart data, and AI/WebMCP/history rail.
- [x] Four Pillars remain a semantic table with Heavenly Stems, Earthly Branches, Hidden Stems, Na Yin and Void Branches.
- [x] Five-Phase distribution uses five exact horizontal percentage tracks, including visible zero tracks and hidden-stem weighting note.
- [x] Zi Wei, Transits and Calculation Audit switch in the shared center panel without losing the current chart or right-rail state.
- [x] Right rail contains AI handoff, WebMCP status/tool details and recent chart history; the old lower-right audit block and bottom status strip are absent.
- [x] Empty state avoids an unlabelled circular chart decoration and explains the three-step entry flow.
- [x] Static guide, Liuren, sponsor and privacy pages share the same warm-light/deep-green visual language.
- [x] 1440, 1102, 768 and 390px checks show no horizontal overflow; the right rail stays beside the chart until the 1040px breakpoint, then stacks cleanly.
- [x] Focus rings, semantic buttons/labels, expandable details, empty history and reduced-motion-safe transitions are present.

## Functional smoke checks

- [x] Example chart generation opens the Four Pillars view.
- [x] Module navigation activates overview, Four Pillars, Zi Wei, Transits and Audit panels.
- [x] History restore and clear actions remain wired to local persistence.
- [x] WebMCP detected/not-detected state is visible in the compact right rail and full Agent page.
- [x] AI export copy, format preview, download and destination links remain available.

## Verification

- `npm test` — passing tests across core, prompt and web workspaces, including brand asset and static-page checks.
- `npm run typecheck` — passed.
- `npm run build` — passed (only the existing large-chunk advisory remains).
- `git diff --check` — passed.

final result: passed
