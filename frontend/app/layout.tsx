import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "SaaS Engine Pro",
  description: "A universal SaaS starter kit for launching any online product faster.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
