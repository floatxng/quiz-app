import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Tally, Crosshair } from "@/components/Brand";
import NewQuizForm from "./new-quiz-form";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/me");

  const [quizzes, totalRooms] = await Promise.all([
    prisma.quiz.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, rooms: true } },
      },
    }),
    prisma.room.count({ where: { hostId: user.id } }),
  ]);

  const totalQuestions = quizzes.reduce(
    (acc, q) => acc + q._count.questions,
    0
  );

  return (
    <div className="space-y-12 rise">
      <header className="space-y-5">
        <div className="flex items-center gap-3 text-bone-dim">
          <Tally variant="off" />
          <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
            Кабинет организатора
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="h1">
              Привет,
              <br />
              <span className="display-italic text-flare">{user.username}.</span>
            </h1>
            <p className="lead mt-3 max-w-xl">
              Создайте квиз, добавьте вопросы и запустите комнату. Каждый
              запуск получает уникальный шестизначный код.
            </p>
          </div>
          <Link href="/dashboard/history" className="btn-ghost">
            История запусков →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700">
          <Stat n={quizzes.length} label="Квизы" />
          <Stat n={totalQuestions} label="Вопросы" />
          <Stat n={totalRooms} label="Запуски" />
        </div>
      </header>

      <NewQuizForm />

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span className="eyebrow">Список</span>
            <h2 className="h2 mt-1">Мои квизы</h2>
          </div>
          <span className="mono text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint">
            Всего {quizzes.length.toString().padStart(2, "0")}
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="card text-center">
            <div className="display-italic text-2xl text-bone-dim">
              Здесь пусто.
            </div>
            <p className="mt-2 text-sm text-bone-faint">
              Создайте первый квиз.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.map((q, i) => (
              <Link
                key={q.id}
                href={`/dashboard/quiz/${q.id}`}
                className="card group transition hover:border-flare/50 hover:bg-ink-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mono text-[0.6rem] uppercase tracking-[0.32em] text-bone-faint">
                      № {(i + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="display mt-2 text-2xl font-semibold leading-tight">
                      {q.title}
                    </div>
                    {q.description && (
                      <div className="mt-2 line-clamp-2 text-sm text-bone-dim">
                        {q.description}
                      </div>
                    )}
                  </div>
                  <Crosshair className="mt-1 shrink-0 text-bone-faint transition-colors group-hover:text-flare" />
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-ink-700 pt-4 text-xs text-bone-faint">
                  <span className="mono uppercase tracking-[0.22em]">
                    {new Date(q.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-3">
                    <span>
                      <span className="mono text-bone">{q._count.questions}</span>{" "}
                      вопр.
                    </span>
                    <span className="text-bone-faint">·</span>
                    <span>
                      <span className="mono text-bone">{q._count.rooms}</span>{" "}
                      запуск.
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-ink-850 px-5 py-5">
      <div className="display text-4xl font-semibold tabular-nums text-flare">
        {n.toString().padStart(2, "0")}
      </div>
      <div className="mono mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-bone-faint">
        {label}
      </div>
    </div>
  );
}
