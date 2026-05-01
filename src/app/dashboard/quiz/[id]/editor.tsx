"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type Option = { id?: string; text: string; isCorrect: boolean };
type Question = {
  id?: string;
  text: string;
  imageUrl: string | null;
  type: "single" | "multiple";
  timeLimit: number;
  points: number;
  options: Option[];
};

const blankQuestion = (): Question => ({
  text: "",
  imageUrl: null,
  type: "single",
  timeLimit: 20,
  points: 1000,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

export default function QuizEditor({
  quizId,
  initialQuestions,
}: {
  quizId: string;
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length ? initialQuestions : []
  );
  const [active, setActive] = useState<number>(initialQuestions.length ? 0 : -1);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function update(idx: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(qIdx: number, oIdx: number, patch: Partial<Option>) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIdx ? { ...o, ...patch } : o
              ),
            }
          : q
      )
    );
  }

  function setSingleCorrect(qIdx: number, oIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) => ({ ...o, isCorrect: j === oIdx })),
            }
          : q
      )
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, blankQuestion()]);
    setActive(questions.length);
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    setActive((a) => Math.max(0, a - 1));
  }

  function addOption(qIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
          : q
      )
    );
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== oIdx) }
          : q
      )
    );
  }

  async function onUpload(qIdx: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return;
    const j = await res.json();
    update(qIdx, { imageUrl: j.url });
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/quizzes/${quizId}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    }
  }

  const q = active >= 0 ? questions[active] : null;
  const totalPoints = questions.reduce((acc, qq) => acc + qq.points, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="card sticky top-24 h-fit space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Вопросы</span>
          <span className="mono text-[0.65rem] uppercase tracking-[0.22em] text-bone-faint">
            {questions.length.toString().padStart(2, "0")} шт.
          </span>
        </div>

        <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {questions.map((qq, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                i === active
                  ? "border-flare/60 bg-flare/8"
                  : "border-ink-700 bg-ink-800/60 hover:border-ink-650"
              )}
            >
              <span
                className={cn(
                  "mono mt-0.5 text-[0.7rem] tracking-[0.2em]",
                  i === active ? "text-flare" : "text-bone-faint"
                )}
              >
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">
                  {qq.text || (
                    <span className="italic text-bone-faint">(без текста)</span>
                  )}
                </span>
                <span className="mono mt-0.5 block text-[0.6rem] uppercase tracking-[0.2em] text-bone-faint">
                  {qq.timeLimit}c · {qq.points}
                </span>
              </span>
            </button>
          ))}
          {questions.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-700 px-3 py-6 text-center text-xs text-bone-faint">
              Пока пусто
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-ink-700 pt-4">
          <button onClick={addQuestion} className="btn-ghost w-full">
            + Добавить вопрос
          </button>
          <button
            onClick={save}
            disabled={saving || questions.length === 0}
            className="btn-primary w-full"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
          <div className="flex items-center justify-between text-[0.62rem] text-bone-faint">
            <span className="mono uppercase tracking-[0.22em]">
              Сумма
            </span>
            <span className="mono text-bone">{totalPoints} очк.</span>
          </div>
          {savedAt && (
            <div className="mono text-center text-[0.6rem] uppercase tracking-[0.22em] text-mint">
              ✓ Сохранено в {savedAt}
            </div>
          )}
        </div>
      </aside>

      <section className="space-y-5">
        {!q ? (
          <div className="card text-center">
            <div className="display-italic text-2xl text-bone-dim">
              Здесь пусто.
            </div>
            <p className="mt-2 text-sm text-bone-faint">
              Добавьте первый вопрос слева.
            </p>
          </div>
        ) : (
          <>
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="mono text-[0.65rem] uppercase tracking-[0.28em] text-flare">
                    Вопрос № {(active + 1).toString().padStart(2, "0")}
                  </span>
                  <h3 className="display mt-1 text-2xl font-semibold">
                    {q.text || (
                      <span className="display-italic text-bone-dim">
                        Введите текст вопроса
                      </span>
                    )}
                  </h3>
                </div>
                <button
                  className="btn-quiet text-xs hover:text-ember"
                  onClick={() => removeQuestion(active)}
                >
                  Удалить вопрос
                </button>
              </div>

              <div>
                <label className="label">Текст вопроса</label>
                <textarea
                  className="input mt-2"
                  rows={2}
                  value={q.text}
                  onChange={(e) => update(active, { text: e.target.value })}
                  placeholder="Например: Какой протокол использует Socket.IO?"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Тип</label>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg border border-ink-700 bg-ink-850 p-1">
                    {(
                      [
                        { v: "single", t: "Один" },
                        { v: "multiple", t: "Неск." },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => update(active, { type: o.v })}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-xs font-medium transition",
                          q.type === o.v
                            ? "bg-flare text-ink-900"
                            : "text-bone-dim hover:text-bone"
                        )}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Время, сек</label>
                  <input
                    className="input input-mono mt-2 text-center"
                    type="number"
                    min={5}
                    max={120}
                    value={q.timeLimit}
                    onChange={(e) =>
                      update(active, {
                        timeLimit: Math.max(5, +e.target.value || 20),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Очки</label>
                  <input
                    className="input input-mono mt-2 text-center"
                    type="number"
                    min={100}
                    step={100}
                    value={q.points}
                    onChange={(e) =>
                      update(active, {
                        points: Math.max(100, +e.target.value || 1000),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Иллюстрация (по желанию)</label>
                <div className="mt-2 flex items-center gap-3">
                  <label className="btn-ghost cursor-pointer text-xs">
                    Загрузить
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && onUpload(active, e.target.files[0])
                      }
                    />
                  </label>
                  {q.imageUrl && (
                    <button
                      type="button"
                      className="btn-quiet text-xs"
                      onClick={() => update(active, { imageUrl: null })}
                    >
                      Убрать
                    </button>
                  )}
                </div>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="mt-3 max-h-48 rounded-lg border border-ink-700"
                  />
                )}
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Варианты ответа</span>
                <span className="mono text-[0.6rem] uppercase tracking-[0.22em] text-bone-faint">
                  {q.options.filter((o) => o.isCorrect).length} прав. ·{" "}
                  {q.options.length} всего
                </span>
              </div>

              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 transition",
                      o.isCorrect
                        ? "border-mint/40 bg-mint/[0.06]"
                        : "border-ink-700 bg-ink-850"
                    )}
                  >
                    <span className="display-italic w-6 text-xl text-bone-dim">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      className="input flex-1 border-transparent bg-transparent px-2 focus:border-transparent focus:bg-transparent focus:ring-0"
                      placeholder={`Вариант ${i + 1}`}
                      value={o.text}
                      onChange={(e) =>
                        updateOption(active, i, { text: e.target.value })
                      }
                    />
                    <label
                      className={cn(
                        "mono flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] transition",
                        o.isCorrect
                          ? "border-mint/50 bg-mint/10 text-mint"
                          : "border-ink-650 text-bone-faint hover:text-bone"
                      )}
                    >
                      {q.type === "single" ? (
                        <input
                          type="radio"
                          name={`correct-${active}`}
                          checked={o.isCorrect}
                          onChange={() => setSingleCorrect(active, i)}
                          className="hidden"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={o.isCorrect}
                          onChange={(e) =>
                            updateOption(active, i, {
                              isCorrect: e.target.checked,
                            })
                          }
                          className="hidden"
                        />
                      )}
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          o.isCorrect ? "bg-mint" : "bg-ink-650"
                        )}
                      />
                      Верно
                    </label>
                    <button
                      type="button"
                      className="btn-quiet text-xs"
                      onClick={() => removeOption(active, i)}
                      disabled={q.options.length <= 2}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-ghost w-full text-xs"
                onClick={() => addOption(active)}
              >
                + Добавить вариант
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
