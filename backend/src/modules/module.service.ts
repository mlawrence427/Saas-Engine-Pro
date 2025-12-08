// src/modules/module.service.ts
// Stubbed for compilation - not implemented in this phase

export const moduleService = {
  async getModules() {
    throw new Error('Not implemented');
  },

  async getModuleBySlug(_slug: string) {
    throw new Error('Not implemented');
  },

  async enableModule(_userId: string, _moduleId: string) {
    throw new Error('Not implemented');
  },

  async disableModule(_userId: string, _moduleId: string) {
    throw new Error('Not implemented');
  },

  async getUserModules(_userId: string) {
    throw new Error('Not implemented');
  },
};

/**
 * Named export to satisfy:
 *   import { listModulesForUser } from "../modules/module.service";
 *
 * Accepts either:
 *   - a userId string, or
 *   - an object with at least an `id` field, plus optional plan/role.
 */
export const listModulesForUser = async (
  user: string | { id: string; plan?: unknown; role?: unknown }
) => {
  const userId = typeof user === 'string' ? user : user.id;
  return moduleService.getUserModules(userId);
};

export default moduleService;


