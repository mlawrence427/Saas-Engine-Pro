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
import { useToast } from "@/components/ui/use-toast";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = React.useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const next = searchParams.get("next") || "/dashboard";

  const handleChange =
    (field: keyof RegisterFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Email and password are required.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Backend should create user & set auth cookies.
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          password: form.password,
        }),
      });

      if (!response.ok) {
        let message = "Registration failed.";
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
          title: "Could not create account",
          description: message,
        });
        return;
      }

      toast({
        title: "Account created",
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
            Create your founder console
          </h1>
          <p className="text-sm text-slate-400">
            Spin up governed SaaS modules with AI — safely.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Create account</CardTitle>
            <CardDescription>
              We’ll create a new SaaS Engine Pro workspace for you.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Alex Founder"
                  value={form.name}
                  onChange={handleChange("name")}
                  disabled={isSubmitting}
                  className="bg-slate-950/80 border-slate-800 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={isSubmitting}
                  className="bg-slate-950/80 border-slate-800 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
                {isSubmitting ? "Creating workspace..." : "Create account"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <span>Already have an account?</span>
              <Link
                href="/login"
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}