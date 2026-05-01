"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewQuizForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Не удалось создать");
      return;
    }
    const j = await res.json();
    router.push(`/dashboard/quiz/${j.id}`);
  }

  if (!open) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-dashed border-ink-650 bg-ink-850/40 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">Создание</span>
            <div className="display mt-1.5 text-xl">
              Создайте новый квиз
            </div>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary px-5 py-3">
            + Новый квиз
          </button>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-flare/10 blur-3xl" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Новый квиз</span>
        <button
          type="button"
          className="btn-quiet text-xs"
          onClick={() => setOpen(false)}
        >
          Отмена
        </button>
      </div>
      <div>
        <label className="label">Название</label>
        <input
          className="input mt-2"
          required
          autoFocus
          placeholder="Например, «Ретро-IT-полигон»"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Описание (по желанию)</label>
        <textarea
          className="input mt-2"
          rows={2}
          placeholder="Что за квиз и для кого"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <div className="text-sm text-ember">{error}</div>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1 py-3" disabled={loading}>
          {loading ? "Создаём..." : "Создать →"}
        </button>
      </div>
    </form>
  );
}
