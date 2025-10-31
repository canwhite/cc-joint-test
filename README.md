# CC Joint Test

<div align="center">

**一个用于测试 cc-session 和 cc-json-parser 集成使用的示例项目**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Powered%20by-Bun-black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/Written%20in-TypeScript-blue)](https://www.typescriptlang.org/)

</div>

## 📋 目录

- [CC Joint Test](#cc-joint-test)
  - [📋 目录](#-目录)
  - [🚀 快速开始](#-快速开始)
  - [🔗 相关项目](#-相关项目)
  - [💻 使用示例](#-使用示例)
  - [📦 安装说明](#-安装说明)
    - [1. 安装 Claude Code](#1-安装-claude-code)
    - [2. 安装项目依赖](#2-安装项目依赖)
    - [3. 运行项目](#3-运行项目)
  - [🗺️ 开发计划](#️-开发计划)

## 🚀 快速开始

在开始使用本项目之前，请确保您的系统已安装 Claude Code：

## 🔗 相关项目

本项目集成了测试了以下自建库：

| 项目               | 描述                                       | 链接                                                 |
| ------------------ | ------------------------------------------ | ---------------------------------------------------- |
| **cc-session**     | Claude Agent SDK，易于使用的会话和请求管理 | [GitHub](https://github.com/canwhite/cc-session)     |
| **cc-json-parser** | 从 AI 结果中快速提取 JSON 数据             | [GitHub](https://github.com/canwhite/cc-json-parser) |

## 💻 使用示例

```typescript
import {
  Session,
  SessionManager,
  createClientWithPreset,
} from "@iamqc/cc-session";
import { JSONParser } from "@iamqc/cc-json-parser";

/**
 * 集成使用示例：创建会话、发送消息并解析 JSON 响应
 */
async function finalTest() {
  // 使用开发预设创建客户端，并指定 Claude Code 可执行文件路径
  const client = createClientWithPreset("development", {
    pathToClaudeCodeExecutable: "/Users/zack/.bun/bin/claude",
  });

  // 创建会话实例
  const session = new Session(client);

  // 订阅会话更新
  // 返回取消订阅函数，可用于停止订阅
  session.subscribe((session, message) => {
    console.log(
      `[订阅] ${message.type}:`,
      message.type === "message_added"
        ? "收到新消息"
        : message.type === "session_info"
        ? `会话状态: ${message.isActive ? "活跃" : "空闲"}`
        : message.type === "usage_updated"
        ? `使用统计: ${JSON.stringify(message.usage)}`
        : message
    );
  });

  // 发送消息请求分析项目
  const result = await session.send(`
    分析当前项目，然后返回 json
    json 结构是：
    {
      target: "项目目的",
      main_structure: "主体结构"
    }
  `);

  console.log("--Response:", result.lastAssistantMessage.content);
  const responseText = result.lastAssistantMessage.content[0].content.text;
  console.log("--Response text:", responseText);

  // 使用 JSONParser 从 Markdown 代码块中提取 JSON 数据
  const extractedData = await JSONParser.extractJSON(responseText);
  console.log("--Extracted JSON:", extractedData);
}

// 执行测试函数
finalTest();
```

## 📦 安装说明

### 1. 安装 Claude Code

```bash
# 全局安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 或使用 Bun（推荐）
bun install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

### 2. 安装项目依赖

```bash
# 使用 Bun 安装依赖
bun install
```

### 3. 运行项目

```bash
# 运行主文件
bun run index.ts

```

## 🗺️ 开发计划

我们计划添加更多相关组件来完善生态系统：

- **[cc-communication](https://github.com/canwhite/cc-communication)** - 客户端通信库（欢迎贡献）
- _更多组件正在规划中..._

---

<div align="center">

**本项目使用 [`bun init`](https://bun.sh/docs/cli/bun-init) 在 Bun v1.3.1 中创建**

[Bun](https://bun.com) 是一个快速的 JavaScript 全能运行时

</div>
