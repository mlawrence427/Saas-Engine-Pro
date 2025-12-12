// frontend/app/login/page.tsx
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

type LoginFormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = React.useState<LoginFormState>({
    email: "user@test.com",
    password: "password",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const next = searchParams.get("next") || "/dashboard";

  const handleChange = (field: keyof LoginFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.email || !form.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.message || "Invalid credentials. Please try again.";
        setErrorMessage(message);
        return;
      }

      // Successful login → redirect
      router.push(next);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Unexpected error while logging in.");
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
            Sign in to your control plane
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Govern AI-generated modules, plans, and users from a single OS.
          </p>
        </div>

        <Card className="bg-slate-950/60 border-slate-800 text-slate-50">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the SaaS Engine Pro console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
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
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-xs text-slate-400">
            <span>New to SaaS Engine Pro?</span>
            <Link
              href="/register"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

