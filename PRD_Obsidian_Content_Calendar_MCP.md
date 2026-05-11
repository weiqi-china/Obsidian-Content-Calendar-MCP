---
type: prd
project: obsidian-content-calendar-mcp
status: draft
date created: 2026-05-11 10:13
last_updated: 2026-05-11 10:13
tags:
  - MCP
  - Obsidian
  - 内容日历
  - SEO
  - PRD
---

# PRD: Obsidian Content Calendar MCP Server

> **版本**：v1.0-draft
> **制表人**：艾玛（助理）
> **目标实现者**：Codex CLI
> **项目定位**：MCP Distribution Flywheel 的「极窄入口」产品

---

## 一、项目背景与战略定位

### 1.1 背景

一人公司/独立创作者的内容生产流程中，一个核心痛点是：**内容笔记散落在 Obsidian 里，每天要发什么、发了没有、哪个平台的、什么状态——全靠人工翻笔记维护**。

现有 AI 工具（Claude Code、Cursor、ChatGPT、Cline）通过 MCP 可以读取本地文件，但缺乏一个**结构化内容日历层**来回答：
- 「今天该发哪几条内容？」
- 「这个笔记是什么平台的？」
- 「哪些内容还没发？」
- 「下周有什么 ready 了的？」

### 1.2 战略定位

**不是做「大而全的电商MCP」，而是做一个极窄、精确、可配置的 Obsidian 内容日历 MCP Server。**

- ✅ **对内有即战力**：艾玛自己内容工厂每天要用
- ✅ **对外有SEO价值**：搜索「Obsidian content calendar MCP」「Claude Desktop content workflow」等关键词的人，是精准的 AI 创作者/一人公司用户
- ✅ **技术信用入口**：提交到 MCP Registry / Glama / PulseMCP / Smithery 等目录，建立技术可信度 + 反向链接
- ✅ **低成本验证**：不依赖外部API，纯本地文件操作，MVP 可 1-2 天内出

### 1.3 目标用户画像

| 用户类型 | 特征 | 使用场景 |
|---------|------|---------|
| **一人公司/独立创作者**（主用户） | 用 Obsidian 管内容，用 AI 工具生产/分发 | 「我的内容笔记在 Obsidian 里，让 AI 告诉我今天该发什么」 |
| **内容团队运营** | 小团队（2-5人），用 Obsidian 协作内容排期 | 「批量看看各平台待发布内容的进度」 |
| **AI 工具玩家** | 常试 Cursor/Cline/Claude Code 的开发者 | 「给我的 MCP 工具箱里加一个能管内容日历的」 |

---

## 二、产品需求

### 2.1 核心功能

MCP Server 提供以下 **tools**（MCP 工具），供 AI 客户端调用：

| 工具名 | 功能 | 输出 |
|--------|------|------|
| `get_today_schedule` | 获取今天应该发布的所有内容 | 按时间/平台排序的发布清单 |
| `get_pending_content` | 获取所有未发布/待审核的内容 | 按状态分组的概览 |
| `get_content_by_status` | 按状态过滤（已发布/待发布/草稿） | 过滤后的内容列表 |
| `get_next_up` | 获取接下来的 N 条待发布内容 | 按日期排序的 pipeline |
| `get_calendar_summary` | 获取指定时间范围的内容分布总览 | 按周/月聚合的日历热力图 |

### 2.2 输出格式

所有 tools 默认输出 **结构化 JSON**，同时支持可选的 **Markdown 格式化输出**（通过参数控制）。

**JSON 输出示例：**

```json
{
  "date": "2026-05-12",
  "items": [
    {
      "filename": "20260512_小红书_贝妙乐活社_地球视界_颜值种草.md",
      "platform": "小红书",
      "account": "贝妙乐活社",
      "product": "地球·视界",
      "direction": "颜值种草",
      "title": "书房里的博物馆🌍 这台会自转的复古地球仪太有质感了",
      "publish_date": "2026-05-12",
      "status": "已发布",
      "batch": "2026-05_Batch_01",
      "path": "/vault/20_Projects/Content_Production/2026-05_Batch_01/01_作品区/20260512_小红书_贝妙乐活社_地球视界_颜值种草.md"
    }
  ],
  "summary": {
    "total": 4,
    "by_platform": { "抖音": 2, "小红书": 2 },
    "by_account": { "贝妙模型专营店": 1, "爱拼的未未": 2, "贝妙乐活社": 1 }
  }
}
```

