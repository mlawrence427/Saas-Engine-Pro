// backend/src/modules/types.ts
import type { Request } from "express";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | "none"
  | string;

export interface ModuleManifest {
  key: string; // unique slug, e.g. "claude-chat"
  name: string;
  description: string;
  version: string;
  basePath: string; // mounted under /api/modules/:key + basePath
  allowedPlans: string[]; // e.g. ["founders", "pro-founders"]
  isPremium?: boolean;
}

export interface RegisteredModule {
  manifest: ModuleManifest;
  // Path to the folder, used for dynamic requires if needed
  moduleDir: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  plan?: string | null;
  subscriptionStatus?: SubscriptionStatus | null;
}

// Extend your existing Request type with user (assuming auth middleware already sets this)
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
