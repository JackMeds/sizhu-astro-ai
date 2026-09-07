# Contributing to MingXu / 命序

Thanks for helping improve a free, reproducible Chinese-metaphysics computation project.

## Good contributions

The highest-value contributions are usually:

- reproducible calculation edge cases;
- tests for time zones, DST, solar-time boundaries or calendrical transitions;
- BaZi / Zi Wei / Da Liu Ren calculation fixes with evidence;
- documentation and terminology improvements;
- Simplified/Traditional Chinese, English or other language work;
- WebMCP / MCP interoperability fixes;
- accessibility, performance and privacy improvements.

Please avoid adding interpretation claims as if they were deterministic calculation facts.

## Development

Requirements: Node.js 24 and npm.

```bash
npm install
npm run test
npm run typecheck
npm run build:web
```

For browser-Agent changes also run:

```bash
npm run test:webmcp
```

## Reporting a calculation discrepancy

Include as much of the following as possible:

- exact date and wall-clock time;
- IANA time zone;
- longitude when solar-time correction is involved;
- standard / local mean solar / apparent solar time mode;
- calendar type and day-change convention where relevant;
- expected result and the source or software used for comparison;
- actual MingXu result;
- version/commit if known.

For Da Liu Ren, include the casting method and the specific layer that differs (Month General, plates, Four Lessons, Three Transmissions, void branches, etc.).

## Pull requests

Keep PRs focused. Add or update tests for calculation behavior. Preserve warnings and cross-check differences instead of hiding disagreements between engines. Do not log personal birth/casting inputs in production telemetry or committed fixtures unless the data is clearly fictional/public and necessary for the test.

By contributing, you agree that your contribution is licensed under the repository's GPL-3.0 license.