**Markdown 输出示例：**

```markdown
# 📅 今日发布清单（2026-05-12）

## 抖音
- **[贝妙模型专营店]** 会自转的地球仪！185件榫卯拼装，还带放大镜和夜灯 → 已发布 ✅
- **[爱拼的未未]** 拼4小时会自转的地球仪，打蜡翻车差点废了 → 已发布 ✅

## 小红书
- **[贝妙乐活社]** 书房里的博物馆🌍 这台会自转的复古地球仪太有质感了 → 已发布 ✅
- **[爱拼的未未]** 送男友一个会自转的地球仪，他拼完看了半小时地图 → 已发布 ✅
```

### 2.3 配置系统（可配置解析逻辑）

核心设计目标：**用户可以定义自己的笔记命名规则和 frontmatter 字段映射，不局限于本项目预设的格式。**

配置文件 `obsidian-content-calendar.config.yaml`（放在 vault 根目录或用户指定路径）：

```yaml
# 仓库根目录（必填）
vault_path: "/path/to/obsidian/vault"

# 内容扫描路径（可以是多个 glob）
content_paths:
  - "20_Projects/Content_Production/**/01_作品区/*.md"

# 文件名解析规则（支持命名捕获组）
# 用正则从文件名中提取字段
filename_pattern: "^(?<date>\\d{8})_(?<platform>[^_]+)_(?<account>[^_]+)_(?<product>[^_]+)_(?<direction>.+)\\.md$"

# 文件名中日期字段的格式（用于 parse）
date_format: "yyyyMMdd"

# Frontmatter 字段映射
# key: 标准字段名, value: frontmatter 中的 key 名（支持嵌套如 "meta.status"）
frontmatter_mapping:
  title: "title"                    # Markdown 第一行标题（不用 frontmatter）
  status: "status"                  # 内容状态
  publish_date: "publish_date"       # 发布日期（覆盖文件名中的日期）
  platform: "platform"              # 平台（覆盖文件名解析结果）
  account: "account"                # 账号（覆盖文件名解析结果）
  product: "product"                # 产品（覆盖文件名解析结果）
  batch: "batch"                    # 所属批次
  tags: "tags"                      # 标签

# 状态值映射（将 frontmatter 中的原始值转成标准状态）
# 用户可能用中文/英文/自定义状态
status_mapping:
  published:
    - "已发布"
    - "published"
    - "done"
  pending:
    - "待发布"
    - "pending"
    - "scheduled"
  draft:
    - "草稿"
    - "draft"
    - "wip"
    - "规划中"

# 日期字段格式
date_formats:
  publish_date: "yyyy-MM-dd"

# 输出选项
output:
  default_format: "json"          # json | markdown
  date_format: "yyyy-MM-dd"
  timezone: "Asia/Shanghai"

# 过滤器（可选，限制只关心这些平台/账号）
# 不设置则扫描到所有都显示
filters:
  platforms:
    - "抖音"
    - "小红书"
    - "视频号"
  accounts:
    - "贝妙模型专营店"
    - "爱拼的未未"
    - "贝妙乐活社"
```

**配置的优先级规则：**
1. 文件名正则解析得到基础字段（date, platform, account, product, direction）
2. Frontmatter 映射字段**覆盖**文件名解析结果（如果 frontmatter 中有 platform 字段，以它为准）
3. `publish_date` 特殊处理：frontmatter > 文件名日期 > 文件修改时间

### 2.4 内容状态判断逻辑

| 状态 | 判断依据 | 示例 |
|------|---------|------|
| **published** | frontmatter.status 匹配 status_mapping.published 中任一值 | `status: 已发布` |
| **pending** | frontmatter.status 匹配 status_mapping.pending 中任一值 | `status: 待发布` |
| **draft** | frontmatter.status 匹配 status_mapping.draft 中任一值 或 无 status 字段 | `status: 草稿` 或 无 status |
| **today** | publish_date === today | 用于 get_today_schedule |

### 2.5 错误处理

