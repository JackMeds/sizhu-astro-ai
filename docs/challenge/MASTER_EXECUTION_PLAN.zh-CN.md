# AstroCopy WebMCP Challenge 总体实施计划
## Codex 执行版 · 2026-08-26

> 本文档是 `JackMeds/sizhu-astro-ai` 的挑战赛总控文档。  
> Codex 应先完整阅读本文，再依次阅读仓库中的：
>
> - `docs/challenge/PRODUCT_SPEC.md`
> - `docs/challenge/QA_CHECKLIST.md`
> - `docs/challenge/DEMO_SCRIPT.md`
> - `docs/challenge/SUBMISSION.md`
>
> 本文负责统一优先级、实施顺序、工程约束和验收标准；上述文件分别负责产品定义、QA、演示和提交材料。

---

## 0. 项目与执行基线

### 0.1 仓库信息

- 仓库：`JackMeds/sizhu-astro-ai`
- 正式分支：`main`
- 挑战赛分支：`challenge/webmcp-2026`
- 草稿 PR：`#11`
- 当前要求：**只能在挑战赛分支工作，不得直接修改或合并 `main`**
- 当前线上正式站：`https://astrocopy.jackmeds.top/`
- 官方挑战页：`https://openai.com/webmcp-challenge/`
- WebMCP 规范：`https://github.com/webmachinelearning/webmcp`
- Chrome React 生命周期参考：`https://github.com/GoogleChromeLabs/use-webmcp-tool`

### 0.2 截止时间

官方页面给出的截止时间存在冲突：

- OpenAI 活动页：2026-09-03 17:00 PT
- Devpost Official Rules：2026-09-03 13:00 Pacific Time，并明确规则文本优先
- 执行时一律采用更早的规则截止：**北京时间 2026-09-04 04:00**

项目内部硬截止建议设为：

- **2026-09-03 22:00 北京时间完成最终提交**
- 之后只允许处理部署、视频上传或 Devpost 页面故障
- 内部硬截止后不得再加入新功能

### 0.3 当前 PR 快照

截至 2026-08-26 当前快照：

- PR 为 Draft
- 可合并状态：mergeable
- 已有约 31 个 commits
- 约 62 个 changed files
- 核心测试、类型检查、MCP 构建、Web 构建、六壬 oracle 已通过
- 浏览器级 `webmcp-smoke` 仍失败

注意：以上是执行计划创建时的快照。Codex 开始工作前必须重新读取最新 PR、最新 CI 和分支 HEAD，不得假设这些数字仍然不变。

---

# 1. 最终产品定义

## 1.1 一句话定位

**AstroCopy 是一个双语、确定性优先的中国传统术数共享工作台：程序负责把盘算准，用户与 AI Agent 在同一个可见页面状态上共同查看、切换、比较和审计。**

英文：

> AstroCopy is a bilingual shared chart workspace where deterministic Chinese-metaphysics computation and AI reasoning meet on the same live page.

## 1.2 本次比赛真正要提交的产品

不是：

> 一个带 WebMCP 接口的八字排盘网站。

而是：

> 一个让人和 Agent 共同操作同一张命盘、同一组目标日期和同一条可撤销操作历史的共享工作区。

## 1.3 核心演示故事

1. 打开英文 AstroCopy。
2. Agent 调用 `astrocopy.create_birth_chart` 建立虚构出生命盘。
3. 页面显示八字和 AstroCopy 自绘紫微十二宫。
4. Agent 调用 `astrocopy.inspect_chart` 打开紫微并聚焦命宫、身宫。
5. Agent 调用 `astrocopy.compare_transits` 比较 2027、2029、2032。
6. 页面生成可见的三日期比较。
7. 用户手动选择或固定 2029。
8. Agent 调用 `astrocopy.get_workspace_state`，读取用户刚才的选择。
9. 页面显示 Agent 活动记录，用户能够撤销之前的 Agent 页面改动。
10. 展示 Audit，证明时区、太阳时和引擎 warning 没有被隐藏。

## 1.4 评审映射

| 评审维度 | AstroCopy 要证明什么 |
|---|---|
| Usefulness | Agent 不再临时手算历法、四柱、运限和紫微结构 |
| Originality | 中国术数确定性计算与共享 WebMCP 工作区结合，辨识度高 |
| Execution | 国际时区、双语、自绘图表、跨引擎校验、可审计 UI |
| Thoughtful WebMCP | 工具真正修改当前页面状态，而不是只返回 JSON |
| Human-agent experience | 人和 Agent 共用状态，变化可见、可修改、可读取、可撤销 |

---

# 2. 范围控制

## 2.1 截止前必须完成

1. CI 全绿，包括浏览器级 WebMCP smoke。
2. 五个主要 WebMCP 工具契约稳定。
3. Agent 调用能够可靠驱动页面。
4. 用户的手动选择可被 Agent 读取。
5. Agent 页面改动可见并可撤销。
6. 英文主流程无明显中文 UI 残留。
7. 全球 IANA 时区和 DST 测试通过。
8. 自绘紫微十二宫可用且在移动端可读。
9. 90 秒英文 Demo 可完整跑通。
10. 英文 URL、隐私页、代码仓库、视频和提交文案全部可访问。

