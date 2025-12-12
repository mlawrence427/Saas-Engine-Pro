// frontend/app/register/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = React.useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const next = searchParams.get("next") || "/dashboard";

  const handleChange = (field: keyof RegisterFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name || !form.email || !form.password) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    // 🧪 DEMO-ONLY: fake success, no backend call
    try {
      setIsSubmitting(true);

      // Simulate a short network delay for realism
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to login (or straight to dashboard if you prefer)
      router.push(`/login?next=${encodeURIComponent(next)}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Unexpected error while creating your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center space-y-2">
          <p className="text-xs tracking-[0.35em] text-slate-400 uppercase">
            SaaS Engine Pro
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-50">
            Create your control plane account
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Set up an owner account to manage AI modules, users, and plans.
          </p>
        </div>

        <Card className="bg-slate-950/60 border-slate-800 text-slate-50">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription className="text-slate-400">
              This creates an admin account inside your self-hosted control
              plane. (Demo: this step is simulated.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="••••••••"
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-red-400 mt-2">{errorMessage}</p>
              )}

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-slate-400">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

