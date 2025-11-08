import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import { useWebSocket } from "ahooks";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  error?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用 ahooks 的 useWebSocket
  const {
    readyState,
    latestMessage,
    sendMessage: sendWsMessage,
    connect,
    disconnect
  } = useWebSocket('ws://localhost:3005/chat', {
    onOpen: () => {
      console.log('✅ WebSocket 连接已建立');
    },
    onClose: () => {
      console.log('🔴 WebSocket 连接已关闭');
    },
    onError: (event) => {
      console.error('❌ WebSocket 错误:', event);
    },
    reconnectLimit: 5,
    reconnectInterval: 3000,
    manual: false
  });

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 处理最新消息
  useEffect(() => {
    if (latestMessage) {
      try {
        const message: WebSocketMessage = JSON.parse(latestMessage.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    }
  }, [latestMessage]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('📨 收到服务器消息:', message);

    // CCWebSocket库的消息格式：外层type是'message'，我们自定义的消息在data中
    if (message.type === 'message' && message.data) {
      // 提取我们自定义的消息类型
      const customMessage = message.data;
      console.log('🔍 提取自定义消息:', customMessage);

      switch (customMessage.type) {
      case 'system_message':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: customMessage.data.message,
          isUser: false,
          timestamp: new Date(customMessage.data.timestamp),
        }]);
        break;

      case 'ai_processing':
        // AI开始处理，显示AI回复内容
        setMessages(prev => [...prev, {
          id: 'ai-processing-' + Date.now().toString(),
          content: customMessage.data.response || '🤖 AI正在思考中...',
          isUser: false,
          timestamp: new Date(customMessage.data.timestamp),
          status: 'sending' as const
        }]);
        break;

      case 'ai_response_complete':
        // AI完整回复，更新处理中的消息状态
        setMessages(prev => {
          const processingMessageIndex = prev.findIndex(msg => msg.id.startsWith('ai-processing-'));
          if (processingMessageIndex !== -1) {
            // 更新处理中的消息为完成状态
            const updatedMessages = [...prev];
            updatedMessages[processingMessageIndex] = {
              ...updatedMessages[processingMessageIndex],
              content: customMessage.data.response,
              timestamp: new Date(customMessage.data.timestamp),
              status: 'sent' as const
            };
            return updatedMessages;
          } else {
            // 如果没有处理中的消息，则添加新消息
            return [...prev, {
              id: Date.now().toString(),
              content: customMessage.data.response,
              isUser: false,
              timestamp: new Date(customMessage.data.timestamp),
              status: 'sent' as const
            }];
          }
        });
        break;

      case 'error':
        // 错误消息，添加为新消息
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: customMessage.data.message || '发生错误',
          isUser: false,
          timestamp: new Date(),
          status: 'error' as const,
          error: customMessage.data.error
        }]);
        break;

      case 'pong':
        // 心跳响应，无需处理
        break;

      default:
        console.warn('未知消息类型:', customMessage.type);
    }
    } else {
      // 处理其他类型的消息（如connected等）
      console.log('忽略系统消息类型:', message.type);
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || readyState !== 1) return;

    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // 发送消息到服务器
    const messageToSend = JSON.stringify({
      type: 'chat_message',
      data: {
        message: userMessage.content,
        messageId: messageId
      }
    });
    console.log('📤 发送消息到服务器:', messageToSend);
    sendWsMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = async (text: string, format: 'markdown' | 'text') => {
    try {
      let contentToCopy = text;

      if (format === 'text') {
        // 移除markdown格式标记
        contentToCopy = text
          .replace(/^#+\s*/gm, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/^>\s*/gm, '')
          .replace(/^\s*-\s*/gm, '')
          .replace(/^\s*\d+\.\s*/gm, '')
          .trim();
      }

      await navigator.clipboard.writeText(contentToCopy);

      // 显示复制成功提示
      const notification = document.createElement('div');
      notification.textContent = `已复制${format === 'markdown' ? 'markdown格式' : '纯文本'}内容`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2000);

    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const getConnectionStatusText = () => {
    switch (readyState) {
      case 0: return '🟡 连接中...';
      case 1: return '🟢 已连接';
      case 2: return '🟠 关闭中...';
      case 3: return '🔴 已断开';
      default: return '⚪ 未知状态';
    }
  };

  const isConnected = readyState === 1;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#f5f5f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 标题栏 */}
      <div style={{
        padding: "16px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{
          margin: 0,
          color: "#333",
          fontSize: "24px",
          fontWeight: "600"
        }}>
          AI 实时聊天助手
        </h1>
        <p style={{
          margin: "4px 0 0 0",
          color: "#666",
          fontSize: "14px"
        }}>
          基于 WebSocket 的实时对话系统
        </p>
        <div style={{
          marginTop: "8px",
          fontSize: "12px",
          color: readyState === 1 ? "#10b981" :
                 readyState === 0 ? "#f59e0b" : "#ef4444"
        }}>
          {getConnectionStatusText()}
        </div>
      </div>

      {/* 消息区域 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        backgroundColor: "#fff"
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#999",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#666" }}>欢迎使用实时 AI 聊天助手</h3>
            <p style={{ margin: 0, fontSize: "14px" }}>开始对话，体验实时 AI 助手的强大能力</p>
            {!isConnected && (
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#ef4444" }}>
                正在连接服务器，请稍候...
              </p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.isUser ? "flex-end" : "flex-start",
                marginBottom: "16px"
              }}
            >
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor: message.isUser ? "#007AFF" : "#F0F0F0",
                color: message.isUser ? "#FFF" : "#333",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                wordWrap: "break-word",
                position: "relative",
                opacity: message.status === 'sending' ? 0.7 : 1
              }}>
                {message.isUser ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}

                {/* 复制按钮（仅AI回复） */}
                {!message.isUser && message.status !== 'sending' && (
                  <div style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "8px",
                    display: "flex",
                    gap: "4px",
                    opacity: 0,
                    transition: "opacity 0.2s ease"
                  }} className="copy-buttons">
                    <button
                      onClick={() => copyToClipboard(message.content, 'markdown')}
                      style={{
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "12px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        color: "#333",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      📋 MD
                    </button>
                    <button
                      onClick={() => copyToClipboard(message.content, 'text')}
                      style={{
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "12px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        color: "#333",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      📝 文本
                    </button>
                  </div>
                )}

                {/* 消息状态 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: message.isUser ? "flex-end" : "space-between",
                  marginTop: "4px",
                  gap: "8px"
                }}>
                  <div style={{
                    fontSize: "12px",
                    opacity: 0.7
                  }}>
                    {formatTime(message.timestamp)}
                  </div>

                  {message.isUser && (
                    <div style={{
                      fontSize: "10px",
                      opacity: 0.7
                    }}>
                      {message.status === 'sending' && '🟡 发送中'}
                      {message.status === 'sent' && '✅ 已发送'}
                      {message.status === 'error' && '❌ 发送失败'}
                    </div>
                  )}
                </div>

                {/* 错误消息 */}
                {message.error && (
                  <div style={{
                    marginTop: "8px",
                    padding: "8px",
                    backgroundColor: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#dc2626"
                  }}>
                    {message.error}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: "16px",
        backgroundColor: "#fff",
        borderTop: "1px solid #e0e0e0"
      }}>
        <div style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end"
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "输入您的问题..." : "连接中，请稍候..."}
            disabled={!isConnected}
            style={{
              flex: 1,
              minHeight: "40px",
              maxHeight: "120px",
              padding: "12px 16px",
              border: "1px solid #e0e0e0",
              borderRadius: "20px",
              fontSize: "14px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              opacity: isConnected ? 1 : 0.6
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !isConnected}
            style={{
              padding: "12px 20px",
              backgroundColor: inputValue.trim() && isConnected ? "#007AFF" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              cursor: inputValue.trim() && isConnected ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            发送
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .markdown-content {
          line-height: 1.6;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.25;
        }

        .markdown-content h1 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 8px;
        }

        .markdown-content h2 {
          font-size: 1.25em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 6px;
        }

        .markdown-content h3 {
          font-size: 1.1em;
        }

        .markdown-content p {
          margin: 8px 0;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }

        .markdown-content li {
          margin: 4px 0;
        }

        .markdown-content code {
          background-color: rgba(175, 184, 193, 0.2);
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.9em;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .markdown-content pre {
          background-color: #f6f8fa;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
          border: 1px solid #e1e4e8;
        }

        .markdown-content pre code {
          background: none;
          padding: 0;
          border-radius: 0;
        }

        .markdown-content blockquote {
          border-left: 4px solid #dfe2e5;
          margin: 16px 0;
          padding-left: 16px;
          color: #6a737d;
          font-style: italic;
        }

        .markdown-content table {
          border-collapse: collapse;
          margin: 16px 0;
          width: 100%;
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid #dfe2e5;
          padding: 8px 12px;
          text-align: left;
        }

        .markdown-content th {
          background-color: #f6f8fa;
          font-weight: 600;
        }

        .markdown-content a {
          color: #0366d6;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }

        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid #eaecef;
          margin: 24px 0;
        }

        /* 复制按钮悬停效果 */
        div[style*="position: relative"]:hover .copy-buttons {
          opacity: 1 !important;
        }

        /* 复制按钮样式优化 */
        .copy-buttons button {
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .copy-buttons button:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
        }
      `}</style>
    </div>
  );
};

// 渲染到页面
export default function App() {
  return <AIChat />;
}

// 确保 DOM 加载完成后再渲染
if (typeof document !== 'undefined') {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('Root element not found');
  }
}