# MingXu — English Agent Guide

MingXu (AstroCopy engine) is a deterministic BaZi, Zi Wei Dou Shu, transit, apparent-solar-time, and Da Liu Ren workspace. Treat it as a calculation substrate and shared live page, not as a free-form fortune-telling prompt.

## Rules

1. Compute first; interpret second.
2. Preserve IANA time zone, civil time, solar-time correction, effective time, and boundary warnings.
3. Use `bazi.facts` as structural evidence only. It does not establish fortune, strength, or a successful transformation.
4. Do not equate Five-Phase counts with Day-Master strength.
5. Do not recalculate or alter pillars, palaces, or Da Liu Ren transmissions to fit a narrative.
6. When Da Liu Ren `crossCheck.status` is not `matched`, explain the differences first.
7. Present traditional metaphysics as a cultural interpretive system, not modern scientific prediction or professional advice.

## Shared WebMCP tools

- `astrocopy.create_birth_chart` — compute a chart and show it in the current page.
- `astrocopy.inspect_chart` — open overview, BaZi, Zi Wei, transits, comparison, or audit.
- `astrocopy.inspect_transit` — select one date in the visible transit workspace.
- `astrocopy.compare_transits` — show two to five dates together.
- `astrocopy.get_workspace_state` — read the current human/Agent-selected page state.

Human clicks and Agent calls use the same reducer. After changing the page, report the visible change briefly. Important Agent mutations should create a visible activity item and remain undoable.

`astrocopy.get_workspace_state` includes `selectedTransitDate`, `pinnedTransitDate`, `comparedTransitDates`, `focusedIds`, and concise `recentActivities`. A human pin is an explicit preference. Failed tool calls return `isError: true` and leave this state unchanged.

Use stable semantic focus IDs and the canonical comparison field:

```json
{
  "view": "ziwei",
  "focusIds": ["ziwei-palace-life", "ziwei-palace-body"]
}
```

```json
{
  "targetDates": ["2027-06-15", "2029-06-15", "2032-06-15"]
}
```

## Canonical APIs

```ts
createAstroProfile(input)
createTransitSnapshot(input, "2029-06-15")
createCompleteLiurenChart(input)
```

Never discard `warnings`, `time.shichenChanged`, `time.dateChanged`, or engine differences.

## Da Liu Ren

Casting entry and transmission selection are different layers:

- `time`: actual casting time;
- `number`: positive integer mapped cyclically with 1=Zi through 12=Hai;
- `branch`: directly selected hour branch.

The Nine-School methods determine Three Transmissions from the Four Lessons; they are not user-selectable casting modes.

Check the Month General, Earth/Heaven plates, Generals, Four Lessons, Three Transmissions, selected rule, void branches, hidden stems, Six Relations, patterns, source-gated Shen-Sha, warnings, and cross-check status before interpretation.

## Privacy

MingXu computes in the browser and does not automatically send chart data to an external AI. When a person explicitly invokes a WebMCP tool, its returned data becomes available to the active Agent and is processed under that provider's terms.

## Links

- App: <https://astrocopy.jackmeds.top/en/>
- Privacy: <https://astrocopy.jackmeds.top/privacy/>
- Repository: <https://github.com/JackMeds/sizhu-astro-ai>
