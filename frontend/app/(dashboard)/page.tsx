"use client";

import React from "react";
import AuthGuard from "../../components/auth/AuthGuard";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <main
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.name ?? user?.email}</p>

          <button
            onClick={logout}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
          >
            Logout
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
