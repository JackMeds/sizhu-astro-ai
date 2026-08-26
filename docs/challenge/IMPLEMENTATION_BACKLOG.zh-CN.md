# AstroCopy Challenge Implementation Backlog
## Codex 任务板 · 中文版

状态说明：

- `TODO`：未开始
- `DOING`：当前执行
- `BLOCKED`：有明确阻塞
- `DONE`：实现、测试、文档均完成
- `DEFER`：明确推迟到赛后

> Codex 应在每次提交后更新本文件状态，不得只在聊天中声明完成。

| ID | 优先级 | 状态 | 任务 | 主要文件 | 验收 |
|---|---:|---|---|---|---|
| P0-001 | P0 | DONE | 修复 smoke 初始工具数量假设 | `tools/e2e-webmcp.mjs` | 空页 3 工具，profile 后动态工具出现 |
| P0-002 | P0 | DONE | 统一 compare 参数为 `targetDates` | Bridge、测试、docs、agents | 全仓无错误 `dates` 示例 |
| P0-003 | P0 | DONE | 实现 `inspect_chart.focusIds` | Bridge、workspace、Ziwei | 命宫/身宫真实高亮 |
| P0-004 | P0 | DONE | 实现 pinned transit 或删除 pin 文案 | workspace、Transit、docs | Demo 与实现一致 |
| P0-005 | P0 | DONE | 完善 focus/pin/compare undo | workspace、Activity | UI 状态正确恢复 |
| P0-006 | P0 | DONE | state 返回 pinned 和 recent activities | Bridge | Agent 读到人类最新选择 |
| P0-007 | P0 | DONE | 统一工具 error result | hook、Bridge、tests | 所有失败 `isError: true` |
| P0-008 | P0 | DONE | 主 Demo WebMCP E2E | E2E | create→focus→compare→human→read→undo |
| P0-009 | P0 | DONE | 英文 UI 残留扫描 | i18n、components | 关键路径无硬编码中文控件 |
| P0-010 | P0 | DONE | 国际时间 E2E | core tests、E2E | IANA/DST/half/quarter 全通过 |
| P0-011 | P0 | TODO | 真实 ChatGPT 浏览器测试 | STATUS、QA | 有完整验证记录 |
| P0-012 | P0 | TODO | 独立 preview 部署 | deployment | HTTPS、English、Privacy 可访问 |
| P0-013 | P0 | TODO | 录制 90 秒 Demo | Demo doc | 页面变化清晰、无真实数据 |
| P0-014 | P0 | TODO | Devpost 最终提交 | Submission | live/repo/video/description 完整 |
| P1-001 | P1 | TODO | 拆分 `App.tsx` | app/routes | 页面级组件清晰 |
| P1-002 | P1 | TODO | Developers 独立页面 | AgentAccess | 首页不再显示安装命令 |
| P1-003 | P1 | TODO | CSS 历史层清理 | styles | 不新增 fixes 覆盖层 |
| P1-004 | P1 | TODO | 紫微 semantic/keyboard/mobile | Ziwei | focus、200% zoom、mobile |
| P1-005 | P1 | TODO | 八字周期选择提升到 workspace | Bazi/workspace | 人与 Agent 共用细粒度选择 |
| P1-006 | P1 | TODO | 大六壬去 Beta 化 | Liuren | 命名与 UI 成熟 |
| P1-007 | P1 | TODO | Accessibility pass | components/styles | focus、ARIA、contrast、motion |
| P1-008 | P1 | TODO | Performance pass | build/styles | bundle 和首屏稳定 |
| P1-009 | P1 | TODO | hreflang/OG/SEO | public/meta | 英文分享完整 |
| P1-010 | P1 | TODO | 空状态/失败状态统一 | components | 失败不白屏 |
| P2-001 | P2 | DEFER | 运限比较导出图 | render | 赛后 |
| P2-002 | P2 | DEFER | URL state | workspace/router | 赛后或有余力 |
| P2-003 | P2 | DEFER | Remote MCP | new service | 赛后 |
| P2-004 | P2 | DEFER | 可分享只读命盘 | backend | 赛后 |
| P2-005 | P2 | DEFER | PWA | web | 赛后 |

## 当前明确失败

```text
CI workflow: Validate core, web and WebMCP
validate: success
liuren-reference: success
webmcp-smoke: failure
```

最可能的两个直接原因：

1. smoke 在创建 profile 前等待 >= 5 个工具，但当前实现会动态注册，空页实际应只有 3 个基础工具。
2. smoke 调用 compare 时使用 `dates`，当前工具 schema 使用 `targetDates`。

Codex 必须通过真实日志确认，不得只根据本文猜测；但这两个不一致应首先修复。

## 每个 DONE 的要求

任务只有同时满足以下条件才能标记 DONE：

- 代码实现
- 单元/组件/E2E 测试
- CI 通过
- 文档同步
- 无新增 P0 regression
- STATUS.md 有记录
