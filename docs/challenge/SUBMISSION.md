# AstroCopy — Submission Copy

## Project name

AstroCopy

## Tagline

Deterministic Chinese-metaphysics computation and AI reasoning in one shared WebMCP workspace.

## One-sentence description

AstroCopy computes BaZi, Zi Wei Dou Shu, transits, apparent solar time, and Da Liu Ren with auditable code, then lets a person and an AI Agent inspect and change the same visible browser state.

## Short description

Language models are useful interpreters but unreliable calendrical engines. AstroCopy moves chart calculation into a deterministic, local-first TypeScript core and exposes a bilingual live workspace through WebMCP. An Agent can create a chart, open a view, select or compare dates, and read the user's subsequent manual selections. Every Agent UI change is visible, recorded, and undoable.

## Full project description

### The problem

BaZi, Zi Wei Dou Shu, and Da Liu Ren depend on precise calendar, time-zone, solar-time, and rule-driven structure. Asking a language model to repeatedly calculate those structures inside a conversation can produce silent inconsistencies. Conventional chart sites calculate more reliably, but most stop at a static page or a copy-and-paste export.

### The solution

AstroCopy separates deterministic computation from AI reasoning.

Its calculation core produces an explicit canonical profile containing civil and solar-time semantics, Four Pillars, Ten Gods, hidden stems, luck cycles, structural relations, Zi Wei palaces and transformations, transit scopes, Da Liu Ren plates and transmissions, engine warnings, and cross-check evidence.

WebMCP then connects that core to the page the user is already viewing. The Agent does not merely receive an invisible JSON response. It changes the live workspace:

- create a birth chart;
- open BaZi, Zi Wei, transit, comparison, or calculation-audit views;
- inspect one target date;
- compare two to five dates;
- read the current state after the user changes it manually.

Human clicks and Agent calls share one reducer. Agent actions appear in a visible activity rail and can be undone.

### Thoughtful use of WebMCP

AstroCopy uses WebMCP for shared context and user control, not as a thin wrapper over an API.

The tool surface is task-oriented and intentionally small. Tools return concise summaries and visible-change metadata rather than flooding the model with a full raw chart by default. Relevant tools are scoped to the current workspace, and the page remains fully usable without WebMCP.

### Originality

AstroCopy applies agent-native web interaction to a culturally specific, calculation-heavy domain that is rarely represented in AI demos. It preserves Chinese terminology and chart characters while providing natural English explanations and international IANA time-zone handling.

The Zi Wei interface is an original twelve-palace renderer built from normalized calculation data rather than a recolored third-party UI.

### Trust and privacy

- Calculation runs in the browser.
- No account or backend chart database is required.
- Data is not automatically sent to another AI service.
- WebMCP sharing is explicit and disclosed.
- Time corrections, warnings, and engine differences remain visible.
- Traditional metaphysics is presented as a cultural interpretive framework, not modern scientific fact or professional advice.

## Technology

- React 19 + Vite
- TypeScript
- WebMCP `document.modelContext`
- Shared reducer/provider for human–Agent state
- `lunar-javascript` for BaZi and calendrical structure
- `iztro` for Zi Wei calculation
- `lunisolar` for overlap cross-checks
- `mingyu-core` plus an AstroCopy native layer for complete Da Liu Ren
- pinned `kinliuren` Python fixtures as CI oracle
- GitHub Pages + custom domain

## Suggested judging highlights

### Usefulness

Prevents the Agent from repeatedly and inconsistently recalculating complex chart structures, while preserving user choice of AI provider.

### Originality

A bilingual, agent-native Chinese-metaphysics workspace with original chart visualization and explicit cultural terminology.

### Execution

International time zones and DST, deterministic engines, cross-check evidence, local-first storage, responsive UI, English exports, tests, and public source.

### Thoughtful WebMCP

Visible state changes, dynamic task tools, concise results, shared reducer, activity log, and undo rather than a hidden JSON endpoint.

### Human–agent experience

The user can change the Agent-created selection manually, and the Agent reads and continues from that updated state.

## Links to complete before submission

- Live English app: `https://astrocopy.jackmeds.top/en/`
- Repository: `https://github.com/JackMeds/sizhu-astro-ai`
- Privacy: `https://astrocopy.jackmeds.top/privacy/`
- Demo video: `TBD`
- Challenge submission: `TBD`

## Recommended screenshots

1. English landing/workspace with WebMCP ready state.
2. Original Zi Wei twelve-palace renderer.
3. Three-date transit comparison with Agent activity rail.
4. Calculation audit showing explicit time basis and cross-check state.
5. Complete Da Liu Ren Four Lessons / Three Transmissions view as a depth screenshot.

## Repository topic suggestions

`webmcp`, `mcp`, `bazi`, `ziwei`, `da-liu-ren`, `chinese-metaphysics`, `react`, `typescript`, `local-first`, `ai-agent`