| 场景 | 行为 |
|------|------|
| 配置文件不存在 | 使用内置默认配置（按本项目笔记格式） |
| 文件名解析失败（不匹配正则） | 跳过该文件，在结果中加入 `warning` 字段 |
| Frontmatter 解析失败 | 只使用文件名解析结果 |
| vault_path 不存在 | 返回明确错误提示 |
| glob 无匹配 | 返回空列表 |

---

## 三、技术架构

### 3.1 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| **语言** | TypeScript | MCP SDK 官方 TypeScript 支持最好，Cursor/Claude Code 生态主流 |
| **运行时** | Node.js 18+（LTS） | 最广泛的兼容性 |
| **MCP SDK** | `@modelcontextprotocol/sdk`（v1 stable） | 官方 SDK，文档成熟 |
| **配置文件** | YAML（`js-yaml`） | 比 JSON 更适合人类编写，有注释支持 |
| **Frontmatter 解析** | `gray-matter` | 成熟的 Markdown frontmatter 解析库 |
| **日期处理** | `date-fns` | 轻量，tree-shakable |
| **Glob** | `fast-glob` | Node.js 最快的 glob 实现 |
| **测试** | Vitest | 与 TypeScript 原生兼容，快 |
| **构建** | `tsup` | 零配置 TypeScript 打包，输出 cjs + esm |

### 3.2 项目结构

```
obsidian-content-calendar-mcp/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .gitignore
├── LICENSE                    # MIT
├── README.md                  # SEO 优化的 README（见第七节）
│
├── src/
│   ├── index.ts               # 入口：启动 MCP Server
│   ├── config.ts              # 配置加载与验证
│   ├── config.schema.ts       # 配置文件的 TypeScript 类型定义
│   ├── parser/
│   │   ├── filename.ts        # 文件名正则解析器
│   │   ├── frontmatter.ts     # Frontmatter 解析器
│   │   └── status.ts          # 状态推断器
│   ├── scanner/
│   │   └── vault.ts           # Obsidian vault 扫描器
│   ├── tools/
│   │   ├── today.ts           # get_today_schedule
│   │   ├── pending.ts         # get_pending_content
│   │   ├── status.ts          # get_content_by_status
│   │   ├── nextup.ts          # get_next_up
│   │   └── summary.ts         # get_calendar_summary
│   ├── formatter/
│   │   ├── json.ts            # JSON 格式化
│   │   └── markdown.ts        # Markdown 格式化
│   ├── types.ts               # 所有类型定义
│   └── utils.ts               # 工具函数
│
├── fixtures/                  # 测试用 fixture
│   ├── vault/
│   │   └── 20_Projects/
│   │       └── Content_Production/
│   │           └── 2026-05_Batch_01/
│   │               └── 01_作品区/
│   │                   ├── 20260507_抖音_贝妙模型专营店_地球视界_功能带货.md
│   │                   ├── 20260508_小红书_贝妙乐活社_地球视界_颜值种草.md
│   │                   └── ... (更多 fixture)
│   └── obsidian-content-calendar.config.yaml
│
├── tests/
│   ├── config.test.ts
│   ├── parser/
│   │   ├── filename.test.ts
│   │   ├── frontmatter.test.ts
│   │   └── status.test.ts
│   ├── scanner/
│   │   └── vault.test.ts
│   ├── tools/
│   │   ├── today.test.ts
│   │   ├── pending.test.ts
│   │   └── nextup.test.ts
│   └── formatter/
│       ├── json.test.ts
│       └── markdown.test.ts
│
└── docs/                      # 文档站源码（后续可选）
    └── landing.md
```

### 3.3 MCP Server 接口设计

使用 `@modelcontextprotocol/sdk` 的 **stdio transport**（默认），后续可扩展 Streamable HTTP。

