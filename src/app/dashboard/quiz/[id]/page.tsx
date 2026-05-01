import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";
import QuizEditor from "./editor";

export default async function QuizEditPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/me");

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        include: { options: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!quiz || quiz.ownerId !== user.id) notFound();

  return (
    <div className="space-y-8 rise">
      <div>
        <Link
          href="/dashboard"
          className="mono text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint hover:text-bone"
        >
          ← В кабинет
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-bone-dim">
              <Tally variant="off" />
              <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
                Редактор квиза
              </span>
            </div>
            <h1 className="h1 mt-3">{quiz.title}</h1>
            {quiz.description && (
              <p className="lead mt-2 max-w-xl text-base">{quiz.description}</p>
            )}
          </div>
          <form action={`/api/quizzes/${quiz.id}/start`} method="post">
            <button className="btn-primary px-5 py-3 text-base">
              ▶ Запустить квиз
            </button>
          </form>
        </div>
      </div>

      <QuizEditor
        quizId={quiz.id}
        initialQuestions={quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          imageUrl: q.imageUrl,
          type: q.type as "single" | "multiple",
          timeLimit: q.timeLimit,
          points: q.points,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        }))}
      />
    </div>
  );
}
