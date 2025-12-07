// frontend/app/admin/modules/new/page.tsx
import { ModuleForm } from "../ModuleForm";

export default function NewModulePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Module</h1>
      <ModuleForm mode="create" />
    </div>
  );
}