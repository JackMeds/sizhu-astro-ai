# 四柱星盘 AI

四柱星盘 AI 是一个本地优先的八字、紫微斗数排盘与 AI 提示词生成工作台。它把传统命盘资料整理成结构化数据，并生成适合复制到 ChatGPT、Claude、DeepSeek、豆包、通义、Kimi 等 AI 工具中的 Markdown 或纯文本提示词。

开源仓库：`https://github.com/JackMeds/sizhu-astro-ai`

## 功能

- 八字四柱、十神、藏干、纳音、空亡、五行分布与大运流年摘要
- 紫微斗数十二宫资料整理
- 综合、姻缘、事业、财运、身心、流年、XP 等 AI 提示词模式
- Markdown / 纯文本复制与下载
- 提示词图片复制，浏览器不支持时自动下载 SVG
- 浏览器本地历史记录，无需登录
- 静态网站部署，适合 GitHub Pages、Cloudflare Pages、Vercel、Netlify 等平台
- 本地 MCP Server 与实验性 WebMCP 页面工具

## 隐私模型

网页端排盘、提示词生成和历史记录都在当前浏览器本地完成。历史记录保存在 localStorage 中，不会自动同步到其他设备。用户把提示词复制到第三方 AI 产品后，数据处理规则以对应产品为准。

## 项目结构

```text
apps/web      React + Vite 静态网站
apps/mcp      本地 MCP Server
packages/core 八字、紫微、资料结构化核心逻辑
packages/prompt AI 提示词与资料导出逻辑
packages/render 图像 / SVG 渲染辅助
```

## 本地运行

```bash
npm install
npm run dev:web
```

默认开发服务会监听本机网络地址，当前项目常用预览端口为 `30011`。

## 构建与测试

```bash
npm run typecheck
npm run build:web
npm run test
```

完整构建：

```bash
npm run build
```

## AI / Agent 接入

静态网站会发布 `/agents.md`，用于说明 AI/Agent 如何理解本项目能力。

当前接入形态：

- 传统 MCP Server：运行 `apps/mcp`，供支持 MCP 的本地客户端连接。
- WebMCP 页面工具：在支持 `document.modelContext` 或 `navigator.modelContext` 的浏览器、扩展或桥接环境中注册 `sizhu.*` 工具。
- HTTP API：暂未启用，后续可以作为单独服务部署。

WebMCP 工具：

- `sizhu.about`
- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_current_chart`

## 使用的开源项目

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion](https://motion.dev/)
- [Lucide](https://lucide.dev/)
- [lunar-javascript](https://github.com/6tail/lunar-javascript)
- [iztro](https://iztro.com/)
- [react-iztro](https://github.com/SylarLong/react-iztro)

## 说明

命理分析内容只适合作为文化、娱乐和自我观察参考，不应替代医学、法律、投资、心理治疗或其他专业意见。
