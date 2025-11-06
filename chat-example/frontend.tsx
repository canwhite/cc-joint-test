import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";

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
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "抱歉，发送消息时出现错误，请稍后重试。",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
          AI 聊天助手
        </h1>
        <p style={{
          margin: "4px 0 0 0",
          color: "#666",
          fontSize: "14px"
        }}>
          基于 Claude Code 的智能对话系统
        </p>
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
            <h3 style={{ margin: "0 0 8px 0", color: "#666" }}>欢迎使用 AI 聊天助手</h3>
            <p style={{ margin: 0, fontSize: "14px" }}>开始对话，体验智能 AI 助手的强大能力</p>
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
                wordWrap: "break-word"
              }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                <div style={{
                  fontSize: "12px",
                  opacity: 0.7,
                  marginTop: "4px",
                  textAlign: message.isUser ? "right" : "left"
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "16px"
          }}>
            <div style={{
              padding: "12px 16px",
              borderRadius: "18px",
              backgroundColor: "#F0F0F0",
              color: "#666"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#999",
                  animation: "pulse 1.5s infinite"
                }}></div>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#999",
                  animation: "pulse 1.5s infinite 0.5s"
                }}></div>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#999",
                  animation: "pulse 1.5s infinite 1s"
                }}></div>
                <span>AI 正在思考...</span>
              </div>
            </div>
          </div>
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
            placeholder="输入您的问题..."
            disabled={isLoading}
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
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: "12px 20px",
              backgroundColor: inputValue.trim() && !isLoading ? "#007AFF" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
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