import { Session, createClientWithPreset } from "@iamqc/cc-session";

// 创建AI聊天服务
class AIChatService {
  private session: Session | null = null;

  async initialize() {
    try {
      const client = createClientWithPreset("development", {
        pathToClaudeCodeExecutable: "/Users/zack/.bun/bin/claude",
      });

      this.session = new Session(client);

      // 订阅会话更新
      this.session.subscribe((session, message) => {
        console.log(`[AI Session] ${message.type}:`, message);
      });

      console.log("AI Chat Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AI Chat Service:", error);
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.session) {
      throw new Error("AI Chat Service not initialized");
    }

    try {
      const result = await this.session.send(message);
      const responseText = result.lastAssistantMessage.content[0].content.text;
      return responseText;
    } catch (error) {
      console.error("Error sending message to AI:", error);
      throw new Error("Failed to get AI response");
    }
  }
}

// 创建AI聊天服务实例
const aiChatService = new AIChatService();

// 启动服务器
Bun.serve({
  //一个端口
  port: 3001,
  //需要一个fetch方法处理路由
  async fetch(req) {
    const url = new URL(req.url);

    // 处理根路径 - 返回HTML页面
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"));
    }

    // 处理API请求
    if (url.pathname === "/api/chat" && req.method === "POST") {
      try {
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
          return new Response(JSON.stringify({ error: "Invalid message" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const response = await aiChatService.sendMessage(message);

        return new Response(
          JSON.stringify({
            success: true,
            response,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error processing chat request:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to process request",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 处理静态文件
    if (url.pathname.startsWith("/static/")) {
      const filePath = "." + url.pathname;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // 处理静态文件 (.js, .css, 图片等)
    if (
      url.pathname.startsWith("/dist/") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css")
    ) {
      const filePath = "." + url.pathname;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "Content-Type": url.pathname.endsWith(".js")
              ? "application/javascript"
              : url.pathname.endsWith(".css")
              ? "text/css"
              : "text/plain",
          },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  // 开发模式配置
  development: {
    hmr: true,
    console: true,
  },
});

// 初始化AI服务
aiChatService.initialize().then(() => {
  console.log("Server running on http://localhost:3001");
});
