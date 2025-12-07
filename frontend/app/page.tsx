// frontend/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>SaaS Engine Pro</h1>
      <p>Start by logging in or registering.</p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link href="/auth/login">Login</Link>
        <Link href="/auth/register">Register</Link>
      </div>
    </main>
  );
}



