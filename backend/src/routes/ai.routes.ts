import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

/**
 * POST /api/ai/chat
 * Body: { message: string }
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        { role: "user", content: message }
      ],
    });

    const reply = response.content[0].text;

    return res.json({ reply });
  } catch (err: any) {
    console.error("Claude API Error:", err);
    return res.status(500).json({
      error: "Claude request failed",
      details: err?.message || err,
    });
  }
});

export default router;

