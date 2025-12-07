// frontend/app/(dashboard)/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - SaaS Engine Pro",
};

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


