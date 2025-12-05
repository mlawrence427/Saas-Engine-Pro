// backend/routes/ai.js
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = express.Router();

// Load Claude API key from .env (make sure CLAUDE_API_KEY=xxxxx is set)
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message provided." });
    }

    // Claude 3.5 Sonnet Request
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response?.content?.[0]?.text || "No reply generated.";

    res.json({ reply });

  } catch (err) {
    console.error("Claude API Error:", err);
    res.status(500).json({ reply: "AI Error. Unable to process your request." });
  }
});

export default router;


