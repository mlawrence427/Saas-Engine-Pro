// backend/src/routes/ai.routes.ts

import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

// ============================================================
// 1) CHAT ENDPOINT — POST /api/ai/chat
// ============================================================

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const reply = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    return res.json({
      reply: reply.content[0].text,
    });
  } catch (err) {
    console.error("Claude Chat Error:", err);
    return res.status(500).json({ error: "AI chat failed" });
  }
});

// ============================================================
// 2) DOCUMENT ANALYZER — POST /api/ai/analyze
// ============================================================

router.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const reply = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analyze this text:\n\n${text}`,
        },
      ],
    });

    return res.json({
      analysis: reply.content[0].text,
    });
  } catch (err) {
    console.error("Claude Analyze Error:", err);
    return res.status(500).json({ error: "AI analysis failed" });
  }
});

// ===== EXPORT ROUTER =====
export default router;

