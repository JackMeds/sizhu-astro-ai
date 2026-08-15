# 四柱星盘 AI

**四柱星盘 AI** 是一个本地优先、可复现的 **八字排盘 / 紫微斗数 / 真太阳时 / 大六壬 / AI 结构化命盘** 工作台。项目把“排盘计算”和“AI 解读”分开：命盘与术数结构由固定代码生成，本站不直接给出命理解读；用户可把结果复制到自己喜欢的 AI（如 ChatGPT、Claude、DeepSeek、Kimi 等）继续分析。

- 在线使用：<https://jackmeds.github.io/sizhu-astro-ai/>
- 指南目录：<https://jackmeds.github.io/sizhu-astro-ai/guide/>
- 搜索索引：<https://jackmeds.github.io/sizhu-astro-ai/sitemap.xml>
- 仓库：<https://github.com/JackMeds/sizhu-astro-ai>

## 核心能力

- 八字四柱、十神、藏干、纳音、空亡与五行结构概览
- 完整大运、流年、流月浏览
- 程序化识别天干五合、六合、冲、害、破、刑、自刑、伏吟、三合/三会候选等关系事实
- 五合只标记“合化候选”，不在事实层自动宣称合化成立
- 紫微斗数命宫/身宫、命主身主、五行局、十二宫、星曜亮度/四化与大限结构化数据
- 目标日期联动：同屏查看八字大运/流年关系事实与紫微大限、小限、流年、流月、流日、流时
- **完整大六壬**：正时 / 报数 / 指定占时 → 月将、天地盘、天将、四课、九宗门三传、旬空、遁干、六亲、课体与来源受控神煞
- 大六壬双 TypeScript 引擎重叠校验 + 固定 Python oracle 回归
- 三种时间口径：标准时、地方平太阳时、视太阳时（真太阳时）
- 显式记录经度修正、均时差、是否跨时辰 / 跨日期
- 八字、紫微与六壬历法桥共享同一套显式时间模型
- AI-ready JSON、Markdown / 纯文本提示词导出
- 浏览器本地历史记录，无需登录
- 本地 MCP Server 与实验性 WebMCP 页面工具
- GitHub Actions Golden Fixture + 固定 `kinliuren` Python oracle 回归测试
- 首页预留可替换的赞助 / 广告 slot；当前不加载第三方广告脚本

## 产品边界

本站负责：

```text
输入资料 / 起课输入
  ↓
确定性时间与历法计算
  ↓
八字 / 紫微 / 六壬结构化结果
  ↓
关系事实与来源受控的传统规则证据
  ↓
复制 JSON / 提示词
  ↓
交给用户喜欢的 AI 分析
```

本站**不在网页内提供命理解读或六壬解课**。这样可以把“排盘事实”与“模型解释”解耦，也不会把用户锁定在某一家 AI 服务。

## 传统规则证据层

规则层保存来源、章节、适用条件与不适用条件。只有条件满足的规则才进入 AI evidence。例如：

- `八字提要 · 丑月壬日丁未时` 可在满足对应月支 / 日干 / 时柱时命中；
- `穷通宝鉴 · 正月壬水` 会在丑月命例上被条件门禁拦截，而不是仅因为文本中出现“壬水”就进入分析。

## 时间模型

`packages/core` 保存：

- 标准时
- 地方平太阳时：按出生地经度与时区标准经线修正
- 视太阳时（真太阳时）：地方平太阳时 + 均时差
- 有效排盘口径
- 修正分钟数
- 是否跨时辰 / 是否跨日期

八字和紫微统一使用这套有效时间；大六壬的历法输入桥也复用同一套时间口径。

## 结构事实与运限 API

主要入口：

```ts
createAstroProfile(input)
createTransitSnapshot(input, "2027-06-15")
createTransitBaziFacts(pillars, transit)
createZiweiHoroscope(input, "2027-06-15")
```

`createTransitSnapshot` 会把目标日期的八字大运/流年关系事实和紫微动态范围放进同一个稳定 JSON，方便网页、MCP 与 AI 使用同一份数据。

## 完整大六壬

大六壬被建模成独立 `DivinationSession`，而不是出生命盘的一部分。项目明确区分两层：

1. **起课入口**：怎么得到最终占时；
2. **排课算法**：在最终占时上统一计算天地盘、四课和三传。

当前支持三种入口：

```text
正时起课    使用所选时间口径的实际时辰
报数起课    1=子 … 12=亥，超过 12 循环取支（例如 26 → 丑）
指定占时    直接选择子至亥作为最终占时支
```

九宗门属于**取三传算法**，不是九套彼此独立的起课入口。完整输出由 `createCompleteLiurenChart(...)` 统一返回：

