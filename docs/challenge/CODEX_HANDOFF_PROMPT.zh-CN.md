# 给 Codex 的直接执行提示词

你正在处理仓库：

```text
JackMeds/sizhu-astro-ai
```

目标分支：

```text
challenge/webmcp-2026
```

草稿 PR：

```text
#11
```

先阅读以下文件，顺序不可跳过：

```text
docs/challenge/MASTER_EXECUTION_PLAN.zh-CN.md
docs/challenge/IMPLEMENTATION_BACKLOG.zh-CN.md
docs/challenge/PRODUCT_SPEC.md
docs/challenge/QA_CHECKLIST.md
docs/challenge/DEMO_SCRIPT.md
docs/challenge/SUBMISSION.md
```

## 总目标

把 AstroCopy 完成为一个可提交 WebMCP Challenge 的双语共享命盘工作台：

- 排盘由确定性代码完成
- Agent 调用直接改变当前网页
- 用户和 Agent 操作同一状态
- 用户手动改变的状态可被 Agent 读取
- Agent 的页面改动可见、可审计、可撤销
- 英文用户拥有正确的 IANA 时区和 DST 支持
- Demo 不依赖复制 raw JSON 或离开页面

## 本轮任务范围

只做 P0-001 至 P0-003：

### 1. 重新确认最新状态

- checkout `challenge/webmcp-2026`
- pull 最新代码
- 获取 PR #11 最新 HEAD 和 CI
- 读取最新失败日志
- 在 `docs/challenge/STATUS.md` 建立或更新基线

### 2. 修复 WebMCP browser smoke

当前实现按 profile 状态动态注册工具。

空 workspace 应有：

```text
astrocopy.about
astrocopy.create_birth_chart
astrocopy.get_workspace_state
```

创建 profile 后才出现：

```text
astrocopy.inspect_chart
astrocopy.inspect_transit
astrocopy.compare_transits
```

调整 E2E：

1. 初始只等待并断言基础工具。
2. 调用 create。
3. 等待 profile 可见。
4. 等待动态工具出现。
5. 再执行 inspect/compare/state。
6. 记录 screenshot。

### 3. 统一 compare contract

全仓统一：

```json
{
  "targetDates": [
    "2027-06-15",
    "2029-06-15",
    "2032-06-15"
  ]
}
```

不要继续支持 `dates` 作为隐形兼容字段，除非明确记录兼容期限。工具 schema、实现、测试、agents docs、Demo、Product Spec、Submission 和 README 必须一致。

### 4. 实现 inspect focus

最终输入：

```json
{
  "view": "ziwei",
  "focusIds": [
    "ziwei-palace-life",
    "ziwei-palace-body"
  ]
}
```

要求：

- 工具打开 Zi Wei view
- dispatch focus state
- 自绘紫微盘真实高亮目标宫位
- semantic IDs 稳定
- focus action 进入 Activity
- 至少增加组件或浏览器测试
- 工具结果返回 visible changes 和 focused IDs
- 无 profile 时工具不应注册

### 5. 验证

运行：

```bash
npm ci
npm run test
npm run typecheck
npm run build:mcp
npm run build:web
npm run test:webmcp
```

如没有 `test:webmcp` script，创建统一 script，并让 CI 与本地共用同一个入口。

### 6. Commit 要求

最多三个原子 commits，建议：

```text
fix(webmcp): align dynamic registration smoke test
fix(webmcp): standardize transit comparison contract
feat(ziwei): support agent focus on semantic palaces
```

不得：

- 修改 `main`
- merge PR
- force push
- 重写核心历法算法
- 添加新术数门类
- 先做颜色重构
- 跳过失败测试
- 把 P0 留给“后续再说”

### 7. 最终回复格式

```md
## Completed

## Commits

## Tests

## Screenshots/artifacts

## Remaining P0 blockers

## Next recommended task
```

完成 P0-001 至 P0-003 并确认 CI 之后停止，不要自动进入 P1。
