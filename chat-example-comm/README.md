# AI 实时聊天助手 (WebSocket 版本)

基于 `cc-communication` 和 `cc-session` 的实时 AI 聊天系统，提供 WebSocket 实时通信能力。

## ✨ 功能特性

### 🔌 实时通信
- **WebSocket 连接**: 基于 `cc-communication` 的实时双向通信
- **自动重连**: 连接断开时自动重连机制
- **连接状态**: 实时显示连接状态
- **心跳检测**: 保持连接活跃

### 🤖 AI 对话
- **独立会话**: 每个客户端拥有独立的 AI 会话
- **实时响应**: AI 回复实时推送到前端
- **会话管理**: 自动管理客户端会话生命周期

### 🎨 用户体验
- **Markdown 渲染**: AI 回复以美观的 Markdown 格式显示
- **消息状态**: 实时显示消息发送状态
- **复制功能**: 支持 Markdown 和纯文本复制
- **错误处理**: 完善的错误提示和重试机制

### 🔧 技术特色
- **类型安全**: 完整的 TypeScript 支持
- **模块化**: 清晰的代码结构
- **可扩展**: 易于添加新功能
- **生产就绪**: 错误处理和优雅关闭

## 🚀 快速开始

### 环境要求
- [Bun](https://bun.sh/) 1.0 或更高版本
- Claude Code CLI 已安装并配置
- 项目依赖已安装 (使用外层 package.json)

### 安装和运行

1. **安装项目依赖** (在外层目录)
   ```bash
   cd ..
   bun install
   ```

2. **构建前端代码**
   ```bash
   bun run chat:build
   ```

3. **启动服务器**
   ```bash
   bun run chat:comm:start
   ```

4. **访问应用**
   打开浏览器访问: http://localhost:3002

### 开发模式
使用热重载开发模式：
```bash
bun run chat:comm:dev
```

## 📁 项目结构

```
chat-example-comm/
├── server.ts          # WebSocket 服务器主文件
├── frontend.tsx       # React 前端组件
├── index.html         # HTML 模板
├── dist/              # 构建输出目录
│   └── frontend.js    # 编译后的前端代码
└── README.md          # 项目文档
```

## 🔧 技术架构

### 后端架构
```
WebSocket Server (cc-communication)
    ↓
Chat Session Manager
    ↓
AI Session (cc-session)
    ↓
Claude Code
```

### 前端架构
```
React Component
    ↓
WebSocket Client
    ↓
Message Handler
    ↓
UI Renderer
```

## 🎯 核心功能说明

### WebSocket 消息协议

#### 客户端发送消息
```typescript
{
  type: 'chat_message',
  data: {
    message: '用户输入内容',
    messageId: '唯一消息ID'
  }
}
```

#### 服务器响应消息
- `system_message`: 系统消息
- `ai_response`: AI 回复
- `processing_started`: 开始处理
- `error`: 错误信息
- `pong`: 心跳响应

### 会话管理
- 每个 WebSocket 连接创建独立的 AI 会话
- 连接断开时自动清理会话
- 支持并发多用户对话

### 错误处理
- 网络连接错误自动重连
- AI 服务错误友好提示
- 消息发送失败状态显示

## 🔍 API 文档

### WebSocket 服务器
- **地址**: `ws://localhost:3002/chat`
- **端口**: 3002
- **路径**: `/chat`

### 消息类型

#### 客户端消息类型
- `chat_message`: 发送聊天消息
- `ping`: 心跳检测

#### 服务器消息类型
- `system_message`: 系统通知
- `ai_response`: AI 回复
- `processing_started`: 处理开始
- `error`: 错误信息
- `pong`: 心跳响应

## 🛠️ 开发指南

### 添加新功能

#### 1. 添加新的消息类型
在 `server.ts` 的 `onCustomMessage` 中添加新的 case：
```typescript
case 'new_message_type':
  await handleNewMessageType(data, clientId);
  break;
```

#### 2. 扩展前端功能
在 `frontend.tsx` 的 `handleWebSocketMessage` 中添加新的消息处理逻辑。

#### 3. 自定义样式
修改 `frontend.tsx` 中的内联样式和 CSS。

### 配置说明

#### 服务器配置
在 `server.ts` 中可配置：
- WebSocket 端口 (默认: 3002)
- Claude Code 执行路径
- 会话超时时间

#### 前端配置
在 `frontend.tsx` 中可配置：
- WebSocket 服务器地址
- 重连间隔
- UI 主题

## 🐛 故障排除

### 常见问题

**Q: WebSocket 连接失败**
A: 检查服务器是否启动，端口 3002 是否被占用

**Q: AI 服务无响应**
A: 检查 Claude Code 路径配置是否正确

**Q: 前端无法加载**
A: 确保已运行构建命令：`bun run chat:build`

**Q: 复制功能不工作**
A: 检查浏览器是否支持 Clipboard API

### 调试模式
启用开发模式查看详细日志：
```bash
bun run chat:comm:dev
```

## 📊 性能优化

### 已实现的优化
- **消息去重**: 基于 messageId 的消息管理
- **连接池**: WebSocket 连接复用
- **内存管理**: 自动清理断开连接的会话
- **错误恢复**: 自动重连机制

### 建议的优化
- 消息压缩
- 分页加载历史消息
- 离线消息队列
- 消息缓存

## 🔄 与 chat-example 对比

| 特性 | chat-example | chat-example-comm |
|------|-------------|------------------|
| 通信方式 | HTTP REST | WebSocket |
| 实时性 | 请求-响应 | 实时推送 |
| 会话管理 | 单会话 | 多用户独立会话 |
| 连接状态 | 无状态 | 有状态连接 |
| 适用场景 | 简单对话 | 实时应用 |

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**返回主项目**: [返回主 README](../README.md)

**查看 HTTP 版本**: [chat-example](../chat-example/README.md)