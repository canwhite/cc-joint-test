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
| **cc-communication** | WebSocket 通信工具，支持实时数据传输 | [GitHub](https://github.com/canwhite/cc-communication) |

## 💻 使用示例

### 基础集成示例

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

  // 订阅会话更新,这里是整体过程数据
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

  // 发送消息请求分析项目，result是最终结果数据
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

### 🔌 WebSocket 通信示例

使用 `cc-communication` 实现实时通信：

```typescript
import { CCWebSocket } from '@iamqc/cc-communication';
import { Session, createClientWithPreset } from '@iamqc/cc-session';
import { JSONParser } from '@iamqc/cc-json-parser';

// 创建 WebSocket 服务器
const ws = new CCWebSocket({
  port: 3001,
  handlers: {
    onClientConnect: (clientId) => {
      console.log(`客户端 ${clientId} 已连接`);
    },
    onCustomMessage: async (type, data, clientId) => {
      if (type === 'chat') {
        // 处理聊天消息
        const client = createClientWithPreset("development", {
          pathToClaudeCodeExecutable: "/Users/zack/.bun/bin/claude",
        });

        const session = new Session(client);
        const result = await session.send(data.message);
        const responseText = result.lastAssistantMessage.content[0].content.text;

        // 发送 AI 回复给客户端
        ws.sendToClient(clientId, {
          type: 'chat_response',
          data: { response: responseText }
        });
      }
    }
  }
});

await ws.start();
console.log('WebSocket 服务器已启动');
```

### 🎨 完整应用示例

我们提供了两个完整的聊天应用示例，展示了不同的架构方案：

#### 1. HTTP 版本 (chat-example)
- **项目位置**: [`chat-example/`](./chat-example/)
- **通信方式**: HTTP REST API
- **特点**: 简单直接，适合基础应用
- **功能特性**:
  - 基于 React 的现代化聊天界面
  - Markdown 格式渲染 AI 回复
  - 支持复制 Markdown 和纯文本
  - 响应式设计

**查看详细文档**: [chat-example README](./chat-example/README.md)

**快速体验**:
```bash
bun run chat:build
bun run chat:start
```
然后访问 http://localhost:3001

#### 2. WebSocket 版本 (chat-example-comm)
- **项目位置**: [`chat-example-comm/`](./chat-example-comm/)
- **通信方式**: WebSocket 实时通信
- **特点**: 实时性强，适合需要实时更新的应用
- **功能特性**:
  - 基于 `cc-communication` 的实时双向通信
  - 多用户独立会话管理
  - 自动重连机制
  - 实时连接状态显示
  - 消息发送状态跟踪

**查看详细文档**: [chat-example-comm README](./chat-example-comm/README.md)

**快速体验**:
```bash
bun run chat:comm:build
bun run chat:comm:start
```
然后访问 http://localhost:3002

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

- _更多组件正在规划中..._

---

<div align="center">

**本项目使用 [`bun init`](https://bun.sh/docs/cli/bun-init) 在 Bun v1.3.1 中创建**

[Bun](https://bun.com) 是一个快速的 JavaScript 全能运行时

</div>
