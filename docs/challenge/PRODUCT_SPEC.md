# AstroCopy — WebMCP Challenge Product Specification

## Product statement

AstroCopy is a bilingual shared chart workspace where deterministic Chinese-metaphysics computation and AI reasoning meet on the same live web page.

## Problem

A language model can discuss BaZi, Zi Wei Dou Shu, or Da Liu Ren, but it is not a dependable calendrical engine. In long conversations it may:

- silently change the UTC offset or daylight-saving assumption;
- calculate a different pillar for the same wall-clock input;
- confuse a casting entry with a transmission-selection rule;
- omit engine warnings;
- invent a neat narrative before establishing the chart structure.

Existing chart sites usually solve the calculation problem but stop at static output or copy-and-paste. They do not let a person and an Agent manipulate the same visible chart state.

## Product promise

> AstroCopy computes the chart with auditable code, then lets a person and an AI Agent inspect the same live workspace together.

## Primary audience

### Challenge demo audience

A technically literate user who wants to compare several future dates without asking the model to recalculate the underlying chart.

### Existing Chinese users

Users who want a reliable BaZi, Zi Wei, apparent-solar-time, or Da Liu Ren calculation substrate and prefer to choose their own AI provider.

### International users

English-speaking users who need clear terminology, IANA time zones, daylight-saving handling, and explanations that do not pretend Chinese metaphysics is Western astrology.

## Core user story

1. The user opens the English AstroCopy workspace.
2. The user or Agent creates a birth chart with explicit local time and IANA time zone.
3. AstroCopy displays the computed BaZi and Zi Wei structure.
4. The user asks the Agent to compare 2027, 2029, and 2032.
5. The Agent calls WebMCP tools.
6. The page opens a visible comparison view and highlights structural facts for those dates.
7. The user manually pins 2029 or changes the selected date.
8. The Agent reads the updated workspace state and continues from the user's choice.
9. The activity rail shows what the Agent changed and lets the user undo it.

## Product principles

### Deterministic before generative

- Calendrical and chart structure comes from versioned code.
- AI interpretation cannot overwrite chart facts.
- Warnings and engine differences remain visible.

### Shared state, not an invisible API

- Human clicks and Agent calls dispatch through the same reducer.
- Agent actions produce visible page changes.
- User changes are readable by the Agent.
- Important changes are logged and undoable.

### Progressive disclosure

- First-time flow: input → generate → inspect/compare.
- Professional details remain available in BaZi, Zi Wei, Da Liu Ren, and Audit views.
- Raw JSON and engine manifests stay in advanced areas.

### Honest cultural framing

- Preserve BaZi, Zi Wei Dou Shu, Da Liu Ren, Heavenly Stems, and Earthly Branches as source terms.
- Explain unfamiliar terms without mapping them onto unrelated Western-astrology concepts.
- State that traditional interpretations are not modern scientific findings.

### Local-first privacy

- Compute and save drafts/history in the browser.
- Never auto-send data to third-party AI sites.
- Clearly disclose that explicitly invoked WebMCP results are available to the current Agent.

## Information architecture

### Landing

- product statement;
- birth-chart and Da Liu Ren entry points;
- example chart;
- WebMCP availability state;
- deterministic / local-first / cross-checked trust indicators.

### Birth workspace

- input and current profile summary;
- overview;
- BaZi chart;
- Zi Wei chart;
- transit explorer and comparison;
- calculation audit;
- Agent activity rail and undo.

### Da Liu Ren workspace

- casting entry;
- time zone and optional solar-time correction;
- Earth/Heaven plates and Generals;
- Four Lessons;
- Three Transmissions;
- patterns, gated Shen-Sha, warnings, and engine cross-check;
- AI export.

### Developers

- WebMCP tools;
- local stdio MCP;
- Codex and generic-client setup;
- schemas and `agents.md`.

### Guides and trust

- terminology guides;
- time semantics;
- privacy;
- repository and validation architecture.

## WebMCP contract

### Create

`astrocopy.create_birth_chart`

- validates input;
- computes the profile;
- writes it into the shared workspace;
- opens the result view;
- records an Agent activity item;
- returns a concise summary of visible changes and warnings.

### Inspect

`astrocopy.inspect_chart`

- selects overview, BaZi, Zi Wei, transits, or audit;
- accepts stable semantic `focusIds`, including `ziwei-palace-life` and `ziwei-palace-body` in the Zi Wei view;
- visibly emphasizes the matching custom-renderer palace cards;
- does not return the full raw profile by default.

### Transit

`astrocopy.inspect_transit`

- selects one target date;
- updates the visible transit explorer;
- returns the matching cycle, year, structural relations, Zi Wei scopes, and warnings.

### Compare

`astrocopy.compare_transits`

- accepts two to five dates through the canonical `targetDates` field;
- creates or updates the visible comparison set;
- keeps the user's manually pinned date when possible;
- records one reversible Agent action.

### Read state

`astrocopy.get_workspace_state`

- reports active workspace/view;
- current chart identity;
- selected transit;
- comparison dates;
- focused items;
- warnings;
- recent human/Agent activity.

## Success criteria

- A first-time English user can create a correct chart outside China.
- The Agent can make a visible page change in one call.
- A user can manually alter the Agent-created state.
- The next Agent call reads that manual change.
- Every Agent UI mutation is visible and reversible.
- The main demo completes without copying JSON or leaving the page.
- No account, API key, backend database, or paid model integration is required.
