// 基础联合测试：cc-session 返回 JSON，cc-json-parser 解析
import {
  Session,
  SessionManager,
  createClientWithPreset,
} from "@iamqc/cc-session";
import { JSONParser } from "@iamqc/cc-json-parser";

async function finalTest() {
  // Create a client with development preset and specify Claude Code executable path
  const client = createClientWithPreset("development", {
    pathToClaudeCodeExecutable: "/Users/zack/.bun/bin/claude",
  });

  // Create a session
  const session = new Session(client);

  // Subscribe to session updates
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

  // Send a message
  const result = await session.send(`
      分析当前项目，然后返回json
      json结构是：
      {
        target:"项目目的",
        main_structure:"主体结构"
      }  
    `);
  console.log("--Response:", result.lastAssistantMessage.content);
  const responseText = result.lastAssistantMessage.content[0].content.text;
  console.log("--Response text:", responseText);

  // Create parser instance and extract JSON from markdown code block

  const extractedData = await JSONParser.extractJSON(responseText);
  console.log("--Extracted JSON:", extractedData);
}

finalTest();
