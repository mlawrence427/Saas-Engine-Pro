// ============================================================
// frontend/lib/api.ts - SaaS Engine Pro
// Typed API Client
// ============================================================

import axios, { AxiosError, AxiosRequestConfig } from "axios";

// ============================================================
// CONFIGURATION
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// ============================================================
// URL HELPER (keeping your original)
// ============================================================

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}

// ============================================================
// TYPES
// ============================================================

// Base API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// User types
export type Role = "USER" | "ADMIN" | "FOUNDER";
export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  email: string;
  role: Role;
  plan: PlanTier;
  createdAt?: string;
  updatedAt?: string;
}

// Module types
export interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minPlan: PlanTier;
  version: number;
  isArchived: boolean;
  publishedAt: string | null;
  publishedByUserId: string | null;
  publishedByUser?: { id: string; email: string } | null;
  sourceAIDraftId: string | null;
  sourceAIDraft?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithAccess extends Module {
  hasAccess: boolean;
}

// AI Draft types
export type AIDraftStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AIDraft {
  id: string;
  title: string;
  description: string | null;
  status: AIDraftStatus;
  schemaPreview: Record<string, unknown> | null;
  routesPreview: Record<string, unknown> | null;
  permissionsPreview: Record<string, unknown> | null;
  targetModuleSlug: string | null;
  createdByUserId: string | null;
  createdByUser?: { id: string; email: string } | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  resultingModules?: Module[];
  createdAt: string;
  updatedAt: string;
}

// Audit Log types
export type AuditAction =
  | "MODULE_CREATED"
  | "MODULE_ARCHIVED"
  | "MODULE_VERSION_CREATED"
  | "MODULE_APPROVED"
  | "MODULE_REJECTED"
  | "PLAN_UPGRADED"
  | "PLAN_DOWNGRADED"
  | "ROLE_CHANGED"
  | "USER_CREATED"
  | "USER_DELETED"
  | "ACCESS_GRANTED"
  | "ACCESS_REVOKED";

export type AuditEntityType = "USER" | "MODULE" | "AIDRAFT" | "SUBSCRIPTION";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  performedByUserId: string | null;
  performedByUser?: { id: string; email: string } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================
// ERROR HANDLING
// ============================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function handleError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    throw new ApiError(
      status,
      data?.error || "API_ERROR",
      data?.message || error.message,
      data
    );
  }
  throw error;
}

// ============================================================
// GENERIC REQUEST HELPER
// ============================================================

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

// ============================================================
// AUTH API
// ============================================================

export const authApi = {
  login: (email: string, password: string) =>
    request<ApiResponse<{ user: User; token: string }>>({
      method: "POST",
      url: "/api/login",
      data: { email, password },
    }),

  register: (email: string, password: string) =>
    request<ApiResponse<{ user: User; token: string }>>({
      method: "POST",
      url: "/api/auth/register",
      data: { email, password },
    }),

  logout: () =>
    request<ApiResponse>({
      method: "POST",
      url: "/api/auth/logout",
    }),

  me: () =>
    request<ApiResponse<{ user: User }>>({
      method: "GET",
      url: "/api/auth/me",
    }),
};

// ============================================================
// MODULES API (Public)
// ============================================================

export const modulesApi = {
  list: () =>
    request<ApiResponse<{ modules: ModuleWithAccess[]; userPlan: PlanTier }>>({
      method: "GET",
      url: "/api/modules",
    }),

  get: (slug: string) =>
    request<ApiResponse<{ module: Module; hasAccess: boolean; requiredPlan: PlanTier | null }>>({
      method: "GET",
      url: `/api/modules/${slug}`,
    }),
};

// ============================================================
// ADMIN MODULES API
// ============================================================

