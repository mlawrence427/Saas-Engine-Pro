"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useState, FormEvent } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  // Wire this to your backend /api/user endpoints later
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      // show toast or something once you add it
    }, 600);
  }

  return (
    <DashboardShell title="Settings">
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div className="space-y-1">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </DashboardShell>
  );
}

