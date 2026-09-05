# 命序 — 中文 Agent 指南

命序（AstroCopy engine）是确定性优先的八字、紫微斗数、运限、真太阳时和大六壬工作台。Agent 应把它当作计算底座和共享网页状态，而不是一段可以自由改盘的算命提示词。

<!-- MINGXU:CANONICAL-TOOLS:START -->
## 确定性计算工具注册表

自动生成的机器可读注册表位于 [/agent/tools.json](https://mingxu.jackmeds.top/agent/tools.json)，可读摘要位于 [/agent/tools.md](https://mingxu.jackmeds.top/agent/tools.md)。确定性计算使用 `mingxu.*`，浏览器状态操作使用 `mingxu.ui.*`。

- `mingxu.about`
- `mingxu.create_birth_chart`
- `mingxu.get_transit_snapshot`
- `mingxu.compare_transits`
- `mingxu.create_liuren_chart`
- `mingxu.export_profile`
<!-- MINGXU:CANONICAL-TOOLS:END -->

## 基本规则

1. 先计算，后解释。
2. 保留 IANA 时区、标准时、太阳时修正、有效时间以及跨时辰/跨日期提醒。
3. `bazi.facts` 只表示程序能确定的结构事实，不直接等于吉凶、旺衰或合化成立。
4. 不得把五行数量直接当成日主旺衰。
5. 不得为了叙事自行重排四柱、紫微宫位或大六壬三传。
6. 六壬 `crossCheck.status` 不是 `matched` 时，先解释差异。
7. 传统术数属于文化解释框架，不等同于现代科学，也不替代医学、法律、财务等专业建议。

## 共享 WebMCP 工具

- `mingxu.create_birth_chart`：计算命盘并让它出现在当前网页。
- `mingxu.get_transit_snapshot`：计算一个日期的确定性运限快照，不改变网页状态。
- `mingxu.compare_transits`：基于同一出生资料计算 2–5 个日期。
- `mingxu.ui.inspect_chart`：打开概览、八字、紫微、运限、比较或计算审计视图。
- `mingxu.ui.inspect_transit`：在可见运限工作区选择一个日期。
- `mingxu.ui.compare_transits`：同屏比较 2–5 个日期。
- `mingxu.ui.get_workspace_state`：读取用户或 Agent 当前选择的页面状态。

人工点击和 Agent 调用使用同一个 reducer。Agent 改变页面后，应简要说明可见变化；重要操作要进入活动记录并可撤销。

`mingxu.ui.get_workspace_state` 会返回 `selectedTransitDate`、`pinnedTransitDate`、`comparedTransitDates`、`focusedIds` 和精简的 `recentActivities`。用户固定日期代表明确偏好；失败调用统一返回 `isError: true`，且不会改变这些状态。

紫微聚焦必须使用稳定语义 ID，日期比较必须使用统一字段：

```json
{
  "view": "ziwei",
  "focusIds": ["ziwei-palace-life", "ziwei-palace-body"]
}
```

```json
{
  "targetDates": ["2027-06-15", "2029-06-15", "2032-06-15"]
}
```

## 核心 API

```ts
createAstroProfile(input)
createTransitSnapshot(input, "2029-06-15")
createCompleteLiurenChart(input)
```

不得丢弃 `warnings`、`time.shichenChanged`、`time.dateChanged` 或引擎差异。

## 大六壬

起课入口与取三传是两个层次：

- `time`：按实际起课时间；
- `number`：正整数按 1=子…12=亥循环映射；
- `branch`：直接指定占时地支。

九宗门是依据四课决定三传的规则，不是让用户随意选择的九种起课方式。解释前先检查月将、天地盘、天将、四课、三传、取传法、旬空、遁干、六亲、课体、来源受控神煞、warning 和交叉校验。

## 隐私

命序默认在浏览器中计算，不会自动把命盘发送给外部 AI。用户主动调用 WebMCP 工具后，工具返回的数据会进入当前 Agent，并按照对应服务商条款处理。

## 链接

- 中文工作台：<https://mingxu.jackmeds.top/zh/>
- 隐私说明：<https://mingxu.jackmeds.top/privacy/>
- 仓库：<https://github.com/JackMeds/mingxu>
- AI 发现页：<https://mingxu.jackmeds.top/agent/>
- Remote MCP：`https://mcp.jackmeds.top/mcp`