## 2.2 截止前应该完成

1. 拆分过度臃肿的 `App.tsx`。
2. 将开发者接入内容移出普通用户主流程。
3. 清理历史 CSS 覆盖层。
4. 增加无 WebMCP 浏览器 fallback 测试。
5. 完成键盘、对比度、缩放和 reduced-motion 验收。
6. 做一次真实 ChatGPT in-app browser 端到端测试。
7. 为挑战赛分支提供不影响正式站的独立预览部署。

## 2.3 截止前不要做

- 登录、账号和云端同步
- 支付、订阅和广告系统
- 远程 HTTP MCP
- 站内集成某个 LLM
- 六爻、奇门等新门类
- 重写八字或紫微核心算法
- 重新设计所有历史 SEO 长文章
- 为了“显得功能多”重新暴露 XP 模式
- 未经 fixture 验证修改排盘事实

## 2.4 赛后再考虑

- Remote MCP
- 多设备同步
- 可分享只读命盘链接
- 协作批注
- 命盘版本比较
- PWA
- 可安装 npm 工具契约包
- 更多语言
- 模型无关的解释插件层
- 规则来源数据库和可视化审计

---

# 3. 已完成能力与当前缺口

## 3.1 已经完成或基本完成

### 计算层

- 八字四柱、十神、藏干、纳音、空亡
- 大运、流年、流月
- 八字结构关系事实
- 紫微十二宫标准化数据
- 目标日期运限快照
- 完整大六壬
- 标准时、地方平太阳时、视太阳时
- 多引擎交叉校验
- 六壬固定 Python oracle

### 国际时间

- IANA 时区
- DST
- 半小时和 45 分钟时区
- 不存在墙上时间检测
- 重复墙上时间的确定性策略
- 出生命盘时区输入
- 六壬按选择时区使用“现在”

### WebMCP 与状态

- `WorkspaceProvider`
- 统一 reducer
- Agent/User/System actor
- 当前视图
- 目标日期
- 比较日期
- focused IDs
- 活动记录
- 基础 undo
- 生命周期绑定的 WebMCP hook
- 五个主要 AstroCopy 工具

### UI 和国际化

- 中英文 shell
- 英文/中文入口
- 隐私页
- 中英文词典一致性测试
- AstroCopy 自绘紫微十二宫
- Agent Activity Rail
- 英文 Agent 文档
- 英文 README 主段落
- Demo、Submission、QA、Product Spec

## 3.2 当前明确阻塞

### P0-A：WebMCP smoke 的初始注册预期错误

当前工具按页面状态动态注册：

空工作区应只有：

- `astrocopy.about`
- `astrocopy.create_birth_chart`
- `astrocopy.get_workspace_state`

建立 profile 后才应出现：

- `astrocopy.inspect_chart`
- `astrocopy.inspect_transit`
- `astrocopy.compare_transits`

但当前 smoke 在创建 profile 前等待 5 个以上工具，和动态注册策略冲突。

### P0-B：比较工具参数名不一致

实现契约使用：

```json
{
  "targetDates": [
    "2027-06-15",
    "2029-06-15",
    "2032-06-15"
  ]
}
```

当前 smoke 错误地把输入数组放在旧字段 `dates` 下；该写法仅是已知失败原因，不是可复制的工具示例。

必须统一为 `targetDates`。所有文档、示例、测试和 Agent Guide 必须使用同一个字段名。

### P0-C：演示承诺的“聚焦命宫/身宫”没有完整落地（已于 2026-08-26 修复）

当前 Demo 期望：

```text
astrocopy.inspect_chart
view = ziwei
focusIds = ziwei-palace-life, ziwei-palace-body
```

当前挑战分支已经使用稳定语义 `focusIds` dispatch `focus-items`，自绘紫微宫位会真实响应并高亮；E2E 同时核对命宫名称与身宫上游标记。

### P0-D：演示中的“固定 2029”语义不完整（已于 2026-08-26 修复）

基线 state 只有：

- `selectedTransitDate`
- `comparedTransitDates`

当前实现已经加入 `pinnedTransitDate`、`pin-transit`、Select/Pin/Unpin UI 和明确的固定视觉状态。

Agent 创建新比较集时会保留用户 pin；如果 pin 位于比较集内，还会优先保持该日期为当前选择。

### P0-E：Undo 未覆盖所有 Agent UI 变更（已于 2026-08-26 修复）

当前 `set-view`、`select-transit`、`compare-transits`、`focus-items` 和 `pin-transit` 都保存对应字段快照并可撤销。撤销旧活动时，较新的未撤销活动所修改的字段会被保留，避免旧 Agent undo 覆盖用户之后的选择或 pin。

当前可撤销范围明确为：

- 至少 `set-view`
- `select-transit`
- `compare-transits`
- `focus-items`
- `pin-transit`

都可撤销。

创建整个 profile 仍是明确例外，不提供 undo。

### P0-F：`get_workspace_state` 信息不完整（已于 2026-08-26 修复）

产品规范要求返回：

- 当前 workspace/view
- 当前命盘身份
- selected transit
- pinned transit
- comparison dates
- focused IDs
- warnings
- recent activities

