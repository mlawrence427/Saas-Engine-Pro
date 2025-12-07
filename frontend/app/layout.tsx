// ============================================================
// frontend/app/layout.tsx - SaaS Engine Pro
// Root Layout with All Providers
// ============================================================

import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider, Toaster } from "@/components/ui/Toaster";

// ============================================================
// FONT
// ============================================================

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: {
    default: "SaaS Engine Pro",
    template: "%s | SaaS Engine Pro",
  },
  description: "AI-Governed SaaS Operating System. Build, govern, and monetize your SaaS with AI-powered modules.",
  keywords: ["saas", "ai", "modules", "governance", "subscription", "platform"],
  authors: [{ name: "SaaS Engine Pro" }],
  creator: "SaaS Engine Pro",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SaaS Engine Pro",
    title: "SaaS Engine Pro",
    description: "AI-Governed SaaS Operating System",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Engine Pro",
    description: "AI-Governed SaaS Operating System",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ============================================================
// VIEWPORT
// ============================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

// ============================================================
// ROOT LAYOUT
// ============================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0a] text-[#fafafa] min-h-screen">
        <ToastProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}



