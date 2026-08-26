# AstroCopy — WebMCP Browser QA Record

## 2026-08-26 integration probe

This record separates a real page-level WebMCP integration result from the final
ChatGPT challenge-browser sign-off. The probe used only the fictional `Alex Demo`
profile from [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

### Environment

- Branch: `challenge/webmcp-2026`
- Commit: `9c5287e` (documentation-only child of the verified implementation)
- Page: local production build at `http://127.0.0.1:4173/?lang=en`
- Browser surface: Codex in-app browser with its native page-defined WebMCP capability
- External-browser comparison: the connected Edge session could open ChatGPT and
  AstroCopy, but `document.modelContext` was unavailable in that browser build

The Codex in-app result is strong integration evidence, but it is not the required
ChatGPT in-app-browser sign-off. P0-011 therefore remains `TODO`.

### Discovery and calls

- Empty workspace: exactly three foundational tools were discovered:
  `astrocopy.about`, `astrocopy.create_birth_chart`, and
  `astrocopy.get_workspace_state`.
- After `astrocopy.create_birth_chart`: exactly six unique tools were advertised;
  `astrocopy.inspect_chart`, `astrocopy.inspect_transit`, and
  `astrocopy.compare_transits` appeared dynamically.
- All six tools were called through the browser's WebMCP capability.
- The visible page rendered the English result state. The created chart reported
  `Asia/Shanghai`, offset `480`, normalized local time
  `1996-06-18T10:30:00`, and the deterministic pillars.
- `inspect_chart` visibly focused the semantic Life and Body Palace targets; two
  elements reported `data-agent-focused="true"`.
- `inspect_transit` visibly selected `2028-06-15`.
- `compare_transits` rendered the 2027, 2029, and 2032 comparison in the shared page.

### Contract and shared-state checks

- Two-date and five-date comparisons succeeded.
- One-date, six-date, duplicate-date, and legacy `dates` inputs returned
  `isError: true`.
- Invalid calls left the workspace state unchanged.
- A human UI selection and pin of `2029-06-15` were returned by
  `get_workspace_state`, including the human pin activity.
- Undoing the latest Agent comparison restored its previous comparison snapshot
  while retaining the newer human selection and pin.

### Remaining P0-011 sign-off

Run the same fictional flow in the current official ChatGPT challenge browser:

1. Record the browser name/version, WebMCP experiment state, deployment URL, and commit.
2. Verify the three-tool empty state and six-tool post-profile state.
3. Call all six tools and capture the visible Life/Body focus and transit comparison.
4. Make a human 2029 selection and pin, read them through the Agent, then undo the
   Agent comparison without losing either human choice.
5. Record any permission prompt, tool-discovery delay, console error, or browser-only
   contract difference before marking P0-011 `DONE`.
