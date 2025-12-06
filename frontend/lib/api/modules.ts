// frontend/lib/api/modules.ts
import { ModuleMeta } from "@/types/modules";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function fetchModules(
  accessToken: string
): Promise<ModuleMeta[]> {
  const res = await fetch(`${API_BASE_URL}/api/modules`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to load modules (${res.status})`);
  }

  return res.json();
}