当前实现返回精简命盘身份、selected/pinned/comparison/focus 状态、warnings 和最近 6 条 human/Agent activity，不返回完整 raw profile。

### P0-G：PR 描述已经过时

PR body 仍把已经完成的功能列在 “Next commits”，会误导 Reviewer 和 Codex。

完成第一轮稳定后应更新 PR body，准确列出：

- 已完成
- 当前 CI
- 剩余 P0
- 预览地址
- 已知限制
- 文档入口

---

# 4. 优先级总表

## 4.1 P0：不完成就不能提交

| ID | 任务 | 依赖 | 验收 |
|---|---|---|---|
| P0-001 | 修复 WebMCP smoke 的动态注册流程 | 无 | CI smoke 通过 |
| P0-002 | 统一 `targetDates` 契约 | P0-001 | 代码、测试、文档一致 |
| P0-003 | 实现 inspect focus | P0-001 | Agent 可高亮命宫/身宫 |
| P0-004 | 实现或删除 pin 语义 | P0-003 | Demo 与实现一致 |
| P0-005 | 完善 undo | P0-003/004 | Agent UI 变更可撤销 |
| P0-006 | 完善 workspace state 读取 | P0-004/005 | Agent 能读人类最新选择 |
| P0-007 | 统一工具结果与错误 | P0-002 | 无失败伪装成成功 |
| P0-008 | 英文主路径残留扫描 | P0-001 | 关键路径没有硬编码中文控件 |
| P0-009 | 国际时区 E2E | P0-001 | 洛杉矶/纽约/伦敦/印度等通过 |
| P0-010 | 真实 ChatGPT WebMCP 验证 | P0-001～009 | 五工具真实可发现和调用 |
| P0-011 | 挑战赛预览部署 | P0-001～009 | 独立 URL 可访问 |
| P0-012 | 90 秒 Demo 录制 | P0-010/011 | 无剪贴板 JSON 墙，流程稳定 |
| P0-013 | Devpost 提交与最终冻结 | P0-012 | 提交页面完整 |

## 4.2 P1：显著提高 Top 10 竞争力

| ID | 任务 | 价值 |
|---|---|---|
| P1-001 | 拆分 App 和页面信息架构 | 降低首页噪音，提升专业感 |
| P1-002 | 开发者内容独立页面 | 普通用户不被 MCP 安装命令干扰 |
| P1-003 | 清理 CSS 历史层 | 降低视觉割裂和维护风险 |
| P1-004 | 自绘紫微交互强化 | 提升原创性和 Demo 观感 |
| P1-005 | 八字大运流年选择统一到 workspace | 让 Agent 与人工真正共享细粒度状态 |
| P1-006 | 大六壬页面去 Beta 化 | 产品成熟度一致 |
| P1-007 | 无障碍 | 提升执行质量 |
| P1-008 | 性能与 bundle | 提升首屏和录屏稳定性 |
| P1-009 | hreflang/SEO/社交卡片 | 英文提交传播更完整 |
| P1-010 | 错误与空状态设计 | 防止 Demo 和实际评审中断 |

## 4.3 P2：有余力再做

- 导出可分享的运限比较图
- WebMCP Inspector 开发模式
- 一键加载官方 Demo profile
- URL query 同步当前视图和目标日期
- 操作历史导出
- Compare 视图的差异摘要
- 对外提供 tool contract package

---

# 5. 分阶段执行计划

## Phase 0：重新建立可信基线

### 目标

先让 Codex 知道真实状态，而不是继续在旧描述上开发。

### 工作

1. Checkout `challenge/webmcp-2026`。
2. 拉取最新远端。
3. 读取 PR #11、最新 workflow run 和失败 job。
4. 本地执行：

```bash
npm ci
npm run test
npm run typecheck
npm run build:mcp
npm run build:web
```

5. 启动 preview 并运行 WebMCP E2E。
6. 在 `docs/challenge/STATUS.md` 写入：
   - 当前 commit
   - CI 状态
   - 当前已知失败
   - 本轮开始时间
   - 后续每阶段结果

### 验收

- 不改业务代码前先形成真实状态记录。
- 失败能够被稳定复现。
- 不将失败归因于“偶发网络”而跳过。

### 建议 commit

```text
docs(challenge): record current execution baseline
```

---

## Phase 1：修复 CI 与工具契约

### 目标

建立可信、稳定、与页面状态一致的 WebMCP E2E。

### 任务 1：修复动态注册测试

修改 `tools/e2e-webmcp.mjs`：

1. 页面初次打开时只等待 3 个基础工具。
2. 断言基础工具为：
   - `astrocopy.about`
   - `astrocopy.create_birth_chart`
   - `astrocopy.get_workspace_state`
3. 调用 `create_birth_chart`。
4. 等待动态工具注册完成。
5. 再断言：
   - `astrocopy.inspect_chart`
   - `astrocopy.inspect_transit`
   - `astrocopy.compare_transits`

### 任务 2：统一比较工具参数

所有位置统一：

```ts
targetDates
```

检查：

- `WebMcpBridge.tsx`
- `tools/e2e-webmcp.mjs`
- `agents.md`
- `agents.en.md`
- `agents.zh-CN.md`
- `DEMO_SCRIPT.md`
- `PRODUCT_SPEC.md`
- `SUBMISSION.md`
- README
- 任何 schema/example/test

