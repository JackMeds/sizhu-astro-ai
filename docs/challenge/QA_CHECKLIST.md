# AstroCopy — Challenge QA Checklist

## Release gate

Do not mark the challenge PR ready until every P0 item passes. P1 items may be deferred only with a visible issue and no impact on the 90-second demo.

## P0 — Build and calculation correctness

- [ ] `npm ci` succeeds on Node.js 24.
- [ ] `npm run test` succeeds.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build:mcp` succeeds.
- [ ] `npm run build:web` succeeds.
- [ ] Pinned Da Liu Ren Python oracle succeeds in CI.
- [ ] Chinese and English dictionary keys are identical.
- [ ] No generated profile changes when switching UI language.
- [ ] Same input produces the same canonical chart through UI, WebMCP, and stdio MCP.

## P0 — International time

Test each case through the birth workspace and at least one through WebMCP.

- [ ] `Asia/Shanghai` ordinary date.
- [ ] `America/Los_Angeles` winter offset.
- [ ] `America/Los_Angeles` summer offset.
- [ ] `America/New_York` daylight-saving transition.
- [ ] `Europe/London` daylight-saving transition.
- [ ] `Asia/Kolkata` half-hour offset.
- [ ] A 45-minute IANA zone such as `Asia/Kathmandu`.
- [ ] Nonexistent DST wall time is rejected with a useful error.
- [ ] Repeated DST wall time follows the documented deterministic policy.
- [ ] Solar-time correction can cross an hour branch and remains visible.
- [ ] Solar-time correction can cross a calendar date and remains visible.
- [ ] Da Liu Ren “Now” uses the selected IANA time zone.

## P0 — English product

- [ ] `/en/` opens the English workspace directly.
- [ ] Navigation, hero, task cards, input labels, errors, helper text, buttons, tabs, activity, undo, history, export, audit, and Da Liu Ren controls are English.
- [ ] Chinese chart characters remain readable where they are the data.
- [ ] English terminology uses BaZi, Zi Wei Dou Shu, Da Liu Ren, Heavenly Stems, Earthly Branches, Ten Gods, and Luck Cycles consistently.
- [ ] English AI export is written natively in English.
- [ ] English export does not describe the chart as Western astrology.
- [ ] Switching English → Chinese → English updates the current page without losing the chart or selection.
- [ ] `<html lang>`, title, and description update with locale.
- [ ] Privacy page accurately distinguishes browser-local data from Agent-visible tool results.

## P0 — WebMCP shared state

Run in ChatGPT in-app browser or the official current challenge test environment.

- [ ] Page reports WebMCP availability without blocking ordinary use.
- [ ] Tool registration is not duplicated under React Strict Mode.
- [ ] Tools unregister or abort cleanly when their scope disappears.
- [ ] `astrocopy.create_birth_chart` creates a visible chart.
- [ ] `astrocopy.inspect_chart` changes the visible tab/view.
- [ ] `astrocopy.inspect_transit` selects the requested date in the page.
- [ ] `astrocopy.compare_transits` accepts two dates.
- [ ] `astrocopy.compare_transits` accepts five dates.
- [ ] Comparison rejects fewer than two or more than five dates with a concise error.
- [ ] `astrocopy.get_workspace_state` reflects a human-selected view.
- [ ] `astrocopy.get_workspace_state` reflects a human-selected transit date.
- [ ] Agent mutations create visible activity records.
- [ ] Undo restores the previous visible state.
- [ ] Tool results summarize visible changes and warnings instead of returning an unnecessary full raw profile.
- [ ] Invalid tool inputs do not corrupt existing workspace state.

## P0 — Main demo flow

- [ ] Fictional profile creates successfully.
- [ ] Custom Zi Wei renderer appears.
- [ ] Agent opens Zi Wei view.
- [ ] Agent compares 2027, 2029, and 2032.
- [ ] User manually selects or pins 2029.
- [ ] Agent reads 2029 as current state.
- [ ] Activity/undo is shown.
- [ ] Calculation warning/audit remains reachable.
- [ ] Entire story fits in 90 seconds.
- [ ] Demo remains understandable with audio muted.

## P0 — Privacy and safety

- [ ] No real private birth data is committed, recorded, or used in screenshots.
- [ ] No API key or secret appears in source, build output, or video.
- [ ] Opening third-party AI links does not automatically send clipboard contents.
- [ ] Analytics events contain no chart JSON, birth data, question text, or clipboard contents.
- [ ] Medical, legal, financial, and scientific-boundary wording remains visible where appropriate.
- [ ] Agent cannot silently change a chart fact to match a narrative.

## P1 — Responsive and accessible UI

- [ ] 375×812 mobile viewport.
- [ ] 768×1024 tablet viewport.
- [ ] 1440×900 desktop viewport.
- [ ] 1920×1080 recording viewport.
- [ ] No horizontal page overflow except intentional chart scrollers.
- [ ] Main actions have visible keyboard focus.
- [ ] Tabs work with keyboard navigation.
- [ ] Form errors are announced or associated with relevant inputs.
- [ ] Five-Phase meaning is not conveyed by color alone.
- [ ] Text/background contrast is acceptable in light and dark modes.
- [ ] `prefers-reduced-motion` removes nonessential movement.
- [ ] Custom Zi Wei palaces remain legible at 200% zoom.
- [ ] Da Liu Ren plate scroller has a useful accessible label.

## P1 — Fallback behavior

- [ ] Ordinary browser without WebMCP can create and inspect charts.
- [ ] Copy/export works without WebMCP.
- [ ] Clipboard permission failure shows a useful fallback.
- [ ] Zi Wei calculation failure produces a contained warning, not a blank page.
- [ ] No transit data produces an explicit empty state.
- [ ] Invalid IANA time zone produces a clear error.
- [ ] Local-history parsing failure does not crash the app.

## P1 — Repository and submission

- [ ] README English section accurately matches the implementation.
- [ ] Chinese README section remains useful.
- [ ] `agents.md` uses current `astrocopy.*` tool names.
- [ ] Privacy URL is live.
- [ ] English URL is live.
- [ ] Repository license and third-party attribution are present.
- [ ] Devpost copy matches the demo and does not overclaim scientific validity.
- [ ] Screenshots show the current UI, not an earlier design.
- [ ] Demo video link is public/unlisted as required.
- [ ] Submission is completed before the internal deadline.

## Final sign-off record

```text
Commit:
Deployment:
CI run:
Tester:
Browsers:
WebMCP environment:
Known limitations:
Submission URL:
```
