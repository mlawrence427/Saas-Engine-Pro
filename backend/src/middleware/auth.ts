// backend/src/middleware/auth.ts
// Barrel file that re-exports auth-related middleware so you can do:
//   import { requireAuth, requireRole } from "../middleware/auth";

export { default as requireAuth } from "./requireAuth";
export { default as requireRole } from "./requireRole";
