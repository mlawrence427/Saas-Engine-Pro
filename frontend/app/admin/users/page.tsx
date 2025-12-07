// ============================================================
// frontend/app/admin/users/page.tsx - SaaS Engine Pro
// Admin User Management
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User, Role, PlanTier } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// CONSTANTS
// ============================================================

const ROLE_OPTIONS: Role[] = ["USER", "ADMIN", "FOUNDER"];
const PLAN_OPTIONS: PlanTier[] = ["FREE", "PRO", "ENTERPRISE"];
const PAGE_SIZE = 20;

// ============================================================
// USERS PAGE
// ============================================================

export default function AdminUsersPage() {
  const { user: currentUser, isFounder } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, offset: 0 });

  // Filters
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [planFilter, setPlanFilter] = useState<PlanTier | "ALL">("ALL");

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role>("USER");
  const [editPlan, setEditPlan] = useState<PlanTier>("FREE");
  const [saving, setSaving] = useState(false);

  // ----------------------------------------------------------
  // Fetch users
  // ----------------------------------------------------------
  const fetchUsers = async (offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        role?: Role;
        plan?: PlanTier;
        limit: number;
        offset: number;
      } = {
        limit: PAGE_SIZE,
        offset,
      };

      if (roleFilter !== "ALL") {
        params.role = roleFilter;
      }

      if (planFilter !== "ALL") {
        params.plan = planFilter;
      }

      const res = await api.admin.users.list(params);

      setUsers(res.data?.users || []);
      setPagination({
        total: res.data?.pagination.total || 0,
        offset,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0);
  }, [roleFilter, planFilter]);

  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------
  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - PAGE_SIZE);
    fetchUsers(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + PAGE_SIZE;
    if (newOffset < pagination.total) {
      fetchUsers(newOffset);
    }
  };

  const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);

  // ----------------------------------------------------------
  // Edit handlers
  // ----------------------------------------------------------
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPlan(user.plan);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      setError(null);

      // Update role if changed (only founders can do this)
      if (editRole !== editingUser.role) {
        if (!isFounder) {
          setError("Only founders can change user roles");
          return;
        }
        await api.admin.users.updateRole(editingUser.id, editRole);
      }

      // Update plan if changed
      if (editPlan !== editingUser.plan) {
        await api.admin.users.updatePlan(editingUser.id, editPlan);
      }

      // Refresh list
      await fetchUsers(pagination.offset);
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">
          Manage user roles and subscription plans
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Plan Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Plan:</span>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as PlanTier | "ALL")}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Plans</option>
            {PLAN_OPTIONS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <span className="text-sm text-gray-500 ml-auto">
          {pagination.total} user{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error State */}
      {error && !editingUser && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-[#111111] rounded-xl border border-gray-800 divide-y divide-gray-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">👥</span>
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        /* Users Table */
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                  User
                </th>
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                  Role
                </th>
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                  Plan
                </th>
                <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                  Joined
                </th>
                <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <PlanBadge plan={user.plan} />
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/audit-logs?entityType=USER&entityId=${user.id}`}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Audit Log
                      </Link>
                      <button
                        onClick={() => openEditModal(user)}
                        disabled={user.id === currentUser?.id}
                        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.id === currentUser?.id ? "Cannot edit yourself" : "Edit user"}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Showing {pagination.offset + 1}–{Math.min(pagination.offset + PAGE_SIZE, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + PAGE_SIZE >= pagination.total}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeEditModal}
          />

          {/* Modal */}
          <div className="relative bg-[#111111] border border-gray-800 rounded-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Edit User</h2>
            <p className="text-gray-400 text-sm mb-6">{editingUser.email}</p>

            {/* Error in modal */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Role Select */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Role
                  {!isFounder && (
                    <span className="text-yellow-500 ml-2">(Founder only)</span>
                  )}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  disabled={!isFounder}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  USER: Basic access • ADMIN: Manage modules • FOUNDER: Full control
                </p>
              </div>

              {/* Plan Select */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as PlanTier)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Manual override. Stripe webhooks will sync automatically.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (editRole === editingUser.role && editPlan === editingUser.plan)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BADGE COMPONENTS
// ============================================================

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    USER: "bg-gray-500/20 text-gray-400",
    ADMIN: "bg-blue-500/20 text-blue-400",
    FOUNDER: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[role]}`}>
      {role}
    </span>
  );
}

function PlanBadge({ plan }: { plan: PlanTier }) {
  const styles: Record<PlanTier, string> = {
    FREE: "bg-gray-500/20 text-gray-400",
    PRO: "bg-blue-500/20 text-blue-400",
    ENTERPRISE: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[plan]}`}>
      {plan}
    </span>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}