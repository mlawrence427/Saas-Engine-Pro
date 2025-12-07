// backend/src/modules/claude-chat/routes.ts
import { Router, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey:
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    "", // must be set in env
});

interface ClientMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function createClaudeChatRouter(): Router {
  const router = Router();

  // POST /api/modules/claude-chat/chat
  router.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { messages } = req.body as { messages: ClientMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (!anthropic.apiKey) {
      return res.status(500).json({
        error: "Claude API key is not configured on the server",
      });
    }

    try {
      // Separate system vs regular messages for Anthropic
      const systemMessages = messages.filter((m) => m.role === "system");
      const chatMessages = messages.filter(
        (m) => m.role === "user" || m.role === "assistant"
      );

      const systemPrompt =
        systemMessages.map((m) => m.content).join("\n\n") ||
        `You are Claude running inside SaaS Engine Pro for user ${user.email ?? user.id}. Be concise and helpful.`;

      // Map messages into Anthropic format
      const anthropicMessages = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })) as Anthropic.Messages.MessageParam["messages"];

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 512,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const textBlock = response.content.find(
        (c) => c.type === "text"
      ) as Anthropic.Messages.TextBlock | undefined;

      const reply = textBlock?.text ?? "[Claude returned no content]";

      return res.json({
        reply,
        model: response.model,
        usage: response.usage,
      });
    } catch (err: any) {
      console.error("[claude-chat] error", err);
      return res.status(500).json({
        error: "Claude chat failed",
        details: err?.message ?? String(err),
      });
    }
  });

  return router;
}

export default createClaudeChatRouter;