### 任务 3：增加生命周期测试

至少验证：

1. 空工作区只有基础工具。
2. profile 建立后动态工具出现。
3. profile 被清除或工作区卸载时动态工具消失。
4. React Strict Mode 不产生重复工具。
5. locale 切换不会留下旧注册。
6. registration error 返回可见状态。

### 任务 4：错误结果统一

采用以下原则：

- 成功：`{ content: [{ type: "text", text: ... }] }`
- 失败：`{ isError: true, content: [...] }`
- 失败不得只返回 `{ error: true }` 而让 Agent 误判成功
- 所有错误保持简洁、可操作
- 不返回 stack trace
- 不在错误中泄露真实 birth data

### 涉及文件

- `tools/e2e-webmcp.mjs`
- `apps/web/src/components/WebMcpBridge.tsx`
- `apps/web/src/lib/useWebMcpTool.ts`
- `.github/workflows/ci.yml`
- `apps/web/test/*`
- `docs/challenge/*`
- `apps/web/public/agents*`

### 验收命令

```bash
npm run test
npm run typecheck
npm run build:web
npm run test:webmcp
```

如仓库没有统一的 `test:webmcp`，应创建它，避免 CI 和本地使用两套命令。

### 建议 commit

```text
fix(webmcp): align dynamic registration and compare contract
```

---

## Phase 2：完成真正的人机共享状态

### 目标

让产品承诺与 reducer、UI、工具、E2E 完全一致。

### 2.1 扩展 workspace state

目标状态建议：

```ts
interface WorkspaceState {
  profile: AstroProfile | null;
  activeView: WorkspaceView;
  selectedTransitDate: string | null;
  pinnedTransitDate: string | null;
  comparedTransitDates: string[];
  focusedIds: string[];
  activities: WorkspaceActivity[];
}
```

### 2.2 扩展 undo snapshot

```ts
interface WorkspaceUndo {
  activeView?: WorkspaceView;
  selectedTransitDate?: string | null;
  pinnedTransitDate?: string | null;
  comparedTransitDates?: string[];
  focusedIds?: string[];
}
```

### 2.3 增加 actions

```ts
{ type: "pin-transit"; date: string | null; actor; ... }
{ type: "focus-items"; ids: string[]; actor; ... }
{ type: "clear-focus"; actor; ... }
```

### 2.4 完成 inspect focus

工具 schema：

```json
{
  "view": "ziwei",
  "focusIds": ["ziwei-palace-life", "ziwei-palace-body"]
}
```

工具执行：

1. dispatch `set-view`
2. dispatch `focus-items`
3. scroll 到紫微
4. 返回：
   - active view
   - focused IDs
   - visible changes

紫微宫位需提供稳定语义 ID，例如：

- `ziwei-palace-life`
- `ziwei-palace-body`
- `ziwei-palace-career`
- `ziwei-palace-wealth`

不要依赖数组 index 作为 Agent contract。

### 2.5 完成 pin

Compare 卡片上提供：

- Select
- Pin
- Unpin

视觉上明确区分：

- Agent 创建的比较集
- 用户当前选中的日期
- 用户明确 pin 的日期

`get_workspace_state` 必须返回 pinned date。

### 2.6 完成 state read

返回建议：

```json
{
  "workspace": "birth-chart",
  "hasChart": true,
  "chart": {
    "name": "Alex Demo",
    "timezone": "Asia/Shanghai",
    "pillars": ["...", "...", "...", "..."],
    "warningCount": 0
  },
  "activeView": "transit",
  "selectedTransitDate": "2029-06-15",
  "pinnedTransitDate": "2029-06-15",
  "comparedTransitDates": [
    "2027-06-15",
    "2029-06-15",
    "2032-06-15"
  ],
  "focusedIds": [],
  "recentActivities": [
    {
      "actor": "user",
      "type": "pin-transit",
      "detail": "2029-06-15"
    }
  ]
}
```

禁止默认返回完整 raw profile。

### 2.7 E2E

必须覆盖：

1. Agent 创建 profile。
2. Agent 打开紫微并聚焦命/身宫。
3. Agent 比较三日期。
4. 用户点击 2029。
5. 用户 pin 2029。
6. Agent 读取 state。
7. state 中 selected/pinned 均为 2029。
8. 用户 undo Agent 的比较操作。
9. 比较集恢复到之前状态。
10. invalid input 不改变已有 state。

### 涉及文件

- `apps/web/src/lib/workspace.tsx`
- `apps/web/src/components/WebMcpBridge.tsx`
- `apps/web/src/components/TransitInspector.tsx`
- `apps/web/src/components/ZiweiPlate.tsx`
- `apps/web/src/components/AgentActivityRail.tsx`
- `apps/web/src/components/ProfileResults.tsx`
- `apps/web/test/workspace.test.ts`
- `tools/e2e-webmcp.mjs`

### 建议 commits

```text
feat(workspace): add focus and pinned transit state
feat(webmcp): expose reversible shared chart interactions
test(webmcp): verify human selection round trip
```

---

## Phase 3：产品信息架构与前端收敛

### 目标

