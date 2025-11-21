import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';

// 添加 React 导入检查
if (typeof React === 'undefined') {
  console.error('React is not properly imported');
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data: { success?: boolean; response?: string; error?: string } =
        await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || '',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，发送消息时出现错误，请稍后重试。',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, format: 'markdown' | 'text') => {
    try {
      let contentToCopy = text;

      if (format === 'text') {
        // 移除markdown格式标记
        contentToCopy = text
          .replace(/^#+\s*/gm, '') // 移除标题标记
          .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
          .replace(/\*(.*?)\*/g, '$1') // 移除斜体
          .replace(/`(.*?)`/g, '$1') // 移除行内代码
          .replace(/```[\s\S]*?```/g, '') // 移除代码块
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接
          .replace(/^>\s*/gm, '') // 移除引用标记
          .replace(/^\s*-\s*/gm, '') // 移除列表标记
          .replace(/^\s*\d+\.\s*/gm, '') // 移除有序列表标记
          .trim();
      }

      await navigator.clipboard.writeText(contentToCopy);

      // 显示复制成功提示
      const notification = document.createElement('div');
      notification.textContent = `已复制${
        format === 'markdown' ? 'markdown格式' : '纯文本'
      }内容`;
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
      console.error('复制失败:', error);

      // 显示复制失败提示
      const notification = document.createElement('div');
      notification.textContent = '复制失败，请重试';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
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
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h1
          style={{
            margin: 0,
            color: '#333',
            fontSize: '24px',
            fontWeight: '600',
          }}
        >
          AI 聊天助手
        </h1>
        <p
          style={{
            margin: '4px 0 0 0',
            color: '#666',
            fontSize: '14px',
          }}
        >
          基于 Claude Code 的智能对话系统
        </p>
      </div>

      {/* 消息区域 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#fff',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#666' }}>
              欢迎使用 AI 聊天助手
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              开始对话，体验智能 AI 助手的强大能力
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: message.isUser ? '#007AFF' : '#F0F0F0',
                  color: message.isUser ? '#FFF' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word',
                  position: 'relative',
                }}
              >
                {message.isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: message.isUser
                      ? 'flex-end'
                      : 'space-between',
                    marginTop: '4px',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      opacity: 0.7,
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                  {!message.isUser && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      className="copy-buttons"
                    >
                      <button
                        onClick={() =>
                          copyToClipboard(message.content, 'markdown')
                        }
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          color: '#333',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = 'rgba(255, 255, 255, 1)';
                          button.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = 'rgba(255, 255, 255, 0.9)';
                          button.style.transform = 'scale(1)';
                        }}
                      >
                        📋 MD
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            message.content.replace(/[#*`\[\]]/g, ''),
                            'text'
                          )
                        }
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          color: '#333',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = 'rgba(255, 255, 255, 1)';
                          button.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          const button = e.currentTarget as HTMLButtonElement;
                          button.style.background = 'rgba(255, 255, 255, 0.9)';
                          button.style.transform = 'scale(1)';
                        }}
                      >
                        📝 文本
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: '#F0F0F0',
                color: '#666',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#999',
                    animation: 'pulse 1.5s infinite',
                  }}
                ></div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#999',
                    animation: 'pulse 1.5s infinite 0.5s',
                  }}
                ></div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#999',
                    animation: 'pulse 1.5s infinite 1s',
                  }}
                ></div>
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            value={inputValue}
            onChange={e => {
              const textarea = e.target as HTMLTextAreaElement;
              setInputValue(textarea.value);
            }}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              backgroundColor:
                inputValue.trim() && !isLoading ? '#007AFF' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor:
                inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
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
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('Root element not found');
  }
}
