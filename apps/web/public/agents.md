# 四柱星盘 AI — Agent Guide

四柱星盘 AI 是一个本地优先、确定性优先的八字、紫微斗数与大六壬计算工作台。Agent 应把本项目视为“计算底座”，而不是一段让模型自由发挥的命理提示词。本站本身不提供命理解读；网页用户通常会把计算结果复制到自己喜欢的 AI 再进行分析。

## 核心原则

1. **先计算，后解释。** 四柱、大运、流年、流月、紫微动态范围与六壬课盘优先来自 `@sizhu/core`。
2. **时间口径必须显式。** `profile.time` 同时保留标准时、地方平太阳时、视太阳时（真太阳时）和实际采用的有效时间。
3. **结构事实先于术数判断。** `bazi.facts` 可以确定冲、合、刑、害、破、伏吟、三合/三会候选等关系；旺衰、吉凶、合化是否成立留给规则层。
4. **传统规则必须过条件门禁。** 只有来源和月支/日干/时柱等条件匹配的经典条目才能进入 evidence；不得把相似关键词当成规则命中。
5. **不要把五行数量直接当成旺衰。** `elementCounts` 是结构统计，不是最终身强身弱判断。
6. **保留不确定性。** 如果太阳时校正导致跨时辰 / 跨日期，或输入缺失经度，应把 warning 一并交给用户。
7. **解释层不得篡改排盘事实。** AI 可以比较传统规则和流派，但不能为了贴合叙事重算四柱、紫微或六壬结构。
8. **六壬先看 crossCheck。** 如果完整引擎与项目原生结构层存在重叠字段差异，应先向用户说明差异，不要跳过校验直接解课。

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

返回：目标年份所在八字大运与流年、大运/流年和本命的确定性关系事实，以及紫微大限、小限、流年、流月、流日、流时及四化。

## 完整大六壬

六壬是独立占问 session，不应和出生命盘混为一谈。

### 起课入口与取三传必须分开

当前 `createCompleteLiurenChart(...)` 支持三种入口：

- `castingMethod: "time"`：正时起课，按实际时间口径取占时；
- `castingMethod: "number"`：报数起课，1=子…12=亥循环映射，数字只负责决定最终占时支；
- `castingMethod: "branch"`：直接指定子至亥某一占时支，适合高级输入与复盘。

九宗门属于**从四课取三传的规则层**，不等同于九种起课入口。Agent 不应让用户“任选一个九宗门算法”来改变结果；程序应根据四课条件自动命中实际取传法。

```ts
createCompleteLiurenChart({
  dateTime: "2026-08-15T09:30:00+08:00",
  timezone: "Asia/Shanghai",
  castingMethod: "time",
  question: "可选占问"
})
```

完整结果包含：

- 月将、天地盘、十二天将、贵人 / 昼夜
- 四课
- 九宗门条件判定后的三传与 `transmissionRule`
- 旬空
- 三传遁干与六亲
- 传局、课体 / 格局标签
- 来源受控的神煞 evidence
- 多引擎重叠字段 `crossCheck`
- 明确的 `engineManifest` 与 warnings

### 六壬引擎与校验

- `sizhu-liuren-ts@0.2.0`：项目自己的可审计结构层；
- `mingyu-core@0.1.23`：MIT 发布版，提供完整三传 / 课体 / 神煞等结构并作为第二 TypeScript 引擎；
- `kentang2017/kinliuren` 固定 commit `3ba45a9540f08269b56d81508a061c7d46938785`：Python CI oracle。

Agent 应优先使用归一后的 `sizhu-liuren-chart`，而不是直接把第三方 raw result 当作最终协议。如果 `crossCheck.status === "differences"`，先读取 `crossCheck.differences` 并说明口径差异。

## Web / WebMCP

网页会在支持 `document.modelContext` / `navigator.modelContext` 的环境注册：

- `sizhu.about`
- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_transit_snapshot`
- `sizhu.create_liuren_chart`
- `sizhu.create_liuren_base_chart`（旧兼容接口）
- `sizhu.get_current_chart`

传统 MCP Server 位于 `apps/mcp`，提供同名完整六壬能力。

## 搜索与文档入口

- 网站：<https://astrocopy.jackmeds.top/>
- 指南：<https://astrocopy.jackmeds.top/guide/>
- Sitemap：<https://astrocopy.jackmeds.top/sitemap.xml>
- Robots：<https://astrocopy.jackmeds.top/robots.txt>
- 八字指南：<https://astrocopy.jackmeds.top/guide/bazi.html>
- 紫微指南：<https://astrocopy.jackmeds.top/guide/ziwei.html>
- 真太阳时指南：<https://astrocopy.jackmeds.top/guide/solar-time.html>
- 大运流年指南：<https://astrocopy.jackmeds.top/guide/dayun.html>
- 大六壬指南：<https://astrocopy.jackmeds.top/guide/liuren.html>

## 推荐的 Agent 工作流

当用户询问“我的八字 / 紫微 / 某年运势”时：

1. 收集或读取出生时间、性别、时区、时间口径；需要太阳时修正时补经度。
2. 调用 `createAstroProfile` 生成 canonical profile。
3. 检查 `warnings`、`time.shichenChanged` 和 `time.dateChanged`。
4. 查询具体日期时调用 `createTransitSnapshot`，不要自行推流年或紫微运限。
5. 先读取 `bazi.facts`、规则 evidence 和紫微标准化字段，再进入传统术数解释。
6. 明确区分“程序计算事实”“传统规则”“综合判断”。

当用户询问“大六壬起课”时：

1. 确定起课入口：正时 / 报数 / 指定占时；收集基础日期时间和可选占问。
2. 正时且需要太阳时修正时收集经度；报数 / 指定占时以最终选出的地支为占时，不再二次移动占时支。
3. 调用 `createCompleteLiurenChart` / `sizhu.create_liuren_chart`。
4. 先检查 `crossCheck` 和 `warnings`。
5. 读取四课、三传、取传法、旬空、遁干、六亲、课体和神煞 evidence。
6. 如用户要求解释，再基于这些已排好的结构解课；**不要自行重排**。

## 当前技术栈

- `lunar-javascript` 1.7.7：八字、运限、节气与六壬历法桥
- `iztro`：紫微斗数与动态运限
- `lunisolar`：交叉校验
- `mingyu-core` 0.1.23：完整六壬第二 TypeScript 引擎
- `kentang2017/kinliuren` pinned source：六壬 Python CI oracle
- React + Vite：网页
- MCP SDK：本地 Agent 接入

Golden Fixture 固定关键命例、子时 sect、立春边界、关系事实和 Zi Wei 动态范围；六壬另有双 TypeScript 引擎重叠校验与 pinned Python oracle，避免迁移时悄悄漂移。
