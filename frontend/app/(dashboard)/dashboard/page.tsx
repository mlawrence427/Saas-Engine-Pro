"use client";

import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>You must log in first.</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
