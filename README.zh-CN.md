<!-- jackmeds-brand:start -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/hero-dark.svg">
  <img src="assets/brand/hero-light.svg" alt="MingXu / 命序 — Compute the chart. Keep the interpretation yours." width="1200">
</picture>
<!-- jackmeds-brand:end -->

# 命序 MingXu

**把历法和排盘交给可复现代码，把解释交给你选择的 AI。**

命序是本地优先的八字、紫微斗数、大六壬、运限与真太阳时工作台。用户与支持 WebMCP 的 Agent 可以查看并操作同一张网页命盘，每一步都有可见状态与计算依据。

[打开工作台](https://mingxu.jackmeds.top/) · [English](README.md) · [Agent 接入](https://mingxu.jackmeds.top/agents.zh-CN.md)

![命序真实工作台，使用站点内置的虚构示例命盘](assets/brand/product-proof.png)

[截图来源与复现](docs/brand-proof.md)。截图展示确定性计算结果，不模拟 AI 对话。

## 先试一张命盘

1. 打开工作台，载入内置示例，或填写出生日期、时间与 IANA 时区。
2. 查看八字、紫微、运限和计算审计；示例使用明确的演示输入。
3. 导出 Markdown、纯文本或 JSON，交给你选择的 AI；支持 WebMCP 的 Agent 也能协助切换视图、比较日期。

页面展示计算事实、警告和跨引擎差异。

## 核心能力

- 八字四柱、十神、藏干、纳音、空亡、五行、大运及年月运限。
- 紫微十二宫、星曜、四化与动态运限；支持人和 Agent 共同查看。
- 正时、报数、指定占时三种大六壬入口，输出天地盘、天将、四课与三传。
- 比较两至五个日期，保留可见操作记录与撤销。
- 区分标准时间、地方平太阳时和真太阳时，处理 IANA 时区与夏令时，展示计算交叉验证。

## 本地运行

需要 Node.js 24 与 npm。

```bash
git clone https://github.com/JackMeds/mingxu.git
cd mingxu
npm ci
npm run dev:web
```

接入本地 stdio MCP 客户端前，执行 `npm run build:mcp`；启动命令为 `npm run start:mcp`。主工具名使用 `mingxu.*`，保留 `sizhu.*`、`astrocopy.*` 别名，以及 `mingxu-mcp` / `sizhu-mcp` 两个命令。远程部署说明见 [HTTP MCP 文档](docs/remote-mcp.md)。

## 隐私与使用边界

网页排盘在浏览器本地运行，表单草稿和最多 12 条历史留在当前浏览器。系统不会自动向第三方 AI 发送出生资料；主动调用 Agent 工具、复制导出或分享文件后，数据按所选服务的规则处理。

[本地备份与导入](https://mingxu.jackmeds.top/backup/) 通过 JSON 文件迁移历史、草稿、主题和语言，不上传文件。新站已有内容优先；超出历史上限的记录仍保留在原备份中，请妥善保管。[旧站恢复页](https://astrocopy.jackmeds.top/migration/) 只导出、不清空数据。跨域名迁移需要原浏览器导出后再导入。

命序用于传统文化研究、工具开发与自我观察，不宣称科学预测效力，也不替代医学、法律、投资等专业判断。排盘结果继续保留原有计算引擎版本和来源标识。

## 开发与文档

```bash
npm test
npm run test:migration
npm run typecheck
npm run build
```

[完整技术说明](docs/technical-overview.md) · [使用指南](https://mingxu.jackmeds.top/guide/) · [品牌迁移与回退](docs/mingxu-migration.md) · [反馈问题](https://github.com/JackMeds/mingxu/issues)

内部包主名迁至 `@mingxu/*`，旧 `@sizhu/*` 工作区作为兼容入口至少保留至下一个稳定版本。本地址切换交付不发布 npm 包；新链接需在按[迁移清单](docs/mingxu-migration.md)完成仓库改名、DNS 与站点部署后才会生效。

许可证：[GPL-3.0](LICENSE)。
