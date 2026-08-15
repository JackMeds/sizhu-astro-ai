# Da Liu Ren reference oracle

This directory contains the **reference engine only** for the Da Liu Ren migration.

## Why it exists

The web application is a TypeScript/browser-first project, while the implementation currently used as our reference is [`kentang2017/kinliuren`](https://github.com/kentang2017/kinliuren), a Python project under the MIT License.

Rather than copying a large Python implementation into the browser and hoping the port is correct, the migration uses a reference-oracle workflow:

1. Pin an exact upstream source commit.
2. Record representative Da Liu Ren fixtures from executable behavior.
3. Build the browser/TypeScript implementation subsystem by subsystem.
4. Compare the TypeScript result with the pinned reference output in CI.

## Primary pinned oracle

- Upstream repository: `kentang2017/kinliuren`
- Exact source commit: `3ba45a9540f08269b56d81508a061c7d46938785`
- Oracle interface: `Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)`
- Runtime in CI: source checkout + Python 3.12

The exact Git commit's **executable callable result** is the reference truth for the TypeScript migration. A future upstream change must be reviewed and fixtures intentionally updated; it must never silently change the browser engine.

## Upstream documentation divergence discovered during migration

For the public input `驚蟄 / 二 / 己未 / 甲午`, both the historical PyPI `kinliuren==0.1.2.9` package and the pinned GitHub source callable returned the same core result shape we observed in CI:

- `格局 = [返吟, 絕嗣]`
- 三傳 = 巳 → 戌 → 卯
- 四課 / 天地盤 are present
- `Liuren.result(0)` does **not** contain a top-level `神煞` field

The README at the pinned commit shows a richer sample for the same input with different pattern labels and a `神煞` block. Therefore README prose/sample output is treated as documentation evidence, not as an executable oracle. The migration will follow callable source behavior unless a specific extra subsystem is independently identified and tested.

## First executable fixture

Input:

```text
solar term: 驚蟄
lunar month: 二
day: 己未
hour: 甲午
```

Pinned callable invariants:

- 格局 = 返吟、絕嗣
- 初傳 = 巳
- 中傳 = 戌
- 末傳 = 卯
- 一課 starts with 子己
- 天盤 / 地盤 / 天將 each contain 12 entries
- top-level `神煞` is absent from `Liuren.result(0)`

## Calendar ownership

Users should **not** have to manually enter the four kinliuren parameters. `@sizhu/core` owns calendar conversion through `prepareLiurenCalendarInput(...)`, using the same explicit standard/local-mean/apparent-solar-time model as the rest of the project.

## Browser migration order

The native TypeScript engine is being ported in small audited slices:

1. 月將 + 天地盤
2. 天將
3. 四課
4. 三傳 / 課體
5. any extra 神煞 subsystem only after its actual upstream source path is identified

The Python oracle is a CI/reference dependency. It is not intended to become a runtime dependency of the static GitHub Pages application.
