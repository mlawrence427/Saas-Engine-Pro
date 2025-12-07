// frontend/app/admin/modules/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { ModuleForm, ModuleFormValues } from "../ModuleForm";
import type { PlanTier } from "../ModuleForm";

type ModuleResponse = {
  module: {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    category?: string | null;
    icon?: string | null;
    minPlan: PlanTier;
    enabled: boolean;
    defaultConfig?: any;
  };
};

export default function EditModulePage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [initialValues, setInitialValues] = useState<ModuleFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchModule = async () => {
      try {
        const res = await fetch(apiUrl(`/api/admin/modules/${id}`), {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to load module");
        }
        const data: ModuleResponse = await res.json();

        const m = data.module;
        const values: ModuleFormValues = {
          key: m.key,
          name: m.name,
          description: m.description ?? "",
          category: m.category ?? "",
          icon: m.icon ?? "",
          minPlan: m.minPlan,
          enabled: m.enabled,
          defaultConfig: m.defaultConfig
            ? JSON.stringify(m.defaultConfig, null, 2)
            : "",
        };

        setInitialValues(values);
      } catch (err: any) {
        setError(err.message ?? "Error loading module");
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [id]);

  if (!id) {
    return <p className="text-sm text-red-500">Missing module id.</p>;
  }

  if (loading) {
    return <p>Loading module…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!initialValues) {
    return <p className="text-sm text-red-500">Module not found.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Module</h1>
      <ModuleForm
        mode="edit"
        moduleId={id}
        initialValues={initialValues}
      />
    </div>
  );
}
