"use client";

import { useEffect, useRef, useState } from "react";
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

type View =
  | { kind: "joining" }
  | { kind: "lobby"; participants: LobbyParticipant[] }
  | {
      kind: "question";
      q: PublicQuestion;
      submitted: boolean;
      selected: Set<string>;
    }
  | { kind: "result"; r: QuestionResult }
  | { kind: "final"; f: FinalResult }
  | { kind: "error"; message: string };

export default function PlayClient({
  code,
  userId,
  quizTitle,
}: {
  code: string;
  userId: string | null;
  quizTitle: string;
}) {
  const [view, setView] = useState<View>({ kind: "joining" });
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef<S | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const nickname =
      (typeof window !== "undefined" &&
        sessionStorage.getItem(`qa.nick.${code}`)) ||
      "";
    if (!nickname) {
      window.location.replace(`/play?code=${code}`);
      return;
    }

    const s: S = io({ path: "/socket.io" });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("join:participant", { code, nickname, userId }, (r) => {
        if (!r.ok) {
          setView({
            kind: "error",
            message: r.error || "Не удалось присоединиться",
          });
          return;
        }
        setParticipantId(r.participantId!);
      });
    });

    s.on("lobby:state", (st) => {
      setView((v) =>
        v.kind === "question" || v.kind === "result"
          ? v
          : { kind: "lobby", participants: st.participants }
      );
    });

    s.on("quiz:question", (q) => {
      setView({ kind: "question", q, submitted: false, selected: new Set() });
    });
    s.on("quiz:result", (r) => setView({ kind: "result", r }));
    s.on("quiz:final", (f) => setView({ kind: "final", f }));

    return () => {
      s.disconnect();
    };
  }, [code, userId]);

  function toggle(opt: string) {
    setView((v) => {
      if (v.kind !== "question" || v.submitted) return v;
      const next = new Set(v.selected);
      if (v.q.type === "single") {
        next.clear();
        next.add(opt);
      } else {
        if (next.has(opt)) next.delete(opt);
        else next.add(opt);
      }
      return { ...v, selected: next };
    });
  }

  function submit() {
    setView((v) => {
      if (v.kind !== "question") return v;
      socketRef.current?.emit("answer:submit", {
        optionIds: [...v.selected],
      });
      return { ...v, submitted: true };
    });
  }

  if (view.kind === "joining")
    return (
      <CenterCard>
        <Tally variant="ready" />
        <span>Подключаемся к комнате…</span>
      </CenterCard>
    );

  if (view.kind === "error")
    return (
      <CenterCard error>
        <Tally variant="off" />
        <span>{view.message}</span>
      </CenterCard>
    );

  if (view.kind === "lobby") {
    return (
      <div className="space-y-6 rise">
        <RoomHeader code={code} title={quizTitle} status="waiting" />
        <div className="card">
          <div className="text-center">
            <div className="display-italic text-2xl text-bone-dim">
              Ждём старта
            </div>
            <div className="mono mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-bone-faint">
              Не закрывайте вкладку
            </div>
          </div>
          <div className="mt-6">
            <div className="eyebrow mb-2">В лобби</div>
            <div className="flex flex-wrap gap-2">
              {view.participants.map((p) => (
                <span
                  key={p.id}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition",
                    p.id === participantId
                      ? "border-flare bg-flare/10 text-bone"
                      : "border-ink-700 bg-ink-800 text-bone-dim"
                  )}
                >
                  {p.nickname}
                  {p.id === participantId && (
                    <span className="mono ml-2 text-[0.55rem] uppercase tracking-[0.22em] text-flare">
                      вы
                    </span>
                  )}
                </span>
              ))}
              {view.participants.length === 0 && (
                <span className="text-xs text-bone-faint">
                  пока никого нет
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === "question") {
    const remaining = Math.max(
      0,
      view.q.timeLimit - Math.floor((now - view.q.startedAt) / 1000)
    );
    const danger = remaining <= 5;
    const pct = Math.max(
      0,
      Math.min(100, (remaining / view.q.timeLimit) * 100)
    );
    return (
      <div className="space-y-5 rise">
        <RoomHeader code={code} title={quizTitle} status="live" />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[0.6rem]">
            <span className="mono uppercase tracking-[0.28em] text-bone-faint">
              Таймер
            </span>
            <span
              className={cn(
                "mono uppercase tracking-[0.28em]",
                danger ? "text-ember" : "text-bone-faint"
              )}
            >
              {remaining}c
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className={cn(
                "h-full transition-[width] duration-300 ease-linear",
                danger ? "bg-ember" : "bg-gradient-to-r from-flare to-flare-soft"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="card space-y-5">
          <div className="flex items-baseline justify-between text-bone-dim">
            <span className="mono text-[0.65rem] uppercase tracking-[0.28em] text-flare">
              Вопрос {(view.q.index + 1).toString().padStart(2, "0")} /{" "}
              {view.q.total.toString().padStart(2, "0")}
            </span>
            <span className="mono text-[0.65rem] uppercase tracking-[0.22em]">
              {view.q.type === "multiple" ? "Несколько ответов" : "Один ответ"}
            </span>
          </div>
          <h2 className="display text-2xl font-semibold leading-[1.1] sm:text-3xl">
            {view.q.text}
          </h2>
          {view.q.imageUrl && (
            <img
              src={view.q.imageUrl}
              alt=""
              className="mx-auto max-h-72 rounded-lg border border-ink-700"
            />
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {view.q.options.map((o, i) => {
              const active = view.selected.has(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  disabled={view.submitted}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border px-5 py-4 text-left transition-all",
                    active
                      ? "border-flare bg-flare/10 glow-amber"
                      : "border-ink-700 bg-ink-800/70 hover:border-ink-600 hover:bg-ink-750",
                    view.submitted && !active && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "display-italic text-2xl leading-none transition-colors",
                          active ? "text-flare" : "text-bone-dim group-hover:text-bone"
                        )}
                      >
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className="text-base text-bone">{o.text}</span>
                    </div>
                    {active && (
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full bg-flare",
                          "shadow-[0_0_12px_rgba(244,183,60,0.7)]"
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={submit}
            disabled={
              view.submitted || view.selected.size === 0 || remaining <= 0
            }
            className={cn(
              "w-full py-3 text-base",
              view.submitted ? "btn-ghost" : "btn-primary"
            )}
          >
            {view.submitted ? "✓ Ответ принят" : "Ответить"}
            {!view.submitted && <span aria-hidden>→</span>}
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === "result") {
    const me = view.r.leaderboard.find(
      (e) => e.participantId === participantId
    );
    const correct = (me?.delta ?? 0) > 0;
    return (
      <div className="space-y-5 rise">
        <RoomHeader code={code} title={quizTitle} status="reveal" />
        <div className="card relative overflow-hidden text-center">
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 -top-24 h-48 blur-3xl",
              correct ? "bg-mint/20" : "bg-ember/15"
            )}
          />
          <div className="relative">
            <div
              className={cn(
                "eyebrow",
                correct ? "text-mint" : "text-ember"
              )}
            >
              {correct ? "Правильно" : "Мимо"}
            </div>
            {me ? (
              <>
                <div
                  className={cn(
                    "burst display mt-3 text-6xl font-semibold tabular-nums",
                    correct ? "text-mint" : "text-bone-dim"
                  )}
                >
                  {me.delta > 0 ? `+${me.delta}` : "0"}
                </div>
                <div className="mono mt-2 text-[0.62rem] uppercase tracking-[0.28em] text-bone-faint">
                  Всего:{" "}
                  <span className="text-bone">{me.score}</span>
                </div>
              </>
            ) : (
              <div className="mt-2 text-bone-dim">
                Ожидание следующего вопроса…
              </div>
            )}
          </div>
        </div>
        <Leaderboard rows={view.r.leaderboard} highlight={participantId} />
      </div>
    );
  }

  if (view.kind === "final") {
    const me = view.f.leaderboard.findIndex(
      (e) => e.participantId === participantId
    );
    return (
      <div className="space-y-5 rise">
        <RoomHeader code={code} title={quizTitle} status="off" />
        <div className="card relative overflow-hidden text-center">
          <div className="pointer-events-none absolute inset-0 barber opacity-25" />
          <div className="relative">
            <div className="eyebrow">Финал</div>
            <div className="display mt-3 text-3xl font-semibold sm:text-4xl">
              Спасибо за игру.
            </div>
            {me >= 0 && (
              <div className="mono mt-3 text-[0.7rem] uppercase tracking-[0.28em] text-bone-faint">
                Вы на{" "}
                <span className="display-italic text-2xl text-flare not-italic">
                  {me + 1} месте
                </span>
              </div>
            )}
          </div>
        </div>
        <Leaderboard
          rows={view.f.leaderboard}
          highlight={participantId}
          podium
        />
      </div>
    );
  }

  return null;
}

function CenterCard({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "card mx-auto flex max-w-md items-center justify-center gap-3 text-sm",
        error ? "border-ember/40 text-ember" : "text-bone-dim"
      )}
    >
      {children}
    </div>
  );
}

function RoomHeader({
  code,
  title,
  status,
}: {
  code: string;
  title: string;
  status: "waiting" | "live" | "reveal" | "off";
}) {
  const tally =
    status === "live"
      ? { variant: "live" as const, label: "Идёт" }
      : status === "reveal"
        ? { variant: "ready" as const, label: "Ответ" }
        : status === "waiting"
          ? { variant: "ready" as const, label: "Ожидание" }
          : { variant: "off" as const, label: "Завершён" };

  return (
    <div className="stage relative px-5 py-4 sm:px-7">
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <Tally {...tally} />
          <div className="display mt-2 text-lg font-semibold">{title}</div>
        </div>
        <div className="text-right">
          <div className="mono text-[0.55rem] uppercase tracking-[0.32em] text-bone-faint">
            Комната
          </div>
          <div className="mono mt-0.5 text-2xl font-semibold tracking-[0.32em] text-bone">
            {code}
          </div>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({
  rows,
  highlight,
  podium = false,
}: {
  rows: {
    participantId: string;
    nickname: string;
    score: number;
    delta: number;
  }[];
  highlight?: string | null;
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
          const isMe = r.participantId === highlight;
          const isTop = i === 0 && podium;
          return (
            <li
              key={r.participantId}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 transition",
                isMe
                  ? "border-flare/55 bg-flare/[0.07]"
                  : isTop
                    ? "border-mint/40 bg-mint/[0.05]"
                    : "border-ink-700 bg-ink-850"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "mono w-7 text-right text-lg tabular-nums",
                    isTop ? "text-mint" : isMe ? "text-flare" : "text-bone-dim"
                  )}
                >
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-base",
                    (isMe || isTop) && "display font-semibold"
                  )}
                >
                  {r.nickname}
                  {isMe && (
                    <span className="mono ml-2 text-[0.55rem] uppercase tracking-[0.22em] text-flare">
                      вы
                    </span>
                  )}
                </span>
              </div>
              <span className="mono text-xl tabular-nums">{r.score}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