避免把落地页、表单、六壬、MCP 安装、FAQ、SEO 和历史记录全部堆在一个长页面中。

### 推荐页面

#### `/` 或 `/en/`

只保留：

- 品牌与价值
- Birth workspace 入口
- Da Liu Ren 入口
- Try example
- WebMCP readiness
- 三个 trust badges
- 简短 FAQ
- 隐私与 GitHub

#### `/workspace/birth`

- 左：输入/当前 profile
- 中：图表和 compare
- 右：Agent Activity
- 顶部：Overview/BaZi/Zi Wei/Transit/Audit

#### `/workspace/liuren`

- 独立起课
- 课盘
- 四课
- 三传
- Audit
- AI export

#### `/developers`

- WebMCP
- stdio MCP
- Codex
- schemas
- agents.md

#### `/guide`

- SEO 和学习内容

### App 拆分

建议：

```text
src/app/
  AppShell.tsx
  routes/
    LandingPage.tsx
    BirthWorkspacePage.tsx
    LiurenWorkspacePage.tsx
    DevelopersPage.tsx
```

如果截止时间不允许完整引入 Router，也至少将 `App.tsx` 拆成页面级组件，保持当前 hash navigation。

### 当前需要移动的内容

- `AgentAccessPanel` 从首页移到 Developers
- 长 FAQ 缩短
- 历史记录移入 Birth Workspace
- 六壬从首页长页面抽离
- Sponsor/广告入口挑战赛版保持隐藏
- XP 模式保持隐藏

### 验收

- 首屏 10 秒内能理解产品。
- Demo 不需要滚过无关内容。
- 普通用户不会先看到 PowerShell 安装命令。
- Developer 内容仍可访问。
- 无 WebMCP 用户仍可手动完成核心流程。

### 建议 commits

```text
refactor(web): split landing and chart workspaces
refactor(web): move developer setup out of primary flow
```

---

## Phase 4：视觉原创性与一致性

### 目标

从“多个开源组件和多轮 CSS 覆盖”收敛到一套 AstroCopy 设计系统。

### 4.1 设计方向

**现代历算天文台 + 中文编辑设计**

不是：

- 古风游戏
- 通用紫色 SaaS
- 大面积玻璃拟态
- 金色发光玄学模板

### 4.2 设计 tokens

建议统一：

```css
--paper: #f3f0e7;
--ink: #161b1a;
--surface: #fbfaf6;
--cinnabar: #b64c3e;
--jade: #326f66;
--brass: #a47a3d;
--line: rgba(22, 27, 26, 0.14);
```

深色模式是同一品牌的反相体系，不再使用“Classical/Modern”两个互不相关的产品皮肤概念。

### 4.3 CSS 清理

目标逐步删除：

- `refresh.css`
- `product-v3.css`
- `product-v3-fixes.css`

不要新增 `product-v4-fixes.css`。

建议新组件使用：

- CSS Modules，或
- 单一 scoped stylesheet

### 4.4 紫微十二宫

已经改为自绘，但还需优化：

- 稳定 semantic IDs
- Agent focus 高亮
- keyboard focus
- 200% zoom
- 移动端卡片模式
- 星曜层级控制
- 四化图例
- 命宫/身宫不只靠颜色区分
- 中心信息双语布局
- 录屏模式提高字号

### 4.5 八字盘

优化点：

- 四柱是最强主视觉
- 天干/地支/十神明确层级
- 五行不只靠颜色
- 大运/流年/流月统一受 workspace 控制
- 当前 selected/pinned 年份有明显状态
- Compare 与单日期检查共用组件
- 移除多余 hover 光效
- 提高数据密度但避免挤压

### 4.6 大六壬

- 组件改名，不再叫 `LiurenBetaPanel`
- 独立 workspace
- 天地盘做真正的 12 格/环形呈现
- 四课三传信息层级明确
- Audit 默认收起
- 保留多引擎差异
- 不在主 Demo 中占太多时间

### 验收

- 评委能够看出紫微是 AstroCopy 自己的 UI。
- 375px 和 1440px 都可用。
- 页面不再出现不同版本设计语言互相覆盖。
- light/dark 保持同一品牌。

---

## Phase 5：国际化完整性

### 目标

英文不是“按钮翻译”，而是一个真正可用的国际产品路径。

### 5.1 术语规范

| 中文 | 英文 |
|---|---|
| 八字 | BaZi · Four Pillars |
| 紫微斗数 | Zi Wei Dou Shu |
| 大六壬 | Da Liu Ren |
| 天干 | Heavenly Stems |
| 地支 | Earthly Branches |
| 十神 | Ten Gods |
| 藏干 | Hidden Stems |
| 大运 | 10-Year Luck Cycle |
| 流年 | Annual Transit |
| 流月 | Monthly Transit |
| 真太阳时 | Apparent Solar Time |
| 空亡 | Void Branches |

不要：

- 把命宫映射为西方占星宫
- 把 BaZi 称为 horoscope
- 把传统术数写成现代科学
- 在英文错误提示里输出整段中文引擎 message 而不解释

### 5.2 动态数据翻译策略

必须区分：

#### 保留中文的数据

- 干支字符
- 星曜名称
- 宫名原文
- 课体/神煞原名

