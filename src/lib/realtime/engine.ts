import type { Server, Socket } from "socket.io";
import { prisma } from "@/lib/db";
import type {
  ClientToServerEvents,
  FinalResult,
  LeaderboardEntry,
  PublicQuestion,
  QuestionResult,
  ServerToClientEvents,
} from "./types";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type ClientSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

type QuestionState = {
  index: number;
  startedAt: number;
  timeLimit: number;
  endsAt: number;
  // participantId -> { optionIds, answeredAt, awarded }
  answers: Map<string, { optionIds: string[]; answeredAt: number; awarded: number }>;
  timer?: NodeJS.Timeout;
  revealed: boolean;
};

type RoomRuntime = {
  code: string;
  hostSocketIds: Set<string>;
  // participantId -> socketId(s)
  participantSockets: Map<string, Set<string>>;
  current?: QuestionState;
};

const rooms = new Map<string, RoomRuntime>();

function getOrInitRuntime(code: string): RoomRuntime {
  let r = rooms.get(code);
  if (!r) {
    r = { code, hostSocketIds: new Set(), participantSockets: new Map() };
    rooms.set(code, r);
  }
  return r;
}

async function fetchRoom(code: string) {
  return prisma.room.findUnique({
    where: { code },
    include: {
      quiz: {
        include: {
          questions: {
            include: { options: { orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
          },
        },
      },
      participants: { orderBy: { joinedAt: "asc" } },
    },
  });
}

function publicizeQuestion(
  quiz: NonNullable<Awaited<ReturnType<typeof fetchRoom>>>["quiz"],
  index: number,
  startedAt: number
): PublicQuestion {
  const q = quiz.questions[index];
  return {
    index,
    total: quiz.questions.length,
    text: q.text,
    imageUrl: q.imageUrl,
    type: q.type as "single" | "multiple",
    timeLimit: q.timeLimit,
    points: q.points,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    startedAt,
  };
}

async function emitLobbyState(io: IO, code: string) {
  const room = await fetchRoom(code);
  if (!room) return;
  io.to(code).emit("lobby:state", {
    code: room.code,
    quizTitle: room.quiz.title,
    participants: room.participants.map((p) => ({ id: p.id, nickname: p.nickname })),
    status: room.status,
  });
}

async function buildLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
  const ps = await prisma.participant.findMany({
    where: { roomId },
    orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
  });
  return ps.map((p) => ({
    participantId: p.id,
    nickname: p.nickname,
    score: p.score,
    delta: 0,
  }));
}

async function revealAndScore(io: IO, code: string) {
  const r = rooms.get(code);
  if (!r || !r.current || r.current.revealed) return;
  r.current.revealed = true;
  if (r.current.timer) clearTimeout(r.current.timer);

  const room = await fetchRoom(code);
  if (!room) return;
  const q = room.quiz.questions[r.current.index];
  if (!q) return;

  const correctIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
  const correctList = [...correctIds];

  // Compute counts and persist scores.
  const perOptionCounts: Record<string, number> = Object.fromEntries(q.options.map((o) => [o.id, 0]));
  const deltas = new Map<string, number>();

  for (const [pid, a] of r.current.answers) {
    const selected = new Set(a.optionIds);
    for (const id of selected) {
      if (perOptionCounts[id] != null) perOptionCounts[id] += 1;
    }
    const isCorrect =
      selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
    let awarded = 0;
    if (isCorrect) {
      const elapsed = (a.answeredAt - r.current.startedAt) / 1000;
      const ratio = Math.max(0, 1 - elapsed / r.current.timeLimit);
      awarded = Math.round(q.points * (0.5 + 0.5 * ratio));
    }
    a.awarded = awarded;
    deltas.set(pid, awarded);
    await prisma.answer.upsert({
      where: {
        roomId_participantId_questionId: {
          roomId: room.id,
          participantId: pid,
          questionId: q.id,
        },
      },
      create: {
        roomId: room.id,
        participantId: pid,
        questionId: q.id,
        optionIds: JSON.stringify([...selected]),
        isCorrect,
        awardedPoints: awarded,
      },
      update: {
        optionIds: JSON.stringify([...selected]),
        isCorrect,
        awardedPoints: awarded,
      },
    });
    if (awarded > 0) {
      await prisma.participant.update({ where: { id: pid }, data: { score: { increment: awarded } } });
    }
  }

  const lb = await buildLeaderboard(room.id);
  for (const e of lb) e.delta = deltas.get(e.participantId) || 0;

  const result: QuestionResult = {
    index: r.current.index,
    correctOptionIds: correctList,
    perOptionCounts,
    leaderboard: lb,
  };
  io.to(code).emit("quiz:result", result);
}

async function moveToNext(io: IO, code: string) {
  const room = await fetchRoom(code);
  if (!room) return;
  const r = getOrInitRuntime(code);

  if (r.current && !r.current.revealed) {
    await revealAndScore(io, code);
  }

  const nextIndex = (room.currentIndex ?? -1) + 1;
  if (nextIndex >= room.quiz.questions.length) {
    await finishRoom(io, code);
    return;
  }

  const q = room.quiz.questions[nextIndex];
  const startedAt = Date.now();
  await prisma.room.update({
    where: { id: room.id },
    data: { status: "running", currentIndex: nextIndex, questionStart: new Date(startedAt) },
  });

  r.current = {
    index: nextIndex,
    startedAt,
    timeLimit: q.timeLimit,
    endsAt: startedAt + q.timeLimit * 1000,
    answers: new Map(),
    revealed: false,
  };

  io.to(code).emit("quiz:question", publicizeQuestion(room.quiz, nextIndex, startedAt));

  r.current.timer = setTimeout(() => {
    revealAndScore(io, code).catch((e) => console.error("[reveal timer]", e));
  }, q.timeLimit * 1000 + 200);
}

async function finishRoom(io: IO, code: string) {
  const room = await fetchRoom(code);
  if (!room) return;
  await prisma.room.update({
    where: { id: room.id },
    data: { status: "finished", finishedAt: new Date() },
  });
  const lb = await buildLeaderboard(room.id);
  const final: FinalResult = { leaderboard: lb };
  io.to(code).emit("quiz:final", final);
  const r = rooms.get(code);
  if (r?.current?.timer) clearTimeout(r.current.timer);
}

export function attachQuizHandlers(io: IO) {
  io.on("connection", (socket: ClientSocket) => {
    let joinedCode: string | null = null;
    let participantId: string | null = null;
    let isHost = false;

    socket.on("join:participant", async ({ code, nickname, userId }, ack) => {
      try {
        const room = await fetchRoom(code);
        if (!room) return ack({ ok: false, error: "Комната не найдена" });
        if (room.status === "finished") return ack({ ok: false, error: "Игра уже завершена" });

        const cleanNick = String(nickname || "").trim().slice(0, 24);
        if (!cleanNick) return ack({ ok: false, error: "Введите ник" });

        let participant = await prisma.participant.findUnique({
          where: { roomId_nickname: { roomId: room.id, nickname: cleanNick } },
        });
        if (!participant) {
          participant = await prisma.participant.create({
            data: { roomId: room.id, nickname: cleanNick, userId: userId || null },
          });
        }

        participantId = participant.id;
        joinedCode = code;
        socket.join(code);

        const rt = getOrInitRuntime(code);
        if (!rt.participantSockets.has(participant.id)) {
          rt.participantSockets.set(participant.id, new Set());
        }
        rt.participantSockets.get(participant.id)!.add(socket.id);

        ack({ ok: true, participantId: participant.id });
        await emitLobbyState(io, code);

        if (room.status === "running" && rt.current) {
          socket.emit(
            "quiz:question",
            publicizeQuestion(room.quiz, rt.current.index, rt.current.startedAt)
          );
        }
      } catch (e) {
        console.error("[join:participant]", e);
        ack({ ok: false, error: "Внутренняя ошибка" });
      }
    });

    socket.on("join:host", async ({ code, userId }, ack) => {
      try {
        const room = await fetchRoom(code);
        if (!room) return ack({ ok: false, error: "Комната не найдена" });
        if (room.hostId !== userId) return ack({ ok: false, error: "Только организатор" });
        joinedCode = code;
        isHost = true;
        socket.join(code);
        const rt = getOrInitRuntime(code);
        rt.hostSocketIds.add(socket.id);
        ack({ ok: true });
        await emitLobbyState(io, code);

        if (room.status === "running" && rt.current) {
          socket.emit(
            "quiz:question",
            publicizeQuestion(room.quiz, rt.current.index, rt.current.startedAt)
          );
        }
      } catch (e) {
        console.error("[join:host]", e);
        ack({ ok: false, error: "Внутренняя ошибка" });
      }
    });

    socket.on("host:next", async () => {
      if (!isHost || !joinedCode) return;
      await moveToNext(io, joinedCode).catch((e) => console.error("[host:next]", e));
    });

    socket.on("host:reveal", async () => {
      if (!isHost || !joinedCode) return;
      await revealAndScore(io, joinedCode).catch((e) => console.error("[host:reveal]", e));
    });

    socket.on("host:finish", async () => {
      if (!isHost || !joinedCode) return;
      await finishRoom(io, joinedCode).catch((e) => console.error("[host:finish]", e));
    });

    socket.on("answer:submit", async ({ optionIds }) => {
      if (!joinedCode || !participantId) return;
      const r = rooms.get(joinedCode);
      if (!r?.current || r.current.revealed) return;
      if (Date.now() > r.current.endsAt) return;
      if (r.current.answers.has(participantId)) return; // first answer wins
      const cleaned = Array.isArray(optionIds) ? optionIds.filter((x) => typeof x === "string") : [];
      r.current.answers.set(participantId, {
        optionIds: cleaned,
        answeredAt: Date.now(),
        awarded: 0,
      });

      // Notify host of progress.
      const room = await fetchRoom(joinedCode);
      if (room) {
        const totalParticipants = room.participants.length;
        const answeredCount = r.current.answers.size;
        const pp = room.participants.find((p) => p.id === participantId);
        if (pp) {
          io.to(joinedCode).emit("host:answers", {
            participantId: pp.id,
            nickname: pp.nickname,
            answeredCount,
            totalParticipants,
          });
        }
        if (answeredCount >= totalParticipants && totalParticipants > 0) {
          await revealAndScore(io, joinedCode);
        }
      }
    });

    socket.on("disconnect", () => {
      if (!joinedCode) return;
      const r = rooms.get(joinedCode);
      if (!r) return;
      if (isHost) r.hostSocketIds.delete(socket.id);
      if (participantId) {
        const set = r.participantSockets.get(participantId);
        set?.delete(socket.id);
        if (set && set.size === 0) r.participantSockets.delete(participantId);
      }
    });
  });
}
