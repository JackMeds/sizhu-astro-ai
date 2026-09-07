# MingXu / 命序 Growth Plan

Last updated: 2026-09-07

This document is the execution plan for search visibility, open-source discovery, AI/Agent distribution and community promotion. It deliberately avoids mass-produced SEO pages and paid backlink schemes.

## Current baseline

Already implemented:

- indexable `/bazi/`, `/ziwei/`, `/liuren/`, `/true-solar-time/` landing pages;
- bilingual `/zh/` and `/en/` application entries;
- OAI-SearchBot allowed in `robots.txt`;
- generated sitemap with Git-derived `lastmod`;
- `/agent/`, `agents.md`, `llms.txt` and generated Agent tool metadata;
- WebMCP bootstrap on static landing pages;
- shared `mingxu.*` tool registry;
- local stdio MCP plus deployment-ready Streamable HTTP MCP;
- boundary-focused SEO guides.

The next bottleneck is distribution and authority, not another large metadata rewrite.

## Phase 1 — discovery and trust (now)

### Search infrastructure

- [x] Keep canonical URLs stable.
- [x] Keep core tool pages directly linked from the static home document.
- [x] Keep OAI-SearchBot allowed.
- [x] Generate sitemap from source-file Git history.
- [x] Add IndexNow notification after successful Pages deployment.
- [x] Publish `/benchmark/` for reproducibility and edge-case validation.
- [x] Publish `/open-source/` for free/open-source intent and trust.
- [ ] Verify the property in Google Search Console and Bing Webmaster Tools.
- [ ] Request recrawl for legacy pages still showing the old brand.

### GitHub repository settings (manual repository settings, not source files)

Set the repository About metadata to:

**Description**

> Free, open-source BaZi, Zi Wei Dou Shu, Da Liu Ren & true solar time calculator with WebMCP and MCP support.

**Homepage**

`https://astrocopy.jackmeds.top/`

**Suggested topics**

`bazi`, `four-pillars`, `ziwei-doushu`, `da-liu-ren`, `chinese-metaphysics`, `chinese-astrology`, `true-solar-time`, `mcp`, `model-context-protocol`, `webmcp`, `ai-agent`, `chatgpt`, `typescript`, `open-source`

Also configure a 1280×640 GitHub social preview using the MingXu mark and the text “BaZi · Zi Wei Dou Shu · Da Liu Ren · MCP · WebMCP”.

## Phase 2 — MCP/WebMCP distribution

Submit only after the public Remote MCP endpoint is healthy.

Priority order:

1. Official MCP Registry.
2. Glama.
3. Smithery.
4. WebMCP.com.
5. WebMCP Directory.
6. MCP.so / MCPServers.org and other relevant directories.
7. High-quality Awesome MCP / Awesome WebMCP lists through normal contribution workflows.

Canonical description:

> MingXu is a free, open-source, deterministic BaZi, Zi Wei Dou Shu, Da Liu Ren, transit and true-solar-time computation toolkit for humans and AI agents, with WebMCP and MCP support.

Do not buy directory placements while free listings and organic technical references are still available.

## Phase 3 — content moat

Publish at most 1–2 high-value guides per week. Each guide must contain a direct answer, calculation rule, boundary conditions, reproducible example, explanation of why software may disagree, and a link to the relevant tool.

Priority backlog:

- 23:00 vs 00:00 day change in BaZi;
- true-solar-time correction crossing an hour branch;
- why BaZi software produces different pillars;
- why Zi Wei software produces different charts;
- Da Liu Ren reported-number vs actual-time casting;
- why different implementations produce different Three Transmissions;
- solar-term boundary cases;
- international time zones and DST in Chinese-metaphysics software.

Prefer content that can become a reference source for both humans and AI Search rather than generic encyclopedia articles.

## Phase 4 — community launch

Chinese developer/community sequence:

1. Linux.do — open-source + WebMCP/MCP technical experiment.
2. V2EX / 分享创造 — product architecture and privacy.
3. 掘金 — why deterministic calculation should be separated from LLM interpretation.
4. 知乎 — answer a concrete problem such as “为什么不同八字软件排盘不同？”.
5. Bilibili — live WebMCP demonstration and calculation-boundary explanation.

English sequence after Remote MCP is public and stable:

1. r/mcp;
2. r/opensource;
3. relevant WebMCP/MCP communities;
4. Show HN only after the benchmark, public MCP and polished demo are ready.

Do not cross-post identical advertising copy. Each community post should teach something useful and link to MingXu only where it naturally supports the explanation.

## Promotion assets

Maintain reusable copy in `docs/promotion/README.md`. Use one canonical product identity everywhere:

- Chinese: 命序
- English: MingXu
- AstroCopy: internal calculation-engine / legacy identity
- `@sizhu/*`: internal package namespace

## Weekly measurement

### Search

Track in Search Console:

- indexed pages;
- impressions by query and page;
- clicks and CTR;
- average position;
- queries newly entering Top 100 / Top 50 / Top 20.

Priority queries:

Chinese: `八字排盘`, `免费八字排盘`, `紫微斗数排盘`, `大六壬排盘`, `真太阳时`, `AI 八字排盘`, `开源八字排盘`.

English: `free bazi calculator`, `four pillars calculator`, `zi wei dou shu calculator`, `da liu ren calculator`, `Chinese metaphysics MCP`, `bazi MCP server`.

### GitHub

Track stars, forks, unique visitors, clones, referring sites, external issues and contributors. Stars are not the goal by themselves; they are evidence that distribution is reaching real developers/users.

### MCP

Track aggregate request count, tool distribution, success rate and latency. Do not log names, birth data, precise locations, casting questions or full payloads.

## 90-day direction

Reasonable targets, not guarantees:

- all core/trust pages indexed;
- 20–50 non-brand queries producing impressions;
- 5–10 long-tail queries entering Top 30;
- 15–25 relevant referring domains;
- multiple MCP/WebMCP directory listings;
- first external issues/PRs and meaningful GitHub stars.

The strategic rule is simple: stop repeatedly changing pages that are already indexable. Build evidence that MingXu is a real, maintained, cited open-source project — through reproducible tests, useful content, developer distribution and independent references.
