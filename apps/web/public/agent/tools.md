# MingXu Agent Tool Registry

This file is generated from `packages/agent-tools/src/index.ts`. The canonical namespace is `mingxu.*`; browser-only state tools use `mingxu.ui.*`.

## Canonical computation tools

- **mingxu.about** — About MingXu / 命序. Describe MingXu's deterministic BaZi, Zi Wei Dou Shu, transit, true-solar-time and Da Liu Ren capabilities, privacy boundary, and canonical tool names.
- **mingxu.create_birth_chart** — Create MingXu Birth Chart. Generate a deterministic BaZi and Zi Wei birth chart. Use this instead of calculating pillars or palaces yourself; preserve the returned time semantics and warnings.
- **mingxu.get_transit_snapshot** — Get Transit Snapshot. For one target date, return matching BaZi luck-cycle and annual relation facts plus normalized Zi Wei dynamic scopes. The target date must be YYYY-MM-DD.
- **mingxu.compare_transits** — Compare Transit Snapshots. Compute two to five unique target dates from the same birth input and return a compact, deterministic comparison. Use targetDates, not a singular targetDate.
- **mingxu.create_liuren_chart** — Create Complete Da Liu Ren Chart. Generate a complete Da Liu Ren chart from time, reported-number, or selected-branch casting. Returns plates, generals, Four Lessons, Three Transmissions, voids, patterns, source-gated ShenSha, warnings, and cross-check evidence; it does not interpret the divination.
- **mingxu.export_profile** — Export MingXu Profile. Generate JSON, Markdown, or plain-text output from a deterministic MingXu BaZi and Zi Wei profile for saving or passing to another AI.

## Deprecated aliases

- `astrocopy.about` → `mingxu.about`
- `astrocopy.create_birth_chart` → `mingxu.create_birth_chart`
- `astrocopy.get_transit_snapshot` → `mingxu.get_transit_snapshot`
- `astrocopy.compare_transits` → `mingxu.compare_transits`
- `astrocopy.create_liuren_chart` → `mingxu.create_liuren_chart`
- `astrocopy.export_profile` → `mingxu.export_profile`
- `sizhu.about` → `mingxu.about`
- `sizhu.create_profile` → `mingxu.create_birth_chart`
- `sizhu.create_bazi_profile` → `mingxu.create_birth_chart`
- `sizhu.create_ziwei_profile` → `mingxu.create_birth_chart`
- `sizhu.get_transit_snapshot` → `mingxu.get_transit_snapshot`
- `sizhu.create_liuren_chart` → `mingxu.create_liuren_chart`
- `sizhu.create_ai_prompt` → `mingxu.export_profile`
- `sizhu.export_profile_markdown` → `mingxu.export_profile`
