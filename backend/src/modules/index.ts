// backend/src/modules/index.ts
import fs from "fs";
import path from "path";
import express, { Express, Router, Response, NextFunction } from "express";
import { ModuleManifest, RegisteredModule, AuthenticatedRequest } from "./types";

const MODULES_DIR = __dirname; // backend/src/modules

let loadedModules: RegisteredModule[] = [];

// -------------- Loader --------------

export function loadModules(): RegisteredModule[] {
  if (loadedModules.length > 0) return loadedModules;

  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });

  loadedModules = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const moduleDir = path.join(MODULES_DIR, entry.name);
      const manifestPath = path.join(moduleDir, "module.json");

      if (!fs.existsSync(manifestPath)) {
        return null;
      }

      const raw = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(raw) as ModuleManifest;

      if (!manifest.key || !manifest.name) {
        console.warn(`Module ${entry.name} has invalid manifest, skipping`);
        return null;
      }

      return {
        manifest,
        moduleDir,
      } as RegisteredModule;
    })
    .filter(Boolean) as RegisteredModule[];

  return loadedModules;
}

// -------------- Subscription gating --------------

function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function subscriptionGate(manifest: ModuleManifest) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = user.plan ?? "none";
    const status = (user.subscriptionStatus ?? "none") as string;

    if (!manifest.allowedPlans.includes(plan)) {
      return res.status(403).json({
        error: "Insufficient plan",
        reason: "plan_not_allowed",
        requiredPlans: manifest.allowedPlans,
        currentPlan: plan,
      });
    }

    if (manifest.isPremium && status !== "active" && status !== "trialing") {
      return res.status(403).json({
        error: "Subscription inactive",
        reason: "subscription_inactive",
        subscriptionStatus: status,
      });
    }

    return next();
  };
}

// -------------- Module router mounting --------------

function loadModuleRouter(moduleDir: string): Router {
  // Convention: each module has routes.ts exporting default Router or createRouter()
  //   backend/src/modules/<key>/routes.ts
  const routesPath = path.join(moduleDir, "routes");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(routesPath);

  if (typeof mod === "function") {
    return mod() as Router;
  }

  if (mod.default && typeof mod.default === "function") {
    return mod.default() as Router;
  }

  if (mod.router) {
    return mod.router as Router;
  }

  throw new Error(
    `Module at ${moduleDir} must export a default Router, a createRouter() function, or router`
  );
}

export function registerModules(app: Express) {
  const modules = loadModules();

  // Meta router for listing modules
  const metaRouter = express.Router();

  metaRouter.get(
    "/",
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.user!;
      const plan = user.plan ?? "none";
      const status = (user.subscriptionStatus ?? "none") as string;

      const available = modules.filter(({ manifest }) => {
        const planAllowed = manifest.allowedPlans.includes(plan);
        const subOk =
          !manifest.isPremium ||
          status === "active" ||
          status === "trialing";

        return planAllowed && subOk;
      });

      res.json(
        available.map(({ manifest }) => ({
          key: manifest.key,
          name: manifest.name,
          description: manifest.description,
          version: manifest.version,
          basePath: manifest.basePath,
          isPremium: !!manifest.isPremium,
        }))
      );
    }
  );

  app.use("/api/modules", metaRouter);

  // Mount each module's Router under /api/modules/:key
  modules.forEach(({ manifest, moduleDir }) => {
    const router = loadModuleRouter(moduleDir);

    const baseMount = `/api/modules/${manifest.key}`;

    app.use(
      baseMount,
      requireAuth,
      subscriptionGate(manifest),
      router
    );

    console.log(
      `[modules] Mounted module "${manifest.key}" at ${baseMount}${manifest.basePath}`
    );
  });
}
