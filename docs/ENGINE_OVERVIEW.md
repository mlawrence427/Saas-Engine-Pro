# SaaS Engine Pro – Overview

SaaS Engine Pro is a production-ready starter for building modular SaaS products.

It gives you:

- A modern full-stack setup (Next.js 14 + Express + Prisma + PostgreSQL)
- Authentication and JWT cookie sessions
- Stripe billing and plan management
- A module system with plan gating and per-user overrides
- AI-powered module generation
- An admin module registry for governance and control

---

## 1. What is SaaS Engine Pro?

SaaS Engine Pro is a **SaaS engine**, not just a boilerplate.

Instead of shipping a single hard-coded app, you get a **module platform**:

- Each feature lives as a `Module` in the database.
- Modules are gated by plan (FREE / PRO / ENTERPRISE).
- Modules can be turned on/off, reviewed, and versioned.
- Modules can be created manually or generated via AI.

This lets you:

- Launch your first SaaS quickly.
- Gradually add new features as modules.
- Reuse the same engine for multiple products.

---

## 2. How do modules work?

### Module Model

Each module has metadata like:

- `name` – human-readable name
- `slug` – unique identifier used in code and URLs
- `description` – what the module does
- `minPlan` – minimum plan required (FREE, PRO, ENTERPRISE)
- `isActive` – whether the module is currently offered
- `isSystem` – core engine modules that are harder to remove
- `requiresReview` – whether an admin must approve it before users see it
- `version` – semantic version string
- `dependencies` – other module IDs this module depends on
- `createdById` – who created the module

### Visibility Rules

For a given user:

A module is visible if:

1. It is `isActive = true`
2. The user meets the plan requirement (`user.plan >= module.minPlan`)
3. The module is **reviewed** (`requiresReview = false`)  
   – unless the user is an **ADMIN**
4. OR there is a `ModuleAccess` override granting access for that user

This gives you:

- Global gating via `minPlan`
- Per-user exceptions via `ModuleAccess`
- Safety via `requiresReview` for AI-generated or experimental modules

---

## 3. How do plans gate features?

Plan gating is enforced in the backend via an ordered enum:

- `FREE`
- `PRO`
- `ENTERPRISE`

When fetching modules for a user:

- The engine compares `module.minPlan` with `user.plan`.
- If `module.minPlan <= user.plan`, the module is eligible.
- If the user is on a lower plan, the module is hidden.
- Admins can override via `ModuleAccess`.

On the frontend:

- The dashboard only shows modules returned from `/api/modules`.
- The admin module registry controls which modules are active and which plans they require.

This means **billing and features stay in sync**:

- Stripe → updates `user.plan`
- Engine → automatically includes/excludes modules for that plan

---

## 4. How does the AI module generator help?

SaaS Engine Pro includes an AI route:

`POST /api/modules/ai/generate`

- Only available to PRO (or higher) users.
- Uses Anthropic (Claude) to generate a JSON spec for a new module:
  - `name`
  - `description`
  - (optional) `minPlan`
- The backend:
  - Validates the response
  - Creates a `Module` record
  - Marks it `requiresReview = true`
  - Associates it with the creator via `createdById`

### Governance and Safety

- **Unreviewed modules** (`requiresReview = true`) are hidden from non-admin users.
- Admins can see them in the **Module Registry**.
- Admins can:
  - Adjust metadata (min plan, description, version)
  - Toggle `isActive`
  - Mark `requiresReview = false` to approve

This gives you:

- Rapid iteration with AI help
- A safety net via admin review
- A clear audit trail of who created what

---

## 5. The Module Registry (Admin UI)

The admin registry at:

`/dashboard/admin/modules`

lets admins:

- Create modules manually
- View all modules (name, slug, plan, flags)
- Change `minPlan`
- Toggle `isActive`
- Mark modules as reviewed
- See system vs non-system modules

It is protected by:

- Frontend guard (admin-only view)
- Backend guard (`requireAuth` + `requireAdmin`)

This is the control center for your SaaS engine.

---

## 6. Typical Workflow

1. **Launch**
   - Create core system modules manually (e.g. “Dashboard”, “Analytics”).
   - Set up plan gating for each module.

2. **Add Features**
   - Use the AI route to generate candidate modules.
   - Review them in the registry.
   - Approve and assign them to plans.

3. **Customize per Customer**
   - Use `ModuleAccess` to grant extra modules to specific users or organizations.
   - Optionally introduce tenant-level overrides later.

4. **Iterate**
   - Bump module `version` as you ship major changes.
   - Use `dependencies` to represent feature relationships.

This pattern scales nicely from a solo founder MVP up to a more complex SaaS business.
