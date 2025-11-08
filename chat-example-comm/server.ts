import { CCWebSocket } from '@iamqc/cc-communication';
import { Session, createClientWithPreset } from '@iamqc/cc-session';


// 聊天会话管理器
class ChatSessionManager {
  private sessions: Map<string, Session> = new Map();
  private pendingMessages: Map<string, { messageId: string, timeout: NodeJS.Timeout }> = new Map();

  async createSession(clientId: string): Promise<Session> {
    try {
      const client = createClientWithPreset("development", {
        pathToClaudeCodeExecutable: "/Users/zack/.bun/bin/claude",
      });

      const session = new Session(client);

      // 订阅会话更新 - 实时监听AI响应
      session.subscribe((session, message) => {
        console.log(`[${clientId}] ${message.type}:`, JSON.stringify(message, null, 2));

        console.log("--type--",message.type)
        console.log("--message complete data",JSON.stringify(message))

        // 调试：记录所有消息类型和内容
        console.log(`🔍 调试消息 - 类型: ${message.type}, 消息详情:`, JSON.stringify({
          type: message.type,
          messageType: (message as any).message?.type,
          subtype: (message as any).subtype,
          result: (message as any).result
        }, null, 2));
        // 1. AI开始处理时发送状态
        if (message.type === 'message_added' && message.message?.type === 'assistant') {
          console.log(`🤖 AI开始回复`);

          // 提取AI回复内容
          const aiMessage = message.message;
          let responseText = '';
          if (aiMessage.content && aiMessage.content.length > 0) {
            responseText = aiMessage.content[0]?.content?.text || '';
          }

          // 发送处理中状态，包含AI回复内容
          try {
            ws.sendToClient(clientId, {
              type: 'ai_processing',
              data: {
                response: responseText,
                timestamp: new Date().toISOString()
              }
            });
            console.log(`🔄 发送AI处理中状态给客户端 ${clientId}`);
          } catch (error) {
            console.error(`❌ 发送处理中状态失败:`, error);
          }
        }

        // 3. 监听最终结果
        if ((message as any).type === 'result' && (message as any).subtype === 'success') {
          console.log(`🤖 检测到最终AI回复(result):`, message);

          const responseText = (message as any).result;
          if (responseText) {
            // 发送最终AI响应给客户端
            try {
              ws.sendToClient(clientId, {
                type: 'ai_response_complete',
                data: {
                  response: responseText,
                  timestamp: new Date().toISOString(),
                  isComplete: true
                }
              });
              console.log(`✅ 成功发送最终AI回复给客户端 ${clientId}`);
            } catch (error) {
              console.error(`❌ 发送最终回复失败:`, error);
            }
          }
        }
      });

      this.sessions.set(clientId, session);
      console.log(`为客户端 ${clientId} 创建了新的聊天会话`);
      return session;
    } catch (error) {
      console.error(`创建会话失败 (${clientId}):`, error);
      throw error;
    }
  }

  getSession(clientId: string): Session | undefined {
    return this.sessions.get(clientId);
  }

  setPendingMessage(clientId: string, messageId: string, timeout: NodeJS.Timeout): void {
    this.pendingMessages.set(clientId, { messageId, timeout });
  }

  clearPendingMessage(clientId: string): void {
    const pending = this.pendingMessages.get(clientId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingMessages.delete(clientId);
    }
  }

  removeSession(clientId: string): void {
    // 清除等待中的消息
    this.clearPendingMessage(clientId);
    this.sessions.delete(clientId);
    console.log(`移除了客户端 ${clientId} 的会话`);
  }

  hasSession(clientId: string): boolean {
    return this.sessions.has(clientId);
  }
}

// 创建聊天会话管理器
const chatManager = new ChatSessionManager();

