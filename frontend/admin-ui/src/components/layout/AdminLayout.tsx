import React from "react";
import { Link } from "react-router-dom";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

        <nav className="space-y-3">
          <Link to="/dashboard" className="block hover:text-blue-600">
            Dashboard
          </Link>
          <Link to="/users" className="block hover:text-blue-600">
            Users
          </Link>
          <Link to="/billing" className="block hover:text-blue-600">
            Billing
          </Link>
          <Link to="/settings" className="block hover:text-blue-600">
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}
