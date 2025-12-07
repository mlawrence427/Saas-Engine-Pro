// src/routes/module.ai.routes.ts
import { Router } from "express";
import { PlanTier, Module, User } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

import requireAuth from "../middleware/requireAuth";
import { requirePlan } from "../middleware/requirePlan";
import { prisma } from "../lib/prisma"; // if you use a default export, change to: `import prisma from "../lib/prisma";`

const router = Router();

type AuthenticatedRequest = Express.Request & {
  user?: Pick<User, "id" | "plan" | "email"> & Record<string, any>;
};

type GenerateModuleRequestBody = {
  prompt: string;
  // Optional hints to shape the module
  nameHint?: string;
  descriptionHint?: string;
  minPlan?: PlanTier;
};

type GeneratedModuleSpec = {
  name: string;
  description: string;
  minPlan?: PlanTier;
  // Anything else you want to support (config, fields, etc.)
  // config?: Record<string, unknown>;
};

const PLAN_ORDER: PlanTier[] = [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE];
const planRank = (plan: PlanTier) => PLAN_ORDER.indexOf(plan);

const anthropicModel = "claude-3-5-sonnet-latest"; // adjust if you prefer another model

router.post(
  "/ai/generate",
  requireAuth,
  requirePlan(PlanTier.PRO),
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { prompt, nameHint, descriptionHint, minPlan } =
      (req.body as GenerateModuleRequestBody) || {};

    if (!prompt || typeof prompt !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid `prompt` in request body" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY / CLAUDE_API_KEY");
      return res.status(500).json({ message: "AI provider not configured" });
    }

    const anthropic = new Anthropic({ apiKey });

    try {
      // Ask Claude to return a strict JSON spec for the module
      const systemPrompt = `
You generate JSON specs for SaaS "modules".

Return ONLY valid JSON with this shape:

{
  "name": "Short module name",
  "description": "Human-readable description of what this module does",
  "minPlan": "FREE" | "PRO" | "ENTERPRISE" (optional)
}
      `.trim();

      const userPrompt = `
User (plan: ${user.plan}) is asking to generate a new SaaS module.

High-level prompt:
${prompt}

Optional hints:
- Name hint: ${nameHint ?? "none"}
- Description hint: ${descriptionHint ?? "none"}

Return ONLY JSON, no explanation.
      `.trim();

      const msg = await anthropic.messages.create({
        model: anthropicModel,
        max_tokens: 800,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      });

      const textPart = msg.content.find(
        (c) => c.type === "text"
      ) as { type: "text"; text: string } | undefined;

      if (!textPart) {
        return res
          .status(502)
          .json({ message: "AI response did not contain text content" });
      }

      let spec: GeneratedModuleSpec;
      try {
        spec = JSON.parse(textPart.text) as GeneratedModuleSpec;
      } catch (err) {
        console.error("Failed to parse AI JSON response:", textPart.text);
        return res
          .status(502)
          .json({ message: "Failed to parse AI response as JSON" });
      }

      if (!spec.name || !spec.description) {
        return res.status(502).json({
          message: "AI response missing required fields (`name`, `description`)",
        });
      }

      // Use the tighter of: user plan vs AI-suggested minPlan (never exceed user's plan in this route).
      const userPlanRank = planRank(user.plan);
      let finalMinPlan = user.plan;

      if (spec.minPlan && planRank(spec.minPlan) <= userPlanRank) {
        finalMinPlan = spec.minPlan;
      }

      // Create the new module. Adjust fields to match your actual Module schema.
  const newModule: Module = await prisma.module.create({
        data: {
        name: spec.name,
        slug: slugify(spec.name),          // if you added slugify helper
        description: spec.description,
        minPlan: finalMinPlan,
        isActive: true,
        isSystem: false,
        requiresReview: true,              // ✅ AI modules need review by default
        configSchema: null,
        dependencies: [],
        createdById: user.id,              // ✅ track who requested it
  } as any,
});

      // You can also log to AIGenerationLog here if desired.
      // await prisma.aIGenerationLog.create({ ... });

      return res.status(201).json(newModule);
    } catch (err) {
      console.error("Error in /api/modules/ai/generate:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;


