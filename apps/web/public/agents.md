# 四柱星盘 AI — Agent Guide

四柱星盘 AI 是一个本地优先、确定性优先的八字、紫微斗数与大六壬结构计算工作台。Agent 应把本项目视为“计算底座”，而不是一段让模型自由发挥的命理提示词。本站本身不提供命理解读；网页用户通常会把计算结果复制到自己喜欢的 AI 再进行分析。

## 核心原则

1. **先计算，后解释。** 四柱、大运、流年、流月、紫微动态范围和已公开的六壬结构优先来自 `@sizhu/core`。
2. **时间口径必须显式。** `profile.time` 同时保留标准时、地方平太阳时、视太阳时（真太阳时）和实际采用的有效时间。
3. **结构事实先于术数判断。** `bazi.facts` 可以确定冲、合、刑、害、破、伏吟、三合/三会候选等关系；旺衰、吉凶、合化是否成立留给规则层。
4. **传统规则必须过条件门禁。** 只有来源和月支/日干/时柱等条件匹配的经典条目才能进入 evidence；不得把相似关键词当成规则命中。
5. **不要把五行数量直接当成旺衰。** `elementCounts` 是结构统计，不是最终身强身弱判断。
6. **保留不确定性。** 如果太阳时校正导致跨时辰 / 跨日期，或输入缺失经度，应把 warning 一并交给用户。
7. **解释层不得篡改排盘事实。** AI 可以比较传统规则和流派，但不能为了贴合叙事重算四柱、紫微或六壬结构。

## Canonical profile

```ts
createAstroProfile(input)
```

返回对象包含：

- `input`：原始排盘输入
- `time`：三套时间口径和有效出生时间
- `bazi`：四柱、十神、藏干、纳音、空亡、大运、流年、流月，以及 `bazi-relations-v1` 事实层
- `ziwei`：命宫/身宫、命主身主、五行局、十二宫、星曜类型/亮度/四化、大限与原始 iztro 数据
- `divination`：出生 profile 中只保留占术能力状态；具体六壬起课使用独立 session API
- `ai`：面向 AI 的摘要和证据块
- `warnings`：需要向用户暴露的不确定性

## 目标日期运限

```ts
createTransitSnapshot(input, "2027-06-15")
```

返回：

- 目标年份所在八字大运与流年
- 大运 / 流年与本命之间的确定性关系事实
- 紫微大限、小限、流年、流月、流日、流时及对应四化

也可以分别调用 `createTransitBaziFacts(...)` 与 `createZiweiHoroscope(...)`。

## 大六壬 Beta

六壬是独立的占问 session，不应和出生命盘混为一谈。

```ts
createLiurenBaseChart({
  dateTime: "2026-08-15T09:30:00+08:00",
  timezone: "Asia/Shanghai",
  question: "可选占问"
})
```

当前只可把以下字段视为公开、已回归的确定性结构：

- 节气 / 农历月 / 日干支 / 时干支
- 月将
- 天地盘
- 天将
- 四课

**当前不可宣称已经得到完整六壬课。** 三传、课体和神煞仍在迁移中。网页与 MCP 的 `sizhu.create_liuren_base_chart` 都有同样边界。

六壬迁移参考固定 `kentang2017/kinliuren` commit `3ba45a9540f08269b56d81508a061c7d46938785` 的可执行 `Liuren.result(0)`。如果 README prose 与固定 commit 的执行结果矛盾，应保留差异并以可执行 oracle 作为移植回归真值。

## Web / WebMCP

网页会在支持 `document.modelContext` / `navigator.modelContext` 的环境注册：

- `sizhu.about`
- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_transit_snapshot`
- `sizhu.create_liuren_base_chart`
- `sizhu.get_current_chart`

传统 MCP Server 位于 `apps/mcp`，提供相同的六壬 Beta 能力。

## 搜索与文档入口

- 网站：<https://jackmeds.github.io/sizhu-astro-ai/>
- 指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/>
- Sitemap：<https://jackmeds.github.io/sizhu-astro-ai/sitemap.xml>
- Robots：<https://jackmeds.github.io/sizhu-astro-ai/robots.txt>
- 八字指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/bazi.html>
- 紫微指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/ziwei.html>
- 真太阳时指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/solar-time.html>
- 大运流年指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/dayun.html>

## 推荐的 Agent 工作流

当用户询问“我的八字 / 紫微 / 某年运势”时：

1. 收集或读取出生时间、性别、时区、时间口径；需要太阳时修正时补经度。
2. 调用 `createAstroProfile` 生成 canonical profile。
3. 检查 `warnings`、`time.shichenChanged` 和 `time.dateChanged`。
4. 查询具体日期时调用 `createTransitSnapshot`，不要自行推流年或紫微运限。
5. 先读取 `bazi.facts`、规则 evidence 和紫微标准化字段，再进入传统术数解释。
6. 明确区分“程序计算事实”“传统规则”“综合判断”。

当用户询问“大六壬起课”时：

1. 收集起课时间、时区；需要太阳时修正时补经度；占问文本可选。
2. 调用 `createLiurenBaseChart` / `sizhu.create_liuren_base_chart`。
3. 当前仅报告月将、天地盘、天将、四课结构。
4. 如果用户要求三传/课体/神煞，应明确说明当前 Beta 尚未完成这些部分，而不是自行补算。

## 当前技术栈

- `lunar-javascript` 1.7.7：八字、运限、节气与六壬历法桥
- `iztro`：紫微斗数与动态运限
- `lunisolar`：交叉校验
- `kentang2017/kinliuren` pinned source：六壬 Python CI oracle
- React + Vite：网页
- MCP SDK：本地 Agent 接入

Golden Fixture 固定关键命例、子时 sect、立春边界、关系事实和 Zi Wei 动态范围；六壬另有 pinned Python oracle 与 TypeScript fixture，避免迁移时悄悄漂移。
