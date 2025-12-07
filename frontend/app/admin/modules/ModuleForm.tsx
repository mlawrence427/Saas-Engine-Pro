// frontend/app/admin/modules/ModuleForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export type ModuleFormValues = {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  minPlan: PlanTier;
  enabled: boolean;
  defaultConfig?: string; // JSON in textarea
};

type Props = {
  initialValues?: ModuleFormValues;
  mode: "create" | "edit";
  moduleId?: string;
};

const planOptions: PlanTier[] = ["FREE", "PRO", "ENTERPRISE"];

export function ModuleForm({ initialValues, mode, moduleId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ModuleFormValues>(
    initialValues ?? {
      key: "",
      name: "",
      description: "",
      category: "",
      icon: "",
      minPlan: "FREE",
      enabled: true,
      defaultConfig: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ModuleFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let defaultConfigParsed: any | undefined = undefined;
      if (values.defaultConfig && values.defaultConfig.trim().length > 0) {
        try {
          defaultConfigParsed = JSON.parse(values.defaultConfig);
        } catch {
          throw new Error("Default config must be valid JSON");
        }
      }

      const payload: any = {
        key: values.key,
        name: values.name,
        description: values.description || undefined,
        category: values.category || undefined,
        icon: values.icon || undefined,
        minPlan: values.minPlan,
        enabled: values.enabled,
        defaultConfig: defaultConfigParsed,
      };

      const endpoint =
        mode === "create"
          ? apiUrl("/api/admin/modules")
          : apiUrl(`/api/admin/modules/${moduleId}`);

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save module");
      }

      router.push("/admin/modules");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-xl">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-1">
        <label className="text-sm font-medium">Key</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={values.key}
          onChange={(e) => handleChange("key", e.target.value)}
          placeholder="analytics-dashboard"
          disabled={mode === "edit"} // keep key immutable
          required
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier used in code, must be stable.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={values.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={values.category ?? ""}
            onChange={(e) => handleChange("category", e.target.value)}
            placeholder="analytics, billing, team..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Icon</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={values.icon ?? ""}
            onChange={(e) => handleChange("icon", e.target.value)}
            placeholder="BarChart3 or URL"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Minimum Plan</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={values.minPlan}
            onChange={(e) =>
              handleChange("minPlan", e.target.value as PlanTier)
            }
          >
            {planOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input
            id="enabled"
            type="checkbox"
            checked={values.enabled}
            onChange={(e) => handleChange("enabled", e.target.checked)}
          />
          <label htmlFor="enabled" className="text-sm">
            Enabled
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Default Config (JSON, optional)
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-xs font-mono"
          rows={6}
          value={values.defaultConfig ?? ""}
          onChange={(e) => handleChange("defaultConfig", e.target.value)}
          placeholder={`{\n  "showWelcome": true\n}`}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create Module" : "Save Changes"}
        </button>

        <button
          type="button"
          className="text-sm text-muted-foreground"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