#### 需要本地化的 UI

- 按钮
- 标签
- 帮助
- 错误
- Empty states
- Audit 说明
- 导出指令
- Agent activity
- WebMCP tool visible changes

### 5.3 Metadata

- `/en/` 的 `<html lang="en">`
- `/zh/` 的 `<html lang="zh-CN">`
- title/description 动态或独立
- `hreflang=en`
- `hreflang=zh-Hans`
- `x-default`
- 英文 Open Graph
- 英文社交截图

### 5.4 自动化

- 词典 key 一致
- 扫描硬编码 UI 文本
- 英文 E2E
- locale 切换不重算命盘
- locale 切换不丢失 workspace
- locale 切换不重复注册 WebMCP

---

## Phase 6：正确性、安全、隐私和异常状态

### 6.1 时间测试

至少覆盖：

```text
Asia/Shanghai
America/Los_Angeles winter
America/Los_Angeles summer
America/New_York DST gap
America/New_York repeated time
Europe/London DST
Asia/Kolkata
Asia/Kathmandu
```

同时检查：

- explicit offset + timezone 是否冲突
- 冲突时采用什么策略
- 子时附近
- 立春附近
- 太阳时跨时辰
- 太阳时跨日期
- 六壬 Now

### 6.2 WebMCP 输入验证

当前 JSON Schema 是 Agent 的第一层约束，但 execute 内仍要验证：

- 日期格式
- 数组长度
- 去重
- timezone validity
- 经纬度范围
- 名称长度
- question 长度
- unexpected fields
- profile 是否存在

不得只依赖 TypeScript 类型。

### 6.3 工具权限与风险

- `get_workspace_state` 是 read-only
- `inspect_chart` 是低风险可逆 UI mutation
- `create_birth_chart` 会替换当前 workspace，应在结果中明确
- 所有 mutation 写入 activity
- 工具描述不得夸大
- Agent 不能修改四柱结果
- 不允许输入直接作为 `innerHTML`

### 6.4 隐私

确认：

- localStorage 不存 Agent 远程标识
- analytics 不包含 birthDateTime、timezone、question、chart JSON
- clipboard 不自动发送
- 第三方 AI 外链只打开页面
- privacy page 说明 WebMCP tool result 会被当前 Agent 读取
- Demo 使用虚构 profile
- 错误日志不打印完整敏感 profile

### 6.5 异常状态

必须有清晰 UI：

- invalid timezone
- nonexistent DST time
- Zi Wei unavailable
- no transit coverage
- WebMCP not supported
- WebMCP registration denied
- clipboard denied
- localStorage corrupted
- compare date invalid
- engine cross-check difference

---

## Phase 7：无障碍、响应式和性能

### 7.1 无障碍

- 所有主要按钮有 visible focus
- Radix tabs 键盘正常
- 表单错误关联字段
- Toast 使用正确 live region
- 五行不只靠颜色
- 紫微宫位可键盘聚焦
- 活动记录时间对屏幕阅读器友好
- Undo 有明确对象
- 大六壬 scroller 有 label
- reduced-motion
- 200% zoom

### 7.2 响应式矩阵

- 375×812
- 768×1024
- 1440×900
- 1920×1080

每个 viewport 截图保存到：

```text
artifacts/visual/
```

### 7.3 性能

检查：

- 移除 `react-iztro` UI 依赖后是否还能从 package 移除
- lazy-load 大六壬和重型图表
- analytics 延迟
- 降低首屏 motion
- 删除未使用 CSS
- `content-visibility` 用于长指南/结果
- localStorage 数据版本
- 避免把完整 raw profile反复 JSON.stringify
- 生产构建 bundle 报告

### 验收

- 首屏无明显卡顿
- 录屏中工具执行后页面稳定
- 没有长任务阻塞动画
- 移动端无意外横向滚动

---

## Phase 8：部署、演示和提交

### 8.1 预览部署

在合并前提供独立预览：

推荐优先级：

1. Vercel Preview
2. Cloudflare Pages Preview
3. 独立 GitHub Pages preview path

要求：

- 不覆盖当前正式站
- HTTPS
- WebMCP 页面可打开
- English route 可直接访问
- Privacy route 可访问
- Source maps 不泄露 secret
- 自定义域名不是硬要求

### 8.2 真实 WebMCP 验证

必须在：

- ChatGPT in-app browser
- Chrome WebMCP experimental environment

至少各跑一次。

记录：

```text
Browser/version:
Environment:
Commit:
Registered tools:
Create chart:
Inspect chart:
Inspect transit:
Compare:
Read state:
Undo:
Known issue:
```

### 8.3 Demo

使用仓库现有 `DEMO_SCRIPT.md`，但录制前确认：

- focus 真实生效
- pin/select 文案与实现一致
- `targetDates` 契约一致
- 英文没有残留
- 页面变化足够明显
- 活动记录可见
- 不出现长 JSON
- 90 秒内完成
- 无声也能看懂
- 加英文字幕

### 8.4 Submission

提交材料：

- Product name
- One-line pitch
- Problem
- Solution
- WebMCP usage
- Human-agent experience
- Deterministic architecture
- Privacy
- Live app
- Repository
- Demo video
- Screenshots
- Technologies
- Known limitations

