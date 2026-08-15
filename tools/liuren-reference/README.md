# Da Liu Ren reference oracle

This directory contains the **reference engine only** for the Da Liu Ren migration.

## Why it exists

The web application is a TypeScript/browser-first project, while the most mature implementation currently used as our reference is [`kentang2017/kinliuren`](https://github.com/kentang2017/kinliuren), a Python project under the MIT License.

Rather than copying a large Python implementation into the browser and hoping the port is correct, the migration uses a reference-oracle workflow:

1. Pin an exact upstream source commit.
2. Record representative Da Liu Ren fixtures.
3. Build the browser/TypeScript implementation subsystem by subsystem.
4. Compare the TypeScript result with the pinned reference output in CI.

## Primary pinned oracle

- Upstream repository: `kentang2017/kinliuren`
- Exact source commit: `3ba45a9540f08269b56d81508a061c7d46938785`
- Oracle interface: `Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)`
- Runtime in CI: source checkout + Python 3.12

The exact Git commit is the reference truth for the TypeScript migration. A future upstream change must be reviewed and fixtures intentionally updated; it must never silently change the browser engine.

## Historical PyPI release

`kinliuren==0.1.2.9` remains useful as a historical stable release, but it is **not** the primary oracle because it differs from the later upstream source. During migration we observed that the same public input preserved the Three Transmissions, Four Courses and Heaven/Earth disk while the PyPI release returned different pattern labels and omitted the newer `神煞` field found in the current README output.

That divergence is exactly why the project pins a source commit instead of assuming “latest README” and “latest published package” are identical.

## First fixture

The first fixture is the public example from the pinned upstream README:

```text
solar term: 驚蟄
lunar month: 二
day: 己未
hour: 甲午
```

The oracle validates key output invariants including:

- 初傳 = 巳
- 中傳 = 戌
- 末傳 = 卯
- 一課 starts with 子己
- 天盤 / 地盤 / 天將 each contain 12 entries
- the output includes `神煞`

## Calendar ownership

Users should **not** have to manually enter the four kinliuren parameters. `@sizhu/core` owns calendar conversion through `prepareLiurenCalendarInput(...)`, using the same explicit standard/local-mean/apparent-solar-time model as the rest of the project.

The Python oracle is a CI/reference dependency. It is not intended to become a runtime dependency of the static GitHub Pages application.
