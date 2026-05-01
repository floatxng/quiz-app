import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const participations = await prisma.participant.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: "desc" },
    take: 50,
    include: {
      room: { include: { quiz: { select: { title: true } } } },
    },
  });

  const totalScore = participations.reduce((acc, p) => acc + p.score, 0);
  const bestScore = participations.reduce(
    (acc, p) => Math.max(acc, p.score),
    0
  );

  return (
    <div className="space-y-10 rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-bone-dim">
            <Tally variant="off" />
            <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
              Личный кабинет ·{" "}
              {user.role === "ORGANIZER" ? "Организатор" : "Участник"}
            </span>
          </div>
          <h1 className="h1 mt-5">{user.username}</h1>
          <div className="mono mt-2 text-[0.7rem] uppercase tracking-[0.28em] text-bone-faint">
            {user.email}
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === "ORGANIZER" ? (
            <Link href="/dashboard" className="btn-ghost">
              В кабинет →
            </Link>
          ) : (
            <Link href="/play" className="btn-primary">
              Подключиться →
            </Link>
          )}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700">
        <Stat label="Игр" value={participations.length} />
        <Stat label="Всего очков" value={totalScore} />
        <Stat label="Лучший результат" value={bestScore} />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span className="eyebrow">История</span>
            <h2 className="h2 mt-1">История участия</h2>
          </div>
          <span className="mono text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint">
            Последние игры
          </span>
        </div>

        {participations.length === 0 ? (
          <div className="card text-center">
            <div className="display-italic text-2xl text-bone-dim">
              Здесь пусто.
            </div>
            <p className="mt-2 text-sm text-bone-faint">
              Подключитесь к первой комнате.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-850">
            <table className="w-full text-left">
              <thead>
                <tr className="mono text-[0.6rem] uppercase tracking-[0.22em] text-bone-faint">
                  <th className="border-b border-ink-700 px-5 py-3">Дата</th>
                  <th className="border-b border-ink-700 px-5 py-3">Квиз</th>
                  <th className="border-b border-ink-700 px-5 py-3">Комната</th>
                  <th className="border-b border-ink-700 px-5 py-3">Статус</th>
                  <th className="border-b border-ink-700 px-5 py-3 text-right">
                    Очки
                  </th>
                </tr>
              </thead>
              <tbody>
                {participations.map((p, i) => (
                  <tr
                    key={p.id}
                    className={
                      i % 2 === 0 ? "bg-transparent" : "bg-ink-800/40"
                    }
                  >
                    <td className="px-5 py-3 text-sm text-bone-dim">
                      <span className="mono text-[0.7rem] uppercase tracking-[0.18em]">
                        {new Date(p.joinedAt).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span className="display font-medium">
                        {p.room.quiz.title}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="mono text-sm tracking-[0.18em] text-bone-dim">
                        {p.room.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          p.room.status === "finished"
                            ? "pill"
                            : p.room.status === "running"
                              ? "pill pill-live"
                              : "pill"
                        }
                      >
                        {p.room.status === "finished"
                          ? "завершена"
                          : p.room.status === "running"
                            ? "идёт"
                            : "лобби"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="mono text-lg tabular-nums">
                        {p.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-850 px-5 py-5">
      <div className="display text-3xl font-semibold tabular-nums text-flare">
        {value.toLocaleString("ru-RU")}
      </div>
      <div className="mono mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-bone-faint">
        {label}
      </div>
    </div>
  );
}
