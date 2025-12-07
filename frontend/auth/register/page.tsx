"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e: any) {
    e.preventDefault();

    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      router.push("/login");
    } else {
      alert(data.message || "Registration failed");
    }
  }

  return (
    <div style={{ padding: 50, color: "#fff" }}>
      <h1>Register</h1>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}
