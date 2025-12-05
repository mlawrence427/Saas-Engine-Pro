// backend/src/controllers/ai.controller.ts
import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

export async function chatWithClaude(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      messages: [
        { role: "user", content: message }
      ],
    });

    return res.json({ reply: reply.content[0].text });
  } catch (err) {
    console.error("Claude API Error:", err);
    return res.status(500).json({ error: "AI service is unavailable" });
  }
}