- 月将、天地盘、十二天将、四课
- 三传与取传法 / 传局
- 旬空
- 三传遁干、六亲
- 课体 / 格局标签
- 来源受控的神煞 evidence
- 双引擎重叠字段校验状态
- 引擎版本 manifest 与 warning

核心接口：

```ts
createCompleteLiurenChart({
  dateTime: "2026-08-15T09:30:00+08:00",
  timezone: "Asia/Shanghai",
  castingMethod: "time" // 或 number / branch
})
```

### 六壬验证架构

- `sizhu-liuren-ts@0.2.0`：项目自己的可审计结构层，负责历法桥、月将、天地盘、天将与四课，并继续扩展；
- `mingyu-core@0.1.23`：MIT 发布版，作为完整 TypeScript 六壬引擎与第二交叉验证器；
- `kentang2017/kinliuren` 固定 commit `3ba45a9540f08269b56d81508a061c7d46938785`：Python CI oracle。

重叠字段（干支、月将、天地盘、四课、天将）会程序化比对；出现差异时不会静默忽略，而会进入 `crossCheck.differences` 与 warnings。

## 搜索与学习指南

站点提供独立可索引页面：

- [指南目录](https://jackmeds.github.io/sizhu-astro-ai/guide/)
- [八字排盘怎么看](https://jackmeds.github.io/sizhu-astro-ai/guide/bazi.html)
- [紫微斗数排盘怎么看](https://jackmeds.github.io/sizhu-astro-ai/guide/ziwei.html)
- [真太阳时怎么算](https://jackmeds.github.io/sizhu-astro-ai/guide/solar-time.html)
- [大运流年怎么看](https://jackmeds.github.io/sizhu-astro-ai/guide/dayun.html)
- [大六壬起课与九宗门](https://jackmeds.github.io/sizhu-astro-ai/guide/liuren.html)

首页和指南页都设置 canonical、描述性标题与摘要，并通过 `sitemap.xml` 和 `robots.txt` 暴露给搜索引擎。

## 隐私与赞助位

网页端排盘、起课、提示词生成和历史记录都在当前浏览器本地完成。历史记录保存在 `localStorage`，不会自动同步到其他设备。只有用户主动把导出内容发送到第三方 AI 后，数据才进入对应服务的处理范围。

首页提供一个 `data-sponsor-slot="primary"` 的赞助 / 广告预留组件。当前只展示项目主题图案和 GitHub Star 入口，不加载第三方追踪或广告脚本。未来接入真实赞助或广告网络时，可替换该 slot，而不改动命盘输入与计算流程。

## 项目结构

```text
apps/web      React + Vite 静态网站
apps/mcp      本地 MCP Server
packages/core 八字、紫微、六壬、时间、关系事实与运限结构化核心
packages/prompt AI 提示词与资料导出逻辑
packages/render 图像 / SVG 渲染辅助
tools/liuren-reference 固定 Python 六壬 oracle
```

## 本地运行

```bash
npm install
npm run dev:web
```

## 构建与测试

```bash
npm run test
npm run typecheck
npm run build:web
```

核心测试包含固定命例、子时 sect 差异、太阳时跨时辰、立春边界、八字关系事实、紫微标准化字段、目标日期运限 snapshot，以及六壬天地盘 / 天将 / 四课 oracle fixture、完整三传、旬空、神煞、报数与指定占时回归测试。当前 `lunar-javascript` 固定为 `1.7.7`，`mingyu-core` 固定为 `0.1.23`。

## AI / Agent 接入

静态网站发布 `/agents.md`，用于说明 AI/Agent 如何理解项目能力。

当前接入形态：

- MCP Server：运行 `apps/mcp`，供支持 MCP 的本地客户端连接
- WebMCP：在支持 `document.modelContext` / `navigator.modelContext` 的环境注册 `sizhu.*` 工具
- HTTP / Remote MCP：规划中

主要 Agent 工具：

- `sizhu.create_profile`
- `sizhu.create_ai_prompt`
- `sizhu.get_transit_snapshot`
- `sizhu.create_liuren_chart`（完整大六壬）
- `sizhu.create_liuren_base_chart`（兼容旧调用）
- `sizhu.get_current_chart`

## 主要开源依赖

- [lunar-javascript](https://github.com/6tail/lunar-javascript)
- [iztro](https://github.com/SylarLong/iztro)
- [lunisolar](https://github.com/waterbeside/lunisolar)
- [mingyu-core](https://github.com/Brhiza/mingyu)（MIT；完整六壬交叉验证器）
- [kinliuren](https://github.com/kentang2017/kinliuren)（固定 commit 作为六壬参考 oracle）
- [React](https://react.dev/)
- [Vite](https://vite.dev/)

## 说明

本项目用于传统文化研究、工具开发与自我观察。术数解释不等同于现代科学结论，也不替代医学、法律、投资或其他专业判断。
