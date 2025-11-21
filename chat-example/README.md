# AI 聊天助手示例

基于 Claude Code 的智能对话系统，提供美观的 Markdown 渲染和便捷的复制功能。

## ✨ 功能特性

### 🎯 核心功能

- **智能对话**: 基于 Claude Code 的 AI 对话系统
- **实时响应**: 流畅的实时消息交互
- **错误处理**: 完善的错误处理和用户提示

### 🎨 界面特色

- **Markdown 渲染**: AI 回复以美观的 Markdown 格式显示
- **响应式设计**: 适配桌面和移动设备
- **现代化 UI**: 简洁现代的聊天界面设计
- **加载动画**: 优雅的加载状态指示

### 📋 复制功能

- **双格式复制**: 支持 Markdown 和纯文本两种格式
- **智能清理**: 纯文本复制自动移除 Markdown 标记
- **悬停显示**: 鼠标悬停时显示复制按钮
- **视觉反馈**: 复制成功/失败的通知提示

## 🚀 快速开始

### 环境要求

- [Bun](https://bun.sh/) 1.0 或更高版本
- Claude Code CLI 已安装并配置

### 安装和运行

1. **安装依赖**

   ```bash
   bun install
   ```

2. **启动服务器**

   ```bash
   bun run server.ts
   ```

3. **访问应用**
   打开浏览器访问: http://localhost:3001

### 开发模式

使用热重载开发模式：

```bash
bun --hot ./server.ts
```

## 📁 项目结构

```
chat-example/
├── server.ts          # 服务器主文件
├── frontend.tsx       # React 前端组件
├── index.html         # HTML 模板
├── dist/              # 构建输出目录
│   └── frontend.js    # 编译后的前端代码
└── README.md          # 项目文档
```

## 🔧 技术栈

### 后端

- **Bun**: 运行时和服务器
- **@iamqc/cc-session**: Claude Code 会话管理
- **WebSockets**: 实时通信支持

### 前端

- **React**: 用户界面框架
- **React Markdown**: Markdown 渲染
- **TypeScript**: 类型安全
- **CSS-in-JS**: 样式管理

## 🎯 使用说明

### 基本对话

1. 在输入框中输入问题
2. 按 Enter 或点击"发送"按钮
3. 等待 AI 回复
4. 查看格式化的 Markdown 内容

### 复制功能

- **悬停显示**: 将鼠标悬停在 AI 回复上
- **复制 Markdown**: 点击 📋 MD 按钮复制原始 Markdown
- **复制纯文本**: 点击 📝 文本 按钮复制清理后的文本

### 支持的 Markdown 语法

- 标题 (H1-H6)
- 粗体和斜体
- 代码块和行内代码
- 有序和无序列表
- 引用块
- 表格
- 链接和图片
- 分割线

## ⚙️ 配置说明

### 服务器配置

在 `server.ts` 中可配置：

- 端口号 (默认: 3001)
- Claude Code 执行路径
- 静态文件服务

### AI 服务配置

```typescript
const client = createClientWithPreset('development', {
  pathToClaudeCodeExecutable: '/path/to/claude',
});
```

## 🔍 API 接口

### POST /api/chat

发送消息给 AI 并获取回复

**请求体:**

```json
{
  "message": "你的问题"
}
```

**响应:**

```json
{
  "success": true,
  "response": "AI 回复内容"
}
```

## 🛠️ 开发指南

### 添加新功能

1. 在 `frontend.tsx` 中修改 React 组件
2. 在 `server.ts` 中添加 API 端点
3. 重新构建前端代码: `bun build ./frontend.tsx --outdir ./dist`

### 自定义样式

- 修改 `frontend.tsx` 中的内联样式
- 更新 Markdown CSS 样式
- 调整复制按钮的样式和位置

### 扩展复制功能

在 `copyToClipboard` 函数中添加新的格式处理逻辑

## 🐛 故障排除

### 常见问题

**Q: AI 服务初始化失败**
A: 检查 Claude Code 路径配置是否正确

**Q: 前端无法加载**
A: 确保已运行 `bun build` 构建前端代码

**Q: 复制功能不工作**
A: 检查浏览器是否支持 Clipboard API

**Q: Markdown 渲染异常**
A: 验证 `react-markdown` 依赖是否正确安装

### 调试模式

启用开发模式查看详细日志：

```bash
bun --hot ./server.ts
```

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**返回主项目**: [返回主 README](../README.md)