### 8.5 冻结

提交后：

1. 记录 commit SHA。
2. 打 tag，例如：
   - `webmcp-challenge-2026-submission`
3. 保存部署 URL。
4. 保存视频 URL。
5. 保存 Devpost URL。
6. 不再修改提交版本。
7. 赛后改动进入新分支。

---

# 6. 文件级改造地图

| 文件/目录 | 建议 |
|---|---|
| `tools/e2e-webmcp.mjs` | 立即修动态注册与 `targetDates` |
| `.github/workflows/ci.yml` | 确保 smoke 可重复运行并上传截图/日志 |
| `WebMcpBridge.tsx` | 拆分工具定义、实现 focus/pin/state activity |
| `useWebMcpTool.ts` | 对照 Chrome hook，保持 Strict Mode 与 error normalization |
| `workspace.tsx` | 增加 pinned、focused undo、state serialization |
| `TransitInspector.tsx` | 单日期、比较、selected、pinned 共用状态 |
| `ZiweiPlate.tsx` | semantic ID、focus、键盘、移动端 |
| `ProfileResults.tsx` | 受控 tabs，不允许组件内部和 workspace 漂移 |
| `BaziPlate.tsx` | 将大运/流年/流月选择逐步提升到 workspace |
| `LiurenBetaPanel.tsx` | 改名、拆页、国际化与视觉收敛 |
| `App.tsx` | 拆成 shell 与页面级组件 |
| `AgentAccessPanel.tsx` | 移到 developers 页面 |
| `AgentActivityRail.tsx` | 明确 actor、action、undo、undone |
| `i18n/*` | 补全动态文案和 metadata |
| `styles/*` | 清理 v2/v3/fixes 覆盖层 |
| `README.md` | 与当前工具和部署一致 |
| `agents*.md` | 与最终 tool contract 一致 |
| `PRODUCT_SPEC.md` | 保持产品承诺不超过实现 |
| `QA_CHECKLIST.md` | 每完成一项更新 checkbox |
| `DEMO_SCRIPT.md` | 录制前冻结 |
| `SUBMISSION.md` | 最终文案与实际 Demo 一致 |
| PR body | 更新为真实完成度 |

---

# 7. WebMCP 最终工具契约

## 7.1 基础工具

### `astrocopy.about`

用途：

- 说明能力
- 隐私
- 当前 workspace
- 当前 locale
- 不做 UI mutation

### `astrocopy.create_birth_chart`

输入：

```json
{
  "name": "Alex Demo",
  "gender": "female",
  "birthDateTime": "1996-06-18T10:30",
  "calendar": "solar",
  "timezone": "Asia/Shanghai",
  "trueSolarTime": "none",
  "sect": 1
}
```

行为：

- 验证
- 计算
- 写入 workspace
- 页面显示
- activity
- 返回简短摘要

## 7.2 Profile 后动态工具

### `astrocopy.inspect_chart`

输入：

```json
{
  "view": "ziwei",
  "focusIds": [
    "ziwei-palace-life",
    "ziwei-palace-body"
  ]
}
```

### `astrocopy.inspect_transit`

输入：

```json
{
  "targetDate": "2029-06-15"
}
```

### `astrocopy.compare_transits`

输入：

```json
{
  "targetDates": [
    "2027-06-15",
    "2029-06-15",
    "2032-06-15"
  ]
}
```

### `astrocopy.get_workspace_state`

输入：

```json
{}
```

返回当前用户真实可见状态。

## 7.3 注册生命周期

空 workspace：

```text
about
create_birth_chart
get_workspace_state
```

profile workspace：

```text
以上 3 个
+ inspect_chart
+ inspect_transit
+ compare_transits
```

不要在空 workspace 注册需要 profile 的工具，然后让 Agent 每次收到 “Create first”。

---

# 8. 测试策略

## 8.1 单元测试

- timezone offset
- DST gap/repeat
- reducer
- undo
- pin
- focus
- date normalization
- tool result normalization
- locale key parity

## 8.2 组件测试

- controlled tabs
- Agent activity
- pin/select
- Zi Wei focus
- invalid timezone
- no WebMCP fallback

## 8.3 浏览器 E2E

### E2E-01 基础动态注册

- 初始 3 工具
- 创建后 6 工具
- schema 名称正确

### E2E-02 主 Demo

- create
- inspect Zi Wei + focus
- compare 3 dates
- human select/pin
- read state
- undo

### E2E-03 错误

- invalid date
- one compare date
- six compare dates
- invalid timezone
- missing birth time
- state remains unchanged

### E2E-04 Locale

- `/en/`
- switch zh
- switch en
- profile unchanged
- tools not duplicated

### E2E-05 No WebMCP

- manual chart works
- export works
- WebMCP panel explains unavailable

## 8.4 真实环境测试

自动 mock 不等于真实 ChatGPT 浏览器测试。必须保留真实验证记录。

---

# 9. Codex 工作规则

## 9.1 分支规则

- 只在 `challenge/webmcp-2026`
- 不直接 push `main`
- 不 merge PR
- 不 force push
- 不改正式站部署设置，除非任务明确要求

## 9.2 Commit 规则

每个 commit 只做一个可验证主题。

