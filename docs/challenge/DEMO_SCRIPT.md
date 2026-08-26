# AstroCopy — 90-Second Demo Script

## Demo goal

Show that AstroCopy is not merely a chart API. The Agent and the person manipulate the same visible, deterministic workspace.

## Recording setup

- Use the English route: `https://astrocopy.jackmeds.top/en/`
- Browser: ChatGPT in-app browser with WebMCP enabled
- Viewport: approximately 1440×900
- Use a fictional birth profile; do not record real private birth data
- Clear browser history and Agent activity before recording
- Keep the mouse still during tool execution so the page change is clearly attributable to the Agent

## Fictional profile

- Name: Alex Demo
- Gender input: Female
- Birth local time: 1996-06-18 10:30
- Time zone: Asia/Shanghai
- Calendar: Solar
- Time basis: Standard civil time

## Spoken script and screen actions

### 0–8 seconds — Problem

**Voiceover**

> Language models can discuss Chinese astrology, but they are unreliable calendrical engines.

**Screen**

- Briefly show an empty AstroCopy workspace.
- On-screen caption: `Do not ask the model to recalculate the chart.`

### 8–20 seconds — Product idea

**Voiceover**

> AstroCopy separates deterministic computation from AI reasoning.

**User prompt to Agent**

> Create a birth chart for the fictional profile shown on the page. Use the site's tools rather than calculating the chart yourself.

**Expected WebMCP call**

- `astrocopy.create_birth_chart`

**Visible page change**

- Form/profile fills or updates.
- Chart-ready state appears.
- Four Pillars and Zi Wei summary are visible.
- Agent activity rail records `Created a birth chart`.

### 20–35 seconds — Shared live chart

**Voiceover**

> The tool result does not disappear into the chat. It becomes the chart the user is looking at.

**User prompt to Agent**

> Open the Zi Wei chart and focus the Life and Body Palaces.

**Expected call**

- `astrocopy.inspect_chart`

```json
{
  "view": "ziwei",
  "focusIds": ["ziwei-palace-life", "ziwei-palace-body"]
}
```

**Visible page change**

- Zi Wei tab opens.
- Original AstroCopy twelve-palace renderer appears.
- Life and Body Palaces receive visible emphasis.

### 35–60 seconds — Agent-created comparison

**User prompt to Agent**

> Compare 2027, 2029, and 2032 for career timing. Do not reinterpret yet; first show me the structural differences.

**Expected call**

- `astrocopy.compare_transits`

```json
{
  "targetDates": ["2027-06-15", "2029-06-15", "2032-06-15"]
}
```

**Visible page change**

- Transit/comparison view opens.
- Three date cards appear.
- Each card shows the matching BaZi cycle/year relations and Zi Wei scopes.
- Activity rail records one reversible comparison action.

**Voiceover**

> AstroCopy computes each date from the same canonical profile and keeps the comparison visible.

### 60–75 seconds — Human takes control

**Screen action**

- The user manually selects or pins 2029.

**User prompt to Agent**

> Continue from the year I just selected. Why does it stand out structurally?

**Expected call**

- `astrocopy.get_workspace_state`
- optionally `astrocopy.inspect_transit`

**Visible proof**

- Agent reads 2029 as the human-selected state rather than repeating its previous assumption.

**Voiceover**

> Human clicks and Agent calls use the same state. The Agent can follow the user's choice.

### 75–84 seconds — Trust and control

**Screen**

- Show activity rail.
- Hover or click Undo on the previous Agent action.
- Briefly show Calculation Audit / warnings.

**Voiceover**

> Agent changes are visible, auditable, and undoable. Time-zone and engine warnings are never hidden.

### 84–90 seconds — Close

**Voiceover**

> AstroCopy. Deterministic chart engine. Any AI you choose. One shared workspace.

**End card**

```text
AstroCopy
Deterministic computation × shared WebMCP workspace
astrocopy.jackmeds.top
```

## Backup demo prompt

Use this when the live conversation needs to be restarted:

> Use AstroCopy's WebMCP tools. Create the fictional Alex Demo birth chart already entered on the page, then compare 2027-06-15, 2029-06-15, and 2032-06-15. First make the relevant changes visible in the page. Do not recalculate the Four Pillars or Zi Wei data yourself.

## Recording acceptance checks

- The tool call name is visible at least once.
- The page visibly changes after each Agent call.
- No raw JSON wall dominates the recording.
- The custom Zi Wei renderer is shown.
- The human manually changes one Agent-created selection.
- The Agent reads the new human-selected state.
- Activity/undo is shown.
- English UI contains no obvious Chinese-only control labels; chart characters may remain Chinese.
- No real person's private birth information appears.
- Final video is under the platform's limit and understandable without audio.
