// backend/src/routes/module.ai.routes.ts
import { Router } from "express";
import { Anthropic } from "@anthropic-ai/sdk"; // or OpenAI, whatever you're using
import prisma from "../lib/prisma";
import requireAuth from "../middleware/requireAuth";
import requirePlan from "../middleware/requirePlan";
import { PlanTier } from "@prisma/client";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

router.post(
  "/generate",
  requireAuth,
  requirePlan(PlanTier.PRO), // only Pro can generate new modules
  async (req, res) => {
    try {
      const user = (req as any).user;
      const { prompt } = req.body as { prompt: string };

      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      // 1) Ask AI to suggest module metadata
      const ai = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `You are helping define SaaS dashboard modules.

User prompt: "${prompt}"

Return ONLY valid JSON with keys: name, slug, description.
Example: {"name":"Tasks","slug":"tasks","description":"Task tracking module"}`,
          },
        ],
      });

      const text =
        ai.content[0].type === "text" ? ai.content[0].text ?? "" : "";

      let generated: { name: string; slug: string; description?: string };
      try {
        generated = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse AI JSON", text);
        return res
          .status(500)
          .json({ error: "AI response invalid, try again later" });
      }

      if (!generated.name || !generated.slug) {
        return res
          .status(400)
          .json({ error: "AI did not return valid module metadata" });
      }

      // 2) Create module in DB
      const module = await prisma.module.create({
        data: {
          name: generated.name,
          slug: generated.slug,
          description: generated.description ?? "",
          // default plan requirement for AI modules: PRO
          minPlan: PlanTier.PRO,
          isActive: true,
          createdById: user.id,
        },
      });

      // 3) Give this user explicit access, just in case
      await prisma.moduleAccess.create({
        data: {
          userId: user.id,
          moduleId: module.id,
          canUse: true,
        },
      });

      return res.status(201).json(module);
    } catch (err: any) {
      console.error("AI module generation error", err);
      return res
        .status(500)
        .json({ error: err?.message ?? "Failed to generate module" });
    }
  }
);

export default router;

