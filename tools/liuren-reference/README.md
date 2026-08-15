# Da Liu Ren reference oracle

This directory contains the **reference engine only** for the Da Liu Ren migration.

## Why it exists

The web application is a TypeScript/browser-first project, while the most mature implementation currently used as our reference is [`kentang2017/kinliuren`](https://github.com/kentang2017/kinliuren), a Python project under the MIT License.

Rather than copying a large Python implementation into the browser and hoping the port is correct, the migration uses a reference-oracle workflow:

1. Pin a known Python release.
2. Record representative Da Liu Ren fixtures.
3. Build the browser/TypeScript implementation subsystem by subsystem.
4. Compare the TypeScript result with the pinned reference output in CI.

## Pinned reference

- PyPI package: `kinliuren==0.1.2.9`
- Stable oracle interface: `Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)`
- Upstream repository: `kentang2017/kinliuren`
- Upstream development commit observed during this migration: `3ba45a9540f08269b56d81508a061c7d46938785`

The PyPI release is the regression oracle. A newer upstream GitHub commit may be inspected for fixes and algorithm changes, but must not silently change existing fixtures.

## First fixture

The first fixture is the public example from the upstream README:

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

## Calendar ownership

Users should **not** have to manually enter the four kinliuren parameters. `@sizhu/core` owns calendar conversion through `prepareLiurenCalendarInput(...)`, using the same explicit standard/local-mean/apparent-solar-time model as the rest of the project.

The Python oracle is a CI/reference dependency. It is not intended to become a runtime dependency of the static GitHub Pages application.
