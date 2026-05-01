"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PARTICIPANT" | "ORGANIZER">("PARTICIPANT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Не удалось создать аккаунт");
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
        <label className="label">Никнейм</label>
        <input
          className="input mt-2"
          required
          minLength={2}
          maxLength={24}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Пароль</label>
        <input
          className="input mt-2"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Тип аккаунта</label>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {(
            [
              {
                v: "PARTICIPANT",
                t: "Участник",
                d: "Подключаюсь к чужим квизам по коду.",
              },
              {
                v: "ORGANIZER",
                t: "Организатор",
                d: "Создаю свои квизы и провожу их.",
              },
            ] as const
          ).map((r) => {
            const active = role === r.v;
            return (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={cn(
                  "relative rounded-xl border px-4 py-3 text-left transition",
                  active
                    ? "border-flare bg-flare/10 glow-amber"
                    : "border-ink-700 bg-ink-800/70 hover:border-ink-650"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="display text-lg font-semibold">{r.t}</span>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      active ? "bg-flare" : "bg-ink-650"
                    )}
                  />
                </div>
                <div className="mt-1 text-xs text-bone-dim">{r.d}</div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
          {error}
        </div>
      )}
      <button className="btn-primary w-full py-3" disabled={loading}>
        {loading ? "Создаём..." : "Создать аккаунт"}
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
