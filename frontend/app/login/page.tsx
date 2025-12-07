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
import { useToast } from "@/components/ui/use-toast";

type LoginFormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = React.useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const next = searchParams.get("next") || "/dashboard";

  const handleChange = (field: keyof LoginFormState) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Backend should set auth cookies via Set-Cookie.
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!response.ok) {
        let message = "Invalid credentials or login failed.";
        try {
          const data = await response.json();
          if (data?.error || data?.message) {
            message = data.error || data.message;
          }
        } catch {
          // ignore parse error
        }

        toast({
          variant: "destructive",
          title: "Login failed",
          description: message,
        });
        return;
      }

      // Optimistic UI: assume cookie is set and move to dashboard.
      toast({
        title: "Welcome back",
        description: "You’re now signed in to SaaS Engine Pro.",
      });

      router.push(next);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Network error",
        description:
          "We couldn’t reach the server. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            SaaS Engine Pro
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to your control plane
          </h1>
          <p className="text-sm text-slate-400">
            Govern AI-generated modules, plans, and users from a single OS.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Login</CardTitle>
            <CardDescription>
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
                  placeholder="founder@company.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={isSubmitting}
                  className="bg-slate-950/80 border-slate-800 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {/* Hook up forgot-password route later */}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  disabled={isSubmitting}
                  className="bg-slate-950/80 border-slate-800 focus-visible:ring-sky-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <span>New to SaaS Engine Pro?</span>
              <Link
                href="/register"
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                Create an account
              </Link>
            </div>
            {next && next !== "/dashboard" && (
              <p className="text-xs text-slate-500">
                You’ll be redirected to{" "}
                <span className="font-mono text-slate-300">{next}</span> after
                login.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}