```typescript
// src/index.ts - 核心结构

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { createVaultScanner } from './scanner/vault.js';
import { TodayTool } from './tools/today.js';
import { PendingTool } from './tools/pending.js';
import { StatusTool } from './tools/status.js';
import { NextUpTool } from './tools/nextup.js';
import { SummaryTool } from './tools/summary.js';

async function main() {
  // 1. 加载配置
  const config = await loadConfig();
  
  // 2. 创建扫描器
  const scanner = createVaultScanner(config);
  
  // 3. 初始化 MCP Server
  const server = new McpServer({
    name: 'obsidian-content-calendar',
    version: '1.0.0',
  });
  
  // 4. 注册 tools
  server.tool(
    'get_today_schedule',
    'Get today\'s content publishing schedule from your Obsidian vault',
    {
      format: z.string().optional().describe('Output format: "json" or "markdown"'),
    },
    async ({ format }) => {
      const items = await scanner.scanToday();
      const formatted = format === 'markdown' 
        ? formatAsMarkdown(items)
        : formatAsJson(items);
      return { content: [{ type: 'text', text: formatted }] };
    }
  );
  
  // ... 注册其他 tools
  
  // 5. 连接 transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

### 3.4 工具详细参数

#### `get_today_schedule`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `format` | `"json" \| "markdown"` | 否 | `"json"` | 输出格式 |
| `date` | `string` (ISO date) | 否 | 今天 | 指定日期（用于查看其他日期） |

#### `get_pending_content`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `format` | `"json" \| "markdown"` | 否 | `"json"` | 输出格式 |
| `platform` | `string` | 否 | 全部 | 按平台过滤 |
| `account` | `string` | 否 | 全部 | 按账号过滤 |

#### `get_content_by_status`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `status` | `"published" \| "pending" \| "draft"` | 是 | — | 要查询的状态 |
| `format` | `"json" \| "markdown"` | 否 | `"json"` | 输出格式 |

#### `get_next_up`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `count` | `number` | 否 | `5` | 返回 N 条 |
| `format` | `"json" \| "markdown"` | 否 | `"json"` | 输出格式 |

#### `get_calendar_summary`

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `start_date` | `string` (ISO date) | 否 | 本月1号 | 开始日期 |
| `end_date` | `string` (ISO date) | 否 | 本月最后一天 | 结束日期 |
| `format` | `"json" \| "markdown"` | 否 | `"json"` | 输出格式 |

---

## 四、GitHub Repo 与 SEO 策略

### 4.1 Repo 基础信息

| 字段 | 值 |
|------|-----|
| **Repo 名** | `obsidian-content-calendar-mcp` |
| **License** | MIT |
| **Topics** | `obsidian`, `mcp`, `mcp-server`, `content-calendar`, `claude-mcp`, `ai-workflow`, `obsidian-plugin`, `content-planning`, `obsidian-mcp` |

### 4.2 README 策略

README 是 SEO 核心入口，标题必须覆盖搜索意图。

**标题**（H1）：
```
# Obsidian Content Calendar MCP Server for Claude Desktop, Cursor, Cline and ChatGPT
```

**子标题/第一段**：
```
An MCP (Model Context Protocol) server that turns your Obsidian vault into an AI-powered content calendar. 
Let Claude, Cursor, Cline, or ChatGPT tell you what to publish today — directly from your Markdown notes.
```

**README 目录结构**：
```markdown
## ✨ Features
## 📋 What problems does it solve?
## 🚀 Quick Start
### Prerequisites
### Installation (npm / npx)
### Configuration
### Claude Desktop Integration
### Cursor Integration
### Cline Integration  
### ChatGPT Integration
## ⚙️ Configuration Reference
## 🛠️ MCP Tools
## 🧪 Example Workflow
## 🏗️ Architecture
## 📦 Free vs Pro Features
## 🤝 Contributing
## 📄 License
```

**README 中的 SEO 关键词覆盖（自然融入 Natural Language）：**

- `Obsidian MCP server` — 核心词
- `content calendar MCP` — 场景+技术词  
- `Claude Desktop MCP` — 生态词
- `Claude Code MCP` — 生态词
- `AI content workflow` — 工作流词
- `solo creator workflow` — 人群词
- `Obsidian content planning` — 场景词
- `MCP for content creators` — 人群+技术词
- `content scheduling MCP` — 功能词

### 4.3 目录提交流程

| 目录 | URL | 优先级 | 提交方式 |
|------|-----|--------|---------|
| **Official MCP Registry** | https://registry.modelcontextprotocol.io | 🔴 必交 | 提交 GitHub issue / PR |
| **Glama** | https://glama.ai/mcp | 🔴 必交 | 在线提交表单 |
| **PulseMCP** | https://pulsemcp.com | 🔴 必交 | 在线提交 |
| **Smithery** | https://smithery.ai | 🔴 必交 | 在线提交 |
| **MCP Market** | https://mcp.market | 🟡 推荐 | 在线提交 |
| **Cline Marketplace** | https://marketplace.cline.bot | 🟡 推荐 | 规则允许则提交 |

**提交时统一使用描述**（100 chars within）：
```
Turn your Obsidian vault into an AI-powered content calendar. Let Claude, Cursor, Cline, and ChatGPT read your content notes, find pending posts, and generate today's publishing schedule — configurable naming patterns and frontmatter mapping.
```

### 4.4 文档站 / 落地页（后续可选）

**页面标题策略**（不要写 "Best MCP Server" 这种宽泛词，要逼近真实搜索意图）：

```
Use Claude to manage your Obsidian content calendar with MCP
```

**落地页内容规划**：
- Hero: "Your Obsidian vault, now AI-aware"
- 截图/动画：AI 客户端调用 `get_today_schedule` 返回发布清单
- Quick Start: 三行命令安装
- 用户场景：一人公司/内容团队
- 与竞品对比（如果有的话）

---

## 五、免费 vs 付费功能拆分

### 5.1 免费版（MVP，本 PRD 覆盖范围）

| 功能 | 说明 |
|------|------|
| 本地读取 Obsidian 的 Markdown 内容笔记 | 纯本地文件操作，不依赖外部API |
| 可配置文件名解析 + frontmatter 映射 | YAML 配置文件，用户自定义规则 |
| 生成今日发布清单 | get_today_schedule |
| 查询待发布内容 | get_pending_content |
| 按状态过滤 | get_content_by_status |
| 查看接下来待发内容 | get_next_up |
| JSON / Markdown 双格式输出 | 参数可选 |
| 输出给 Claude Code / Cursor / Cline / ChatGPT | 标准 MCP 协议，所有客户端兼容 |

### 5.2 付费版（未来迭代）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| Web UI 看板 | P0 | 可视化内容日历，甘特图/日历视图 |
| 多账号内容看板 | P1 | 同时管理多个账号/项目的内容日历 |
| AI 选题推荐 | P1 | 基于历史内容 + 热点趋势推荐选题 |
| 内容状态同步（云） | P2 | 多设备同步状态 |
| 图片/封面 Prompt 管理 | P2 | 为每条内容关联封面图生成提示词 |
| 小红书/抖音/YouTube Shorts 模板 | P2 | 按平台输出适配格式 |
| 团队协作 | P3 | 多人协作内容排期 |

> **付费设计原则**：免费版本地优先，完全可用。付费版加的是「云端同步 + 可视化 + 协作」能力，不制造功能性窒息。

---

## 六、交付标准与验收条件

### 6.1 MVP 验收条件

| # | 验收项 | 标准 |
|---|--------|------|
| 1 | MCP Server 启动 | `npx obsidian-content-calendar-mcp` 或本地 npm start 后正常监听 stdio |
| 2 | 配置文件加载 | 读取指定路径的 `obsidian-content-calendar.config.yaml`，缺失时使用默认配置 |
| 3 | 文件名解析 | 正确从 fixture 文件名中提取 date/platform/account/product/direction |
| 4 | Frontmatter 解析 | 正确从 fixture 文件的 frontmatter 中读取 status/publish_date/tags |
| 5 | 状态推断 | 将 frontmatter 中的「已发布/待发布/草稿」映射为标准状态 |
| 6 | get_today_schedule | 返回今天应发布的全部内容，按平台分组排序 |
| 7 | get_pending_content | 返回所有 status=pending 的内容 |
| 8 | get_content_by_status | 按传入的 status 参数过滤 |
| 9 | get_next_up | 返回接下来 N 条待发布内容（按日期排序） |
| 10 | get_calendar_summary | 返回指定时间范围内的内容分布 |
| 11 | Markdown 格式 | format=markdown 时返回可读的 Markdown 文本 |
| 12 | JSON 格式 | format=json 时返回结构化 JSON |
| 13 | 测试覆盖 | 核心解析逻辑 + 每个 tool 至少 1 个测试用例 |
| 14 | README | 包含完整安装/配置/使用说明 |

### 6.2 非功能性要求

| 维度 | 要求 |
|------|------|
| 性能 | 扫描 1000 个笔记文件应在 2 秒内完成 |
| 兼容性 | Node.js 18/20/22 LTS |
| 可配置性 | 无需改代码，通过配置文件适配不同的笔记命名和 frontmatter 格式 |
| 文档 | README 包含完整的使用场景和配置说明 |
| 发布 | 以 npm 包形式发布（`@username/obsidian-content-calendar-mcp` 或 scope 不限） |

---

## 七、开发计划（Codex 执行参考）

### Phase 1：核心架构（高优先级）

1. 初始化 TypeScript 项目（package.json, tsconfig, tsup）
2. 实现 `config.ts` — 配置加载与校验（含默认配置）
3. 实现 `parser/filename.ts` — 文件名正则解析
4. 实现 `parser/frontmatter.ts` — Frontmatter 解析（gray-matter）
5. 实现 `parser/status.ts` — 状态推断
6. 实现 `scanner/vault.ts` — Vault 扫描器（fast-glob）
7. 实现 `types.ts` — 所有类型定义

### Phase 2：MCP Tools（高优先级）

8. 实现 `index.ts` — MCP Server 入口
9. 实现 `tools/today.ts`
10. 实现 `tools/pending.ts`
11. 实现 `tools/status.ts`
12. 实现 `tools/nextup.ts`
13. 实现 `tools/summary.ts`
14. 实现 `formatter/json.ts` 和 `formatter/markdown.ts`

### Phase 3：测试与Fixture（中优先级）

15. 创建 fixtures/vault/ 测试用笔记
16. 创建 obsidian-content-calendar.config.yaml 示例配置
17. 编写核心单元测试

### Phase 4：发布准备（中优先级）

18. 编写 README.md（SEO 友好）
19. 配置 package.json 的 bin/ 字段（npx 可直接运行）
20. npm publish

### Phase 5：SEO 分发（低优先级，持续）

21. 提交到 MCP Registry / Glama / PulseMCP / Smithery 等目录
22. 编写文档站/落地页

---

## 八、FAQ

### Q: 为什么不用 Obsidian Local REST API 插件？

A: 依赖插件会增加用户接入门槛。本项目纯文件系统操作，用户只需要指定 Obsidian vault 路径，不需要安装任何 Obsidian 插件。

### Q: 和已有的 Obsidian MCP server（如 mcp-obsidian）有什么区别？

A: 现有 Obsidian MCP server 做的是「读写 Obsidian 笔记」的通用接口（读/写/搜索），而本项目专攻 **内容日历场景**——理解文件的 frontmatter 状态、按日期/平台/账号聚合、输出 AI 可直接消费的发布清单。两者的关系是：**通用 MCP 是「文件层」，我们是「日历语义层」**。

### Q: 配置文件必须放到 vault 根目录吗？

A: 不必。可以通过环境变量 `OBSIDIAN_CONTENT_CALENDAR_CONFIG` 指定配置文件路径，也可以使用默认路径 `$OBSIDIAN_VAULT/obsidian-content-calendar.config.yaml`。

### Q: 能处理嵌套目录结构的内容吗？

A: 可以。`content_paths` 支持 glob 模式，用户的笔记可以分布在任何子目录中。

---

## 九、附录

### 9.1 默认配置（内置 fallback）

当用户没有提供配置文件时，使用以下默认配置——匹配本项目内容工厂的笔记格式：

```yaml
# 默认配置（内置）
filename_pattern: "^(?<date>\\d{8})_(?<platform>[^_]+)_(?<account>[^_]+)_(?<product>[^_]+)_(?<direction>.+)\\.md$"
date_format: "yyyyMMdd"
frontmatter_mapping:
  status: "status"
  publish_date: "publish_date"
  platform: "platform"
  account: "account"
  product: "product"
  batch: "batch"
status_mapping:
  published: ["已发布", "published", "done"]
  pending: ["待发布", "pending", "scheduled"]
  draft: ["草稿", "draft", "wip", "规划中"]
date_formats:
  publish_date: "yyyy-MM-dd"
```

### 9.2 配置文件完整示例

参见 fixture 目录下的 `obsidian-content-calendar.config.yaml`。

### 9.3 相关资源

- [MCP Specification](https://modelcontextprotocol.io/specification/latest)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Registry](https://registry.modelcontextprotocol.io)
