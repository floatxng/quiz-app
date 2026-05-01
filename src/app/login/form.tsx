"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Не удалось войти");
      return;
    }
    const j = await res.json();
    router.push(j.role === "ORGANIZER" ? "/dashboard" : "/me");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label">Email</label>
        <input
          className="input mt-2"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Пароль</label>
        <input
          className="input mt-2"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-md border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
          {error}
        </div>
      )}
      <button className="btn-primary w-full py-3" disabled={loading}>
        {loading ? "Входим..." : "Войти"}
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
