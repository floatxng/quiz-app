"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { cn } from "@/lib/cn";
import { Tally } from "@/components/Brand";
import type {
  ClientToServerEvents,
  FinalResult,
  LobbyParticipant,
  PublicQuestion,
  QuestionResult,
  ServerToClientEvents,
} from "@/lib/realtime/types";

type S = Socket<ServerToClientEvents, ClientToServerEvents>;

export default function HostClient({
  code,
  userId,
  quizTitle,
  totalQuestions,
}: {
  code: string;
  userId: string;
  quizTitle: string;
  totalQuestions: number;
}) {
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [status, setStatus] = useState<"lobby" | "running" | "finished">(
    "lobby"
  );
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [final, setFinal] = useState<FinalResult | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef<S | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const s: S = io({ path: "/socket.io" });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("join:host", { code, userId }, (r) => {
        if (!r.ok) console.warn(r.error);
      });
    });

    s.on("lobby:state", (st) => {
      setParticipants(st.participants);
      setStatus(st.status as typeof status);
    });
    s.on("quiz:question", (q) => {
      setQuestion(q);
      setResult(null);
      setFinal(null);
      setAnsweredCount(0);
      setStatus("running");
    });
    s.on("quiz:result", (r) => setResult(r));
    s.on("quiz:final", (f) => {
      setFinal(f);
      setStatus("finished");
    });
    s.on("host:answers", ({ answeredCount }) => setAnsweredCount(answeredCount));

    return () => {
      s.disconnect();
    };
  }, [code, userId]);

  const remaining = useMemo(() => {
    if (!question) return 0;
    return Math.max(
      0,
      question.timeLimit - Math.floor((now - question.startedAt) / 1000)
    );
  }, [question, now]);

  const live = status === "running";

  return (
    <div className="space-y-6 rise">
      <header className="stage relative px-7 py-7">
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              {live ? (
                <Tally variant="live" label="Идёт" />
              ) : status === "finished" ? (
                <Tally variant="off" label="Завершён" />
              ) : (
                <Tally variant="ready" label="Готов к старту" />
              )}
            </div>
            <h1 className="display mt-3 text-2xl font-semibold leading-tight">
              {quizTitle}
            </h1>
            <div className="mono mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint">
              {totalQuestions.toString().padStart(2, "0")} вопросов
            </div>
          </div>

          <div className="text-center">
            <div className="mono text-[0.6rem] uppercase tracking-[0.32em] text-bone-faint">
              Код для участников
            </div>
            <div className="mono mt-1 select-all text-[2.6rem] font-semibold tracking-[0.32em] text-bone">
              {code}
            </div>
          </div>

          <div className="text-right">
            <div className="mono text-[0.6rem] uppercase tracking-[0.32em] text-bone-faint">
              В лобби
            </div>
            <div className="display mt-0.5 text-4xl font-semibold tabular-nums text-flare">
              {participants.length.toString().padStart(2, "0")}
            </div>
            <div className="mono text-[0.6rem] uppercase tracking-[0.28em] text-bone-faint">
              {participants.length === 1 ? "участник" : "участников"}
            </div>
          </div>
        </div>
      </header>

      {status === "lobby" && (
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Лобби</span>
            <span className="mono text-[0.6rem] uppercase tracking-[0.22em] text-bone-faint">
              Поделитесь кодом, чтобы они подключились
            </span>
          </div>
          <div className="mt-5 min-h-[3rem]">
            {participants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-700 px-5 py-8 text-center">
                <div className="display-italic text-xl text-bone-dim">
                  Никто ещё не подключился.
                </div>
                <div className="mono mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-bone-faint">
                  Скажите им: «зайдите на /play и введите {code}»
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full border border-ink-650 bg-ink-800 px-3.5 py-1.5 text-sm"
                  >
                    {p.nickname}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="btn-primary px-5 py-3"
              onClick={() => socketRef.current?.emit("host:next")}
              disabled={participants.length === 0}
            >
              ▶ Старт ({totalQuestions} вопр.)
            </button>
            <button
              className="btn-ghost"
              onClick={() => socketRef.current?.emit("host:finish")}
            >
              Завершить
            </button>
          </div>
        </div>
      )}

      {status !== "lobby" && question && !final && (
        <>
          <TimerBar
            total={question.timeLimit}
            remaining={remaining}
            revealed={!!result}
          />

          <div className="card space-y-5">
            <div className="flex items-baseline justify-between text-bone-dim">
              <span className="mono text-[0.7rem] uppercase tracking-[0.28em] text-flare">
                Вопрос {(question.index + 1).toString().padStart(2, "0")} /{" "}
                {question.total.toString().padStart(2, "0")}
              </span>
              <span className="mono text-[0.7rem] uppercase tracking-[0.28em]">
                {result ? "Раскрыто" : `Осталось ${remaining}c`}
              </span>
            </div>
            <h2 className="display text-3xl font-semibold leading-[1.05]">
              {question.text}
            </h2>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt=""
                className="max-h-72 rounded-lg border border-ink-700"
              />
            )}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {question.options.map((o, i) => {
                const isCorrect = result?.correctOptionIds.includes(o.id);
                const count = result?.perOptionCounts[o.id] ?? 0;
                return (
                  <div
                    key={o.id}
                    className={cn(
                      "relative overflow-hidden rounded-xl border px-5 py-4 transition",
                      result
                        ? isCorrect
                          ? "border-mint/60 bg-mint/[0.08] glow-mint"
                          : "border-ink-700 bg-ink-800/60 opacity-65"
                        : "border-ink-700 bg-ink-800/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="display-italic text-2xl leading-none text-bone-dim">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="text-[0.95rem] text-bone">{o.text}</span>
                      </div>
                      {result && (
                        <span
                          className={cn(
                            "mono shrink-0 text-2xl tabular-nums",
                            isCorrect ? "text-mint" : "text-bone-faint"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                    {result && (
                      <div
                        className={cn(
                          "mt-3 h-0.5 w-full overflow-hidden rounded-full bg-ink-700"
                        )}
                      >
                        <div
                          className={cn(
                            "h-full transition-all",
                            isCorrect ? "bg-mint" : "bg-bone-faint"
                          )}
                          style={{
                            width:
                              participants.length > 0
                                ? `${(count / Math.max(1, participants.length)) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 pt-4 text-sm">
              <span className="mono text-[0.7rem] uppercase tracking-[0.22em] text-bone-faint">
                Ответили{" "}
                <span className="text-bone">{answeredCount}</span> из{" "}
                <span className="text-bone">{participants.length}</span>
              </span>
              <div className="flex gap-2">
                {!result && (
                  <button
                    className="btn-ghost"
                    onClick={() => socketRef.current?.emit("host:reveal")}
                  >
                    Показать ответ
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => socketRef.current?.emit("host:next")}
                >
                  {question.index + 1 >= question.total
                    ? "К итогам →"
                    : "Следующий →"}
                </button>
              </div>
            </div>
          </div>

          {result && <Leaderboard rows={result.leaderboard} />}
        </>
      )}

      {final && (
        <>
          <div className="card relative overflow-hidden text-center">
            <div className="pointer-events-none absolute inset-0 barber opacity-30" />
            <div className="relative">
              <div className="eyebrow">Финал</div>
              <h2 className="display mt-3 text-4xl font-semibold">
                Итоги
              </h2>
              <p className="lead mt-2 text-base">
                Поздравляем всех. Особенно лидера.
              </p>
            </div>
          </div>
          <Leaderboard rows={final.leaderboard} podium />
        </>
      )}
    </div>
  );
}

function TimerBar({
  total,
  remaining,
  revealed,
}: {
  total: number;
  remaining: number;
  revealed: boolean;
}) {
  const pct = revealed
    ? 100
    : Math.max(0, Math.min(100, (remaining / total) * 100));
  const danger = !revealed && remaining <= 5;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.6rem]">
        <span className="mono uppercase tracking-[0.28em] text-bone-faint">
          Таймер вопроса
        </span>
        <span
          className={cn(
            "mono uppercase tracking-[0.28em]",
            danger ? "text-ember" : "text-bone-faint"
          )}
        >
          {revealed ? "Раскрыто" : `${remaining}c / ${total}c`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
        <div
          className={cn(
            "h-full transition-[width] duration-300 ease-linear",
            revealed
              ? "bg-mint"
              : danger
                ? "bg-ember"
                : "bg-gradient-to-r from-flare to-flare-soft"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Leaderboard({
  rows,
  podium = false,
}: {
  rows: {
    participantId: string;
    nickname: string;
    score: number;
    delta: number;
  }[];
  podium?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Лидерборд</span>
        <span className="mono text-[0.6rem] uppercase tracking-[0.22em] text-bone-faint">
          {rows.length.toString().padStart(2, "0")} участн.
        </span>
      </div>
      <ol className="mt-4 space-y-1.5">
        {rows.map((r, i) => {
          const top = i === 0;
          return (
            <li
              key={r.participantId}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 transition",
                top
                  ? "border-flare/55 bg-flare/[0.07]"
                  : i < 3 && podium
                    ? "border-ink-650 bg-ink-800"
                    : "border-ink-700 bg-ink-850"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "mono w-7 text-right text-lg tabular-nums",
                    top ? "text-flare" : "text-bone-dim"
                  )}
                >
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-base",
                    top ? "display font-semibold" : ""
                  )}
                >
                  {r.nickname}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                {r.delta > 0 && (
                  <span className="mono text-xs text-mint">
                    +{r.delta}
                  </span>
                )}
                <span className="mono text-xl tabular-nums">{r.score}</span>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="text-center text-sm text-bone-faint">
            Пока нет участников
          </li>
        )}
      </ol>
    </div>
  );
}