// 创建 WebSocket 服务器（使用不同端口）
const ws = new CCWebSocket({
  port: 3005,
  host: 'localhost',
  path: '/chat',
},{
    // 客户端连接事件
    onClientConnect: async (clientId) => {
      console.log(`🟢 客户端 ${clientId} 已连接`);
      console.log(`🟢 连接详情: 客户端ID=${clientId}`);

      try {
        // 为新客户端创建会话
        await chatManager.createSession(clientId);

        // 发送欢迎消息
        ws.sendToClient(clientId, {
          type: 'system_message',
          data: {
            message: '欢迎使用实时 AI 聊天助手！您可以开始对话了。',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error(`初始化客户端 ${clientId} 失败:`, error);
        ws.sendToClient(clientId, {
          type: 'error',
          data: {
            message: '初始化失败，请刷新页面重试。',
            error: error instanceof Error ? error.message : '未知错误'
          }
        });
      }
    },

    // 客户端断开事件
    onClientDisconnect: (clientId) => {
      console.log(`🔴 客户端 ${clientId} 已断开`);
      chatManager.removeSession(clientId);
    },

    // 处理自定义消息
    onCustomMessage: async (type, data, clientId) => {
      console.log(`📨 收到来自 ${clientId} 的消息类型: ${type}`, data);
      console.log(`📨 消息数据详情:`, JSON.stringify(data, null, 2));
      console.log(`📨 消息类型检查: ${type === 'chat_message' ? '匹配chat_message' : '不匹配'}`);

      switch (type) {
        case 'chat_message':
          await handleChatMessage(data, clientId);
          break;

        case 'ping':
          // 心跳检测
          ws.sendToClient(clientId, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() }
          });
          break;

        default:
          console.warn(`未知消息类型: ${type}`);
          ws.sendToClient(clientId, {
            type: 'error',
            data: { message: `未知消息类型: ${type}` }
          });
      }
    }
  });
  // 启动 WebSocket 服务器
async function startServer() {
  try {
    console.log('🔄 正在启动 WebSocket 服务器...');
    await ws.start();
    console.log('🚀 WebSocket 服务器已启动');
    console.log('📡 WebSocket 地址: ws://localhost:3005/chat');
    console.log('🌐 HTTP 前端地址: http://localhost:3004');
    console.log('💡 使用 Ctrl+C 停止服务器');
    console.log('🔍 服务器启动完成，等待客户端连接...');
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}


// 处理聊天消息 - 使用异步监听模式
async function handleChatMessage(data: any, clientId: string) {
  const { message, messageId } = data;


  if (!message || typeof message !== 'string') {
    ws.sendToClient(clientId, {
      type: 'error',
      data: {
        messageId,
        error: '无效的消息内容'
      }
    });
    return;
  }

  try {

    console.log(`🤖 正在发送消息到AI会话: ${message}`);

    // 发送正在处理的消息
    ws.sendToClient(clientId, {
      type: 'processing_started',
      data: { messageId, timestamp: new Date().toISOString() }
    });

    // 获取用户的会话
    const session = chatManager.getSession(clientId);
    if (!session) {
      throw new Error('会话不存在，请重新连接');
    }



    // 发送消息给 AI - 不等待同步响应，依赖订阅机制获取响应
    await session.send(message,[]);

    console.log(`✅ 消息已发送给AI，等待响应中...`);


  } catch (error) {
    console.error(`处理客户端 ${clientId} 的消息失败:`, error);

    ws.sendToClient(clientId, {
      type: 'error',
      data: {
        messageId,
        error: error instanceof Error ? error.message : '处理消息时发生错误',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// 启动 HTTP 服务器用于提供前端文件
Bun.serve({
  port: 3004,
  async fetch(req) {
    const url = new URL(req.url);

    // 处理根路径 - 返回 HTML 页面
    if (url.pathname === '/') {
      return new Response(Bun.file('./index.html'));
    }

    // 处理原生 WebSocket 测试页面
    if (url.pathname === '/native-ws') {
      return new Response(Bun.file('./index-native-ws.html'));
    }

    // 处理静态文件
    if (url.pathname.startsWith('/dist/') || url.pathname.endsWith('.js')) {
      const filePath = '.' + url.pathname;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/javascript'
          }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  // 开发模式配置
  development: {
    hmr: true,
    console: true,
  },
});


// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await ws.stop();
  console.log('✅ 服务器已关闭');
  process.exit(0);
});

// 启动服务器
startServer();