推荐：

```text
fix(webmcp): align dynamic tool registration test
feat(workspace): add pinned transit state
feat(ziwei): support agent focus on semantic palaces
test(webmcp): cover human selection round trip
refactor(web): split birth workspace from landing
docs(challenge): update current implementation status
```

禁止：

```text
update things
final fixes
misc
```

## 9.3 核心算法规则

- 不修改历法核心来迁就 UI
- 不修改 fixture 只为了让失败消失
- 核心改动必须解释原因并增加测试
- 第三方引擎差异必须保留 warning
- 不把传统解释写入 deterministic facts

## 9.4 每阶段结束必须执行

```bash
npm run test
npm run typecheck
npm run build:mcp
npm run build:web
npm run test:webmcp
```

若某命令不存在，先在 package scripts 中建立统一入口。

## 9.5 状态报告格式

每阶段写入 `docs/challenge/STATUS.md`：

```md
## Phase X

Commit:
Completed:
Files changed:
Tests:
Screenshots:
Known limitations:
Next phase:
```

## 9.6 阻塞处理

- 能从代码、测试、文档推断的问题，直接做最佳工程判断
- 只有产品方向有多个高代价分支时才暂停
- 不因长期遗留问题而停止整个工作
- 无法完成的 P1 可以开 issue，但 P0 不能默默跳过
- 任何 overclaim 必须改文案或补实现

---

# 10. Definition of Done

只有满足以下条件，PR 才能从 Draft 变为 Ready：

## 构建

- [ ] npm ci
- [ ] tests
- [ ] typecheck
- [ ] MCP build
- [ ] Web build
- [ ] 六壬 oracle
- [ ] WebMCP browser smoke

## WebMCP

- [ ] 动态注册正确
- [ ] 五个主要工具可调用
- [ ] create 改变页面
- [ ] inspect 改变页面
- [ ] transit 改变页面
- [ ] compare 改变页面
- [ ] state 读取用户选择
- [ ] focus 可见
- [ ] pin/select 一致
- [ ] undo 可用
- [ ] error 不污染 state

## 国际化

- [ ] 英文主路径无明显中文控件
- [ ] 中文路径正常
- [ ] locale 切换不丢 state
- [ ] metadata 正确
- [ ] 英文 export 自然
- [ ] 术语一致

## 时间

- [ ] 中国
- [ ] 美国冬/夏令时
- [ ] 英国
- [ ] 半小时
- [ ] 45 分钟
- [ ] DST gap
- [ ] DST repeat
- [ ] 太阳时跨界
- [ ] 六壬 Now

## UI

- [ ] 自绘紫微
- [ ] mobile/tablet/desktop
- [ ] keyboard
- [ ] contrast
- [ ] reduced motion
- [ ] 200% zoom
- [ ] no unintended overflow

## 隐私

- [ ] 虚构数据
- [ ] 无 secret
- [ ] analytics 无敏感参数
- [ ] Agent data disclosure
- [ ] 外链不自动发送

## 提交

- [ ] Live app
- [ ] Repo
- [ ] Privacy
- [ ] English route
- [ ] Demo
- [ ] Screenshots
- [ ] Devpost copy
- [ ] Submission URL
- [ ] Final tag

---

# 11. 赛后产品路线

## 11.1 第一阶段：从比赛作品到可靠产品

- 修复赛中延期 P1
- 拆分 CSS
- 独立 developers 页面
- 完善移动端
- 增加 telemetry，但不收集出生资料
- 建立版本化 tool contract

## 11.2 第二阶段：可分享和可持续使用

- 只读分享链接
- 本地 profile 管理
- 比较结果导出
- PWA
- Markdown report
- 可导入/导出 workspace state

## 11.3 第三阶段：开放生态

- Remote MCP
- `@astrocopy/tool-contracts`
- Agent adapters
- 规则证据插件
- 多语言
- 社区贡献的传统规则与来源审计

---

# 12. 最终执行顺序

Codex 必须按此顺序：

```text
1. 重新读取最新分支和 CI
2. 修 WebMCP smoke
3. 统一 targetDates
4. 实现 focus
5. 决定并实现 pin
6. 完善 undo
7. 完善 get_workspace_state
8. 跑主 Demo E2E
9. 清英文残留
10. 跑国际时间矩阵
11. 做真实 ChatGPT WebMCP 测试
12. 建 preview
13. 做响应式/无障碍/性能
14. 更新全部文档和 PR body
15. 录 Demo
16. 提交
17. 冻结 tag
```

不要在第 2 步失败时先去重做首页颜色；不要在主 Demo 未跑通时加入新术数功能。

---

# 13. 本轮首个 Codex 任务

Codex 收到本文后，第一轮只处理：

```text
P0-001 至 P0-003
```

即：

1. 修动态注册 smoke。
2. 统一 `targetDates`。
3. 让 `inspect_chart` 的 `focusIds` 真正高亮自绘紫微命宫/身宫。
4. 更新相应测试和文档。
5. 跑完整 CI。
6. 提交三个以内的原子 commits。
7. 在 `STATUS.md` 汇报。
8. 不继续做 P1，除非 P0 全绿。

这样可以先建立一个可信的下一阶段起点。
