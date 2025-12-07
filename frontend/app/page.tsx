// ============================================================
// frontend/app/page.tsx - SaaS Engine Pro
// Home / Landing Page
// ============================================================

"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// HOME PAGE
// ============================================================

export default function HomePage() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-white">SaaS Engine Pro</span>
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-9 bg-gray-800 rounded-lg animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/modules"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <span>🚀</span>
            <span>AI-Governed SaaS Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Build your SaaS with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              AI-powered modules
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            AI generates modules, humans approve them, customers subscribe.
            Governance-first, monetization-first, production-ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                href="/modules"
                className="px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors text-lg"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors text-lg"
                >
                  Start for Free →
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors text-lg"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything you need to scale
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A complete operating system for building, governing, and monetizing your SaaS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🤖"
              title="AI-Generated Modules"
              description="AI creates module proposals with schemas, routes, and permissions. You review and approve."
            />
            <FeatureCard
              icon="🛡️"
              title="Governance First"
              description="Complete audit trail for every action. Role-based access control. Nothing deploys without approval."
            />
            <FeatureCard
              icon="💳"
              title="Built-in Monetization"
              description="Plan-based module gating. Stripe integration. Upgrade flows that just work."
            />
            <FeatureCard
              icon="📦"
              title="Module Versioning"
              description="Soft deletes, version history, and rollback capability. Never lose your work."
            />
            <FeatureCard
              icon="👥"
              title="User Management"
              description="Roles, plans, and permissions out of the box. Scale from solo to enterprise."
            />
            <FeatureCard
              icon="📊"
              title="Audit Logs"
              description="Track every module creation, approval, plan change, and role update. Compliance ready."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From AI proposal to production in three steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="AI Generates"
              description="Describe what you need. AI creates a complete module draft with schema, routes, and permissions."
            />
            <StepCard
              number={2}
              title="Admin Reviews"
              description="Review the proposal, check the previews, add notes. Approve or reject with full audit trail."
            />
            <StepCard
              number={3}
              title="Users Subscribe"
              description="Module goes live. Users on the right plan get instant access. Monetization flows automatically."
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              plan="Free"
              price="$0"
              description="For getting started"
              features={[
                "Access to free modules",
                "Basic support",
                "Community access",
              ]}
            />
            <PricingCard
              plan="Pro"
              price="$29"
              description="For growing teams"
              features={[
                "All free modules",
                "Pro modules unlocked",
                "Priority support",
                "Analytics dashboard",
              ]}
              highlighted
            />
            <PricingCard
              plan="Enterprise"
              price="$99"
              description="For serious builders"
              features={[
                "All modules unlocked",
                "AI content generation",
                "Dedicated support",
                "Custom integrations",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of developers building with SaaS Engine Pro
          </p>
          {isAuthenticated ? (
            <Link
              href="/modules"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors text-lg"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors text-lg"
            >
              Get Started for Free →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="font-bold text-white">SaaS Engine Pro</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>

            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} SaaS Engine Pro
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function PricingCard({
  plan,
  price,
  description,
  features,
  highlighted = false,
}: {
  plan: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted
          ? "bg-blue-600/10 border-blue-500/50"
          : "bg-[#111111] border-gray-800"
      }`}
    >
      <p
        className={`text-sm font-medium mb-1 ${
          highlighted ? "text-blue-400" : "text-gray-400"
        }`}
      >
        {plan}
      </p>
      <p className="text-3xl font-bold text-white mb-1">
        {price}
        <span className="text-sm font-normal text-gray-500">/mo</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-green-400">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}


