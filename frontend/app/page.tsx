import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, ShieldCheck, LineChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="px-4 py-10 sm:px-8 lg:px-16 xl:px-32">
      <section className="max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sep-border bg-sep-card px-3 py-1 text-xs text-sep-muted mb-4">
          <Sparkles className="w-3 h-3 text-sep-primary" />
          <span>Introducing SaaS Engine Pro</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
          Ship your SaaS in weeks,{" "}
          <span className="text-sep-primary">not months.</span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-sep-muted max-w-2xl mx-auto">
          SaaS Engine Pro gives you a production-ready React + Node stack with auth, billing,
          admin tools, and AI-friendly architecture. You bring the idea, it brings the engine.
        </p>

        <div className="flex justify-center gap-3 pt-4">
          <Link href="/auth/register">
            <Button>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">Log In</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-12 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-2">
            <ShieldCheck className="w-6 h-6 text-sep-primary" />
            <h2 className="font-semibold text-sm">Auth & Roles</h2>
            <p className="text-xs text-sep-muted">
              Email/password auth, JWT, and role-based access patterns wired for production.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <LineChart className="w-6 h-6 text-sep-primary" />
            <h2 className="font-semibold text-sm">Stripe Billing</h2>
            <p className="text-xs text-sep-muted">
              Subscription-ready billing with Stripe for recurring revenue from day one.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <Sparkles className="w-6 h-6 text-sep-primary" />
            <h2 className="font-semibold text-sm">AI-Native</h2>
            <p className="text-xs text-sep-muted">
              Clear, modular codebase designed to be read and extended by tools like ChatGPT,
              Claude, and Gemini.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