export const adminModulesApi = {
  list: (params?: { includeArchived?: boolean; slug?: string; minPlan?: PlanTier }) =>
    request<ApiResponse<{ modules: Module[] }>>({
      method: "GET",
      url: "/api/admin/modules",
      params,
    }),

  getHistory: (slug: string) =>
    request<ApiResponse<{ slug: string; versions: Module[]; totalVersions: number; currentVersion: number | null }>>({
      method: "GET",
      url: `/api/admin/modules/${slug}/history`,
    }),

  create: (data: { name: string; slug: string; description?: string; minPlan?: PlanTier }) =>
    request<ApiResponse<{ module: Module }>>({
      method: "POST",
      url: "/api/admin/modules",
      data,
    }),

  archive: (id: string) =>
    request<ApiResponse<{ module: Module }>>({
      method: "DELETE",
      url: `/api/admin/modules/${id}/archive`,
    }),
};

// ============================================================
// ADMIN AI DRAFTS API
// ============================================================

export const adminAIDraftsApi = {
  list: (params?: { status?: AIDraftStatus } & PaginationParams) =>
    request<ApiResponse<{ drafts: AIDraft[]; pagination: { total: number; limit: number; offset: number } }>>({
      method: "GET",
      url: "/api/admin/ai-modules",
      params,
    }),

  get: (id: string) =>
    request<ApiResponse<{ draft: AIDraft }>>({
      method: "GET",
      url: `/api/admin/ai-modules/${id}`,
    }),

  approve: (id: string, reviewNote?: string) =>
    request<ApiResponse<{ module: Module; draft: AIDraft; isNewModule: boolean; previousVersion: number | null }>>({
      method: "POST",
      url: `/api/admin/ai-modules/${id}/approve`,
      data: { reviewNote },
    }),

  reject: (id: string, reviewNote: string) =>
    request<ApiResponse<{ draft: AIDraft }>>({
      method: "POST",
      url: `/api/admin/ai-modules/${id}/reject`,
      data: { reviewNote },
    }),
};

// ============================================================
// ADMIN USERS API
// ============================================================

export const adminUsersApi = {
  list: (params?: { role?: Role; plan?: PlanTier } & PaginationParams) =>
    request<ApiResponse<{ users: User[]; pagination: { total: number; limit: number; offset: number } }>>({
      method: "GET",
      url: "/api/admin/users",
      params,
    }),

  updateRole: (id: string, role: Role) =>
    request<ApiResponse<{ user: User }>>({
      method: "PATCH",
      url: `/api/admin/users/${id}/role`,
      data: { role },
    }),

  updatePlan: (id: string, plan: PlanTier) =>
    request<ApiResponse<{ user: User }>>({
      method: "PATCH",
      url: `/api/admin/users/${id}/plan`,
      data: { plan },
    }),
};

// ============================================================
// ADMIN AUDIT LOGS API
// ============================================================

export const adminAuditLogsApi = {
  list: (params?: {
    action?: AuditAction;
    entityType?: AuditEntityType;
    entityId?: string;
    performedByUserId?: string;
    startDate?: string;
    endDate?: string;
  } & PaginationParams) =>
    request<ApiResponse<{ logs: AuditLog[]; pagination: { total: number; limit: number; offset: number } }>>({
      method: "GET",
      url: "/api/admin/audit-logs",
      params,
    }),

  getByEntity: (entityType: AuditEntityType, entityId: string) =>
    request<ApiResponse<{ entityType: AuditEntityType; entityId: string; logs: AuditLog[]; totalLogs: number }>>({
      method: "GET",
      url: `/api/admin/audit-logs/entity/${entityType}/${entityId}`,
    }),

  getByUser: (userId: string, params?: PaginationParams) =>
    request<ApiResponse<{ user: { id: string; email: string }; logs: AuditLog[]; pagination: { total: number; limit: number; offset: number } }>>({
      method: "GET",
      url: `/api/admin/audit-logs/user/${userId}`,
      params,
    }),

  getStats: () =>
    request<ApiResponse<{ totalLogs: number; last24Hours: number; last7Days: number; byAction: Record<AuditAction, number> }>>({
      method: "GET",
      url: "/api/admin/audit-logs/stats",
    }),
};

// ============================================================
// EXPORT ALL
// ============================================================

export const api = {
  auth: authApi,
  modules: modulesApi,
  admin: {
    modules: adminModulesApi,
    aiDrafts: adminAIDraftsApi,
    users: adminUsersApi,
    auditLogs: adminAuditLogsApi,
  },
};

export default api;