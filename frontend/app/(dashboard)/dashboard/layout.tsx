// frontend/app/(dashboard)/dashboard/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard | SaaS Engine Pro",
  description: "SaaS Engine Pro boilerplate / engine",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Just wrap dashboard content – AuthProvider is already in the root layout
  return <>{children}</>;
}







