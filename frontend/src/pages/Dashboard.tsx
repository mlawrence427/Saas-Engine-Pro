import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      <p>Welcome, {user?.email}</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
