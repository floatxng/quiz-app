import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/me");

  const rooms = await prisma.room.findMany({
    where: { hostId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      quiz: { select: { title: true } },
      _count: { select: { participants: true } },
    },
  });

  return (
    <div className="space-y-8 rise">
      <div>
        <Link
          href="/dashboard"
          className="mono text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint hover:text-bone"
        >
          ← В кабинет
        </Link>
        <div className="mt-4 flex items-center gap-3 text-bone-dim">
          <Tally variant="off" />
          <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
            История
          </span>
        </div>
        <h1 className="h1 mt-3">История запусков</h1>
      </div>

      {rooms.length === 0 ? (
        <div className="card text-center">
          <div className="display-italic text-2xl text-bone-dim">
            Здесь пусто.
          </div>
          <p className="mt-2 text-sm text-bone-faint">
            Запустите квиз — он появится здесь.
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
                  Участн.
                </th>
                <th className="border-b border-ink-700 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, i) => (
                <tr
                  key={r.id}
                  className={i % 2 === 0 ? "bg-transparent" : "bg-ink-800/40"}
                >
                  <td className="px-5 py-3 text-sm text-bone-dim">
                    <span className="mono text-[0.7rem] uppercase tracking-[0.18em]">
                      {new Date(r.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className="display font-medium">
                      {r.quiz.title}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="mono text-sm tracking-[0.18em] text-bone-dim">
                      {r.code}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        r.status === "running"
                          ? "pill pill-live"
                          : r.status === "finished"
                            ? "pill"
                            : "pill pill-mint"
                      }
                    >
                      {r.status === "running"
                        ? "идёт"
                        : r.status === "finished"
                          ? "завершён"
                          : "лобби"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="mono tabular-nums">
                      {r._count.participants}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status !== "finished" && (
                      <Link
                        href={`/host/${r.code}`}
                        className="mono text-[0.7rem] uppercase tracking-[0.22em] text-flare hover:underline"
                      >
                        Открыть →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
