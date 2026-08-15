# 四柱星盘 AI — Agent Guide

四柱星盘 AI 是一个本地优先、确定性优先的八字与紫微斗数计算工作台。Agent 应把本项目视为“计算底座”，而不是一段让模型自由发挥的命理提示词。

## 核心原则

1. **先计算，后解释。** 四柱、大运、流年、流月与紫微数据优先来自 `@sizhu/core`。
2. **时间口径必须显式。** `profile.time` 会同时保留标准时、地方平太阳时、视太阳时（真太阳时）和实际采用的有效时间。
3. **不要把五行数量直接当成旺衰。** `elementCounts` 是结构统计，不是最终身强身弱判断。
4. **保留不确定性。** 如果太阳时校正导致跨时辰 / 跨日期，或输入缺失经度，应把 warning 一并交给用户。
5. **解释层不得篡改排盘事实。** AI 可以比较传统规则和流派，但不能为了贴合叙事重算四柱。

## Canonical profile

主要入口：

```ts
createAstroProfile(input)
```

返回对象包含：

- `input`：原始排盘输入
- `time`：三套时间口径和有效出生时间
- `bazi`：四柱、十神、藏干、纳音、空亡、大运、流年、流月
- `ziwei`：紫微十二宫与原始 iztro 数据
- `divination`：六壬 / 六爻适配位置（当前仍在扩展）
- `ai`：面向 AI 的摘要和证据块
- `warnings`：需要向用户暴露的不确定性

## Web / WebMCP

网页会在支持 `document.modelContext` / `navigator.modelContext` 的环境注册：

- `sizhu.about`
- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_current_chart`

传统 MCP Server 位于 `apps/mcp`。

## 搜索与文档入口

- 网站：<https://jackmeds.github.io/sizhu-astro-ai/>
- 指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/>
- Sitemap：<https://jackmeds.github.io/sizhu-astro-ai/sitemap.xml>
- 八字指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/bazi.html>
- 紫微指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/ziwei.html>
- 真太阳时指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/solar-time.html>
- 大运流年指南：<https://jackmeds.github.io/sizhu-astro-ai/guide/dayun.html>

## 推荐的 Agent 工作流

当用户询问“我的八字 / 紫微 / 某年运势”时：

1. 收集或读取出生时间、性别、时区、时间口径；需要太阳时修正时补经度。
2. 调用项目计算接口生成 canonical profile。
3. 检查 `warnings`、`time.shichenChanged` 和 `time.dateChanged`。
4. 从 `bazi` / `ziwei` 提取目标时间范围的数据。
5. 最后才进入传统术数解释，并明确区分“程序计算事实”和“解释判断”。

## 当前技术栈

- `lunar-javascript` 1.7.7：八字、运限与历法
- `iztro`：紫微斗数
- `lunisolar`：交叉校验
- React + Vite：网页
- MCP SDK：本地 Agent 接入

Golden Fixture 会固定关键命例、子时 sect 和立春边界，避免依赖升级悄悄改变排盘结果。
