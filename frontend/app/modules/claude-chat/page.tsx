"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ClaudeChatModulePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMsg: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, newMsg];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/modules/claude-chat/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you rely on cookies/JWT, no need to set Authorization here
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const reply = data.reply as string;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (err: any) {
      setError(err.message ?? "Chat request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Claude Chat</h1>
        <p className="text-sm text-neutral-500">
          Premium AI chat module powered by Claude. This is running through the
          SaaS Engine module system.
        </p>
      </header>

      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 h-72 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-neutral-400">
              Start a conversation with Claude…
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-neutral-900 text-white"
                  : "mr-auto bg-neutral-100 text-neutral-900"
              }`}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="mr-auto max-w-[80%] rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
              Claude is thinking…
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="Ask Claude anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>

        {error && (
          <p className="mt-2 text-xs text-red-500">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  );
}
