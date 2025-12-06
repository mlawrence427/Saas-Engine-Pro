// backend/src/modules/claude-chat/routes.ts
import { Router, Response } from "express";
import type { AuthenticatedRequest } from "../types";
// If you already use Anthropic SDK, import and wire here

function createClaudeChatRouter(): Router {
  const router = Router();

  // POST /api/modules/claude-chat/chat
  router.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { messages } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    try {
      // TODO: Wire real Claude call here
      // Example stub:
      const lastUserMessage =
        [...messages]
          .reverse()
          .find((m) => m.role === "user")?.content ?? "Hello";

      const fakeReply = `Claude (stub): I received your message: "${lastUserMessage}". Replace this with a real Claude API call.`;

      return res.json({
        reply: fakeReply,
      });
    } catch (err) {
      console.error("[claude-chat] error", err);
      return res.status(500).json({ error: "Claude chat failed" });
    }
  });

  return router;
}

export default createClaudeChatRouter;
