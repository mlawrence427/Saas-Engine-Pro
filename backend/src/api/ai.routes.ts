// src/api/ai.routes.ts

import { Router } from "express";
import { Anthropic } from "@anthropic-ai/sdk";

const router = Router();

// Load Claude API key
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Send message to Claude 3.5 Sonnet
    const completion = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = completion.content[0].text;

    res.json({ reply });
  } catch (error: any) {
    console.error("Claude API Error:", error);
    res.status(500).json({
      error: "Claude API error",
      details: error?.message,
    });
  }
});

export default router;
