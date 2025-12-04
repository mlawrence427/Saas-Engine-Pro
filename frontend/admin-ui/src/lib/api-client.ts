const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = {
  async post(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async get(path: string) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};
