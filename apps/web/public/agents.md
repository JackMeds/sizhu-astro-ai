# 四柱星盘 AI Agent Guide

四柱星盘 AI 是一个本地优先的静态命盘与 AI 提示词工作台。网页端用于生成八字、紫微斗数结构化资料，并把这些资料整理成适合 ChatGPT、Claude、DeepSeek、豆包、通义、Kimi 等工具读取的提示词。

开源仓库：`https://github.com/JackMeds/sizhu-astro-ai`

## 能力边界

- 静态网页：排盘、提示词生成、历史记录均在浏览器本地完成。
- 传统 MCP Server：由本地 `apps/mcp` 进程提供，适合 Claude Desktop、Codex、Cursor 等 MCP 客户端连接。
- WebMCP：由网页在支持 `modelContext` 的浏览器、扩展或 Chrome DevTools MCP 桥接环境中注册工具。
- HTTP API：当前未启用，后续可单独部署到 Vercel、Cloudflare Workers、Netlify Functions 或自有服务器。

普通浏览器访问页面时，WebMCP 工具通常不会显示；这不是错误。

## WebMCP Tools

当运行环境支持 `document.modelContext` 或 `navigator.modelContext` 时，页面会注册以下只读工具：

- `sizhu.about`
- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_current_chart`

这些工具不会主动读取远程服务器数据。`sizhu.get_current_chart` 只返回当前网页内已经生成的命盘；如果页面还没有生成命盘，会返回 `needsInput: true`。

## BirthInfo Schema

```json
{
  "name": "静仪",
  "gender": "female",
  "birthDateTime": "1995-03-12T14:20:00+08:00",
  "calendar": "solar",
  "timezone": "Asia/Shanghai",
  "trueSolarTime": "longitude",
  "location": {
    "name": "上海市黄浦区",
    "longitude": 121.49,
    "latitude": 31.23
  },
  "sect": 1
}
```

字段说明：

- `gender`: `male` 或 `female`
- `calendar`: `solar` 或 `lunar`
- `trueSolarTime`: `none` 表示标准时，`longitude` 表示按经度记录真太阳时策略
- `sect`: `1` 或 `2`，用于记录排盘流派选择

## Examples

生成结构化命盘：

```json
{
  "name": "静仪",
  "gender": "female",
  "birthDateTime": "1995-03-12T14:20:00+08:00",
  "calendar": "solar",
  "timezone": "Asia/Shanghai",
  "trueSolarTime": "none",
  "sect": 1
}
```

生成 AI 提示词：

```json
{
  "name": "静仪",
  "gender": "female",
  "birthDateTime": "1995-03-12T14:20:00+08:00",
  "calendar": "solar",
  "timezone": "Asia/Shanghai",
  "trueSolarTime": "none",
  "sect": 1,
  "promptMode": "general",
  "format": "markdown"
}
```

提示词模式：

- `general`: 综合
- `relationship`: 姻缘
- `career`: 事业
- `wealth`: 财运
- `health`: 身心
- `yearly`: 流年
- `xp`: 成人亲密偏好脑暴，必须遵守成年人、自愿、可撤回同意和安全边界

## Privacy

四柱星盘 AI 的网页端不需要登录。出生信息、命盘结果和历史记录默认只保存在当前浏览器中。复制提示词或图片后，用户可以自行粘贴到第三方 AI 产品；第三方产品的数据处理规则由对应产品决定。

## Notes For Agents

- 不要把命理输出写成医学、法律、投资或安全承诺。
- 不要编造缺失字段；遇到真太阳时、历法、流派或经度不完整时，先说明不确定性。
- XP 模式只用于成年人自愿语境下的亲密偏好脑暴，不输出未成年人、非自愿、胁迫、违法伤害或现实危险行为指导